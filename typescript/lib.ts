import * as ko from "knockout";

enum CellState {
    Empty = "item-cell item-cell-empty",
    Star = "item-cell item-cell-star",
    NoStar = "item-cell item-cell-no-star",
}

export class Matrix<T> {
    m: Array<Array<T>>;
    constructor(rows?: Array<Array<T>>) {
        this.m = rows != null ? rows : [];
    }
    iterRows(f: (y: number, x: number, val: T) => void) {
        for (let y = 0; y < this.m.length; y++) {
            let row = this.m[y];
            for (let x = 0; x < row.length; x++) {
                f(y, x, row[x]);
            }
        }
    }
    forEachRow(f: (row, y, arr) => void) {
        this.m.forEach(f);
    }
    forEachColumn(f: (column, x) => void) {
        if (this.m.length == 0) {
            return;
        }
        const width = this.m[0].length;
        for (let x = 0; x < width; x++) {
            f(this.column(x), x);
        }
    }
    row(y: number): T[] {
        const result = this.m[y];
        // console.log("row", result, y);
        return result;
    }
    column(x: number): T[] {
        const result = this.m.map((row) => row[x]);
        // console.log("column", result, x)
        return result;
    }

    by_coords(coords_arr: Coords[]): T[] {
        return coords_arr.map((coords: Coords) => {
            return this.m[coords.y][coords.x]
        })
    }
}

export class CellGroupsIndices {
    indices: Matrix<GroupID>;
    constructor(indices: Matrix<GroupID>) {
        this.indices = indices;
    }
    toUniqueCellGroupsIndices(): CellGroupsIndices {
        // clone indices matrix
        let uniqueIndicesWithDuplicates = new Matrix(
            this.indices.m.map(function (rows) {
                return rows.map(function (val) {
                    return val;
                });
            })
        );

        let lastGroupID: GroupID = 0
        const groupIDDuplicates: Record<GroupID, GroupID> = {};
        const indices = this.indices
        indices.iterRows((y, x, idx) => {
            let groupID;
            if (y == 0) {
                if (x == 0) {
                    groupID = lastGroupID;
                } else if (indices.m[y][x - 1] != idx) {
                    lastGroupID += 1
                    groupID = lastGroupID;
                } else {
                    groupID = uniqueIndicesWithDuplicates.m[y][x - 1];
                }
            } else {
                // decide on group id
                if (indices.m[y - 1][x] == idx) {
                    groupID = uniqueIndicesWithDuplicates.m[y - 1][x];
                } else if (x > 0 && indices.m[y][x - 1] == idx) {
                    groupID = uniqueIndicesWithDuplicates.m[y][x - 1];
                } else {
                    lastGroupID += 1
                    groupID = lastGroupID;
                }

                const firstCandidate = uniqueIndicesWithDuplicates.m[y - 1][x]
                const secondCandidate = uniqueIndicesWithDuplicates.m[y][x - 1]
                if (
                    x > 0 &&
                    indices.m[y - 1][x] == idx &&
                    indices.m[y][x - 1] == idx &&
                    firstCandidate != secondCandidate
                ) {
                    const minCandidate = Math.min(firstCandidate, secondCandidate)
                    const maxCandidate = Math.max(firstCandidate, secondCandidate)
                    // record the knowledge about the duplicate to merge them later
                    groupIDDuplicates[maxCandidate] = minCandidate
                }
            }
            uniqueIndicesWithDuplicates.m[y][x] = groupID;
        });

        // drop duplicates
        let uniqueIndices = uniqueIndicesWithDuplicates.m.map(function (row) {
            // we want to find the smallest duplicate groupID recursively
            const makeUnique = (value) => {
                if (value in groupIDDuplicates) {
                    return makeUnique(groupIDDuplicates[value]);
                } else {
                    return value;
                }
            }
            return row.map(makeUnique);
        });

        return new CellGroupsIndices(new Matrix<GroupID>(uniqueIndices));
    }

    toCellGroups(): CellGroups {
        // we assume that indices are unique
        let groups = new Map<GroupID, Array<Coords>>();
        this.indices.iterRows(function (y, x, groupID) {
            if (!groups.has(groupID)) {
                groups.set(groupID,[]);
            }
            groups.get(groupID).push(new Coords(y, x));
        });
        return new CellGroups(groups);
    }

    toGridBorders(): GridBorders {
        let indices = this.indices.m;
        if (indices.length == 0) {
            return new GridBorders([[]]);
        }
        if (indices[0].length == 0) {
            return new GridBorders(
                indices.map(function () {
                    return [];
                })
            );
        }
        let borders = Array();
        let height = indices.length;
        for (let y = 0; y < height; y++) {
            let row = Array();
            let width = indices[y].length;
            for (let x = 0; x < width; x++) {
                // we need the border if cells are from different groups
                // i.e. group indices are different
                let right = x < width - 1 ? indices[y][x] != indices[y][x + 1] : true;
                let bottom = y < height - 1 ? indices[y][x] != indices[y + 1][x] : true;
                let left = x > 0 ? indices[y][x] != indices[y][x - 1] : true;
                let top = y > 0 ? indices[y][x] != indices[y - 1][x] : true;
                row.push(new CellBorders(right, bottom, left, top));
            }
            borders.push(row);
        }
        console.log("borders", borders);
        return new GridBorders(borders);
    }
}

export type GroupID = number;

// CellGroups allows the users to answer the following questions:
// - i have groupID, which cells correspond to it?
// - i have cell coordinates, which groupID is the cell in?
//
// For the first question use groupToCells,
// for the second one - cellToGroup
export class CellGroups {
    groupToCells: Map<GroupID, Array<Coords>>;
    cellToGroup: Map<number, Map<number, GroupID>>; // cellToGroup[y][x]
    constructor(groupsCells: Map<GroupID, Array<Coords>>) {
        this.groupToCells = groupsCells;
        let cellToGroup = new Map<number, Map<number, GroupID>>();
        groupsCells.forEach(function (cells, groupID) {
            cells.forEach(function (coords) {
                if (!(coords.y in cellToGroup)) {
                    cellToGroup[coords.y] = new Map();
                }
                cellToGroup[coords.y][coords.x] = groupID;
            });
        });
        this.cellToGroup = cellToGroup;
    }
}

export class Coords {
    x: number;
    y: number;
    constructor(y: number, x: number) {
        this.x = x;
        this.y = y;
    }
}

type GridItem = Cell | VEdge | HEdge | Corner;
class HEdge {
    solid: boolean;
    constructor(solid: boolean) {
        this.solid = solid;
    }
    classes(): string {
        let s = "item-edge-horizontal";
        if (this.solid) {
            s += " item-edge-horizontal-solid";
        } else {
            s += " item-edge-horizontal-none";
        }
        return s;
    }
}
class VEdge {
    solid: boolean;
    constructor(solid: boolean) {
        this.solid = solid;
    }
    classes(): string {
        let s = "item-edge-vertical";
        if (this.solid) {
            s += " item-edge-vertical-solid";
        } else {
            s += " item-edge-vertical-none";
        }
        return s;
    }
}
class Corner {
    solid: boolean;
    constructor(solid: boolean) {
        this.solid = solid;
    }
    classes(): string {
        let s = "item-corner";
        if (this.solid) {
            s += " item-corner-solid";
        } else {
            s += " item-corner-none";
        }
        return s;
    }
}

class CellBorders {
    right: boolean;
    bottom: boolean;
    left: boolean;
    top: boolean;
    constructor(right: boolean, bottom: boolean, left: boolean, top: boolean) {
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.left = left;
    }
}

class GridBorders {
    borders: Array<Array<CellBorders>>;
    constructor(borders: Array<Array<CellBorders>>) {
        this.borders = borders;
    }
    toGrid(): Grid {
        const width = 9;
        let items = [];
        let cells = new Matrix<Cell>();
        this.borders.forEach(function (row, y) {
            {
                row.forEach(function (cellBorders, x) {
                    items.push(
                        new Corner(
                            cellBorders.top || cellBorders.left || (x > 0 && row[x - 1].top)
                        )
                    );
                    items.push(new HEdge(cellBorders.top));
                });
                // vertical border on the right
                items.push(new Corner(true));
            }

            {
                row.forEach(function (cellBorders, x) {
                    items.push(new VEdge(cellBorders.left));
                    let cell = new Cell(y * width + x, new Coords(y, x));
                    items.push(cell);

                    if (y >= cells.m.length) {
                        cells.m.push([]); // new row
                    }
                    cells.m[y].push(cell);
                });
                // vertical border on the right
                items.push(new HEdge(true));
            }
        });
        {
            this.borders[0].forEach(function () {
                items.push(new Corner(true));
                items.push(new HEdge(true));
            });
            items.push(new Corner(true));
        }
        return new Grid(items, cells);
    }
}

class Grid {
    items: Array<GridItem>;
    cells: Matrix<Cell>;
    constructor(items: Array<GridItem>, cells: Matrix<Cell>) {
        this.items = items;
        this.cells = cells;
    }
}

class Cell {
    state: KnockoutObservable<CellState>;
    highlight_error_row: KnockoutObservable<boolean>;
    highlight_error_column: KnockoutObservable<boolean>;
    highlight_error_group: KnockoutObservable<boolean>;
    highlight_error: KnockoutComputed<boolean>;
    classes: KnockoutComputed<string>;
    i: number;
    borders: CellBorders;
    coords: Coords;
    constructor(i: number, coords: Coords) {
        this.state = ko.observable(CellState.Empty);
        this.highlight_error_row = ko.observable(false);
        this.highlight_error_column = ko.observable(false);
        this.highlight_error_group = ko.observable(false);
        this.highlight_error = ko.computed(function () {
            return (
                this.highlight_error_row() ||
                this.highlight_error_column() ||
                this.highlight_error_group()
            );
        }, this);
        this.classes = ko.computed(function () {
            return (
                this.state() +
                (this.highlight_error()
                    ? " item-cell-highlight-error"
                    : " item-cell-no-error")
            );
        }, this);
        this.i = i;
        this.coords = coords;
    }
    toggleCellState() {
        let newState: CellState;
        switch (this.state.peek()) {
            case CellState.Empty:
                newState = CellState.NoStar;
                break;
            case CellState.Star:
                newState = CellState.Empty;
                break;
            case CellState.NoStar:
                newState = CellState.Star;
                break;
        }
        this.state(newState);
    }
}

class Level {
    i: number;
    indices: CellGroupsIndices;
    isCurrent: KnockoutObservable<boolean>;
    constructor(i: number, indices: CellGroupsIndices) {
        let self = this;
        self.i = i;
        self.indices = indices;
        self.isCurrent = ko.observable(false);
    }
}

export class ViewModel {
    cellGroups: CellGroups
    grid: KnockoutObservable<Grid>;
    toggleCellState: (number) => void;
    levels: Array<Level>;
    setLevel: (Level) => void;
    runGridChecks: (Cell) => void;
    constructor(levelsData: Array<CellGroupsIndices>) {
        let self = this;

        self.grid = ko.observable()
        self.setLevel = (level: Level) => {
            console.log("set level", level.i);
            const gridBorders = level.indices.toGridBorders();
            let grid = gridBorders.toGrid();
            self.grid(grid);
            level.isCurrent(true);

            const uniqueIndices = level.indices.toUniqueCellGroupsIndices()
            self.cellGroups = uniqueIndices.toCellGroups()
        };

        self.levels = levelsData.map(function (value, index) {
            return new Level(index, value);
        });

        self.toggleCellState = (cell: Cell) => {
            console.log("toggle state", cell.state(), cell.i);
            cell.toggleCellState();
            self.runGridChecks(cell);
        };

        self.runGridChecks = (cell: Cell) => {
            console.log("run grid checks");

            const highlightLineIfThereAreMoreThanTwoStars = (
                highlight_error: (Cell, boolean) => void,
                row,
            ) => {
                let starCount = row.reduce((acc, val) => {
                    return acc + (val.state() == CellState.Star ? 1 : 0);
                }, 0);
                row.forEach((cell: Cell): void => {
                    highlight_error(cell, starCount > 2);
                });
            };

            const cells = self.grid().cells;
            highlightLineIfThereAreMoreThanTwoStars(
                (cell: Cell, highlight: boolean) => {
                    console.log("highlight row", highlight);
                    return cell.highlight_error_row(highlight);
                },
                cells.row(cell.coords.y),
            );
            highlightLineIfThereAreMoreThanTwoStars(
                (cell: Cell, highlight: boolean) => {
                    return cell.highlight_error_column(highlight);
                },
                cells.column(cell.coords.x),
            );
            const groupID = self.cellGroups.cellToGroup.get(cell.coords.y).get(cell.coords.x)
            const coords_arr = self.cellGroups.groupToCells.get(groupID)
            highlightLineIfThereAreMoreThanTwoStars(
                (cell: Cell, highlight: boolean) => {
                    return cell.highlight_error_group(highlight);
                },
                cells.by_coords(coords_arr),
            )
        };

        // load first level on start
        self.setLevel(self.levels[0])
    }
}
