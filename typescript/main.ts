import * as ko from "knockout";

enum CellState {
  Empty = "item-cell item-cell-empty",
  Star = "item-cell item-cell-star",
  NoStar = "item-cell item-cell-no-star",
}

class Matrix<T> {
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
}

class CellGroupsIndices {
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

    let groupIDDuplicates = new Map<GroupID, GroupID>();
    this.indices.iterRows((y, x, idx) => {
      let groupID;
      if (y == 0) {
        if (x == 0) {
          groupID = 0;
        } else if (this.indices[y][x - 1] != idx) {
          groupID = uniqueIndicesWithDuplicates.m[y][x - 1] + 1;
        } else {
          groupID = uniqueIndicesWithDuplicates.m[y][x - 1];
        }
      } else {
        // decide on group id
        if (this.indices[y - 1][x] != idx) {
          groupID = uniqueIndicesWithDuplicates.m[y - 1][x] + 1;
        } else {
          groupID = uniqueIndicesWithDuplicates.m[y - 1][x];
        }

        if (
          x > 0 &&
          this.indices[y - 1][x] == idx &&
          this.indices[y][x - 1] == idx &&
          uniqueIndicesWithDuplicates.m[y - 1][x] !=
            uniqueIndicesWithDuplicates.m[y][x - 1]
        ) {
          // record the knowledge about the duplicate to merge them later
          groupIDDuplicates[uniqueIndicesWithDuplicates.m[y - 1][x]] =
            uniqueIndicesWithDuplicates.m[y][x - 1];
        }
      }
      uniqueIndicesWithDuplicates.m[y][x] = groupID;
    });

    // drop duplicates
    let uniqueIndices = uniqueIndicesWithDuplicates.m.map(function (row) {
      return row.map((value) => {
        if (value in groupIDDuplicates) {
          return groupIDDuplicates[value];
        } else {
          return value;
        }
      });
    });

    return new CellGroupsIndices(new Matrix<GroupID>(uniqueIndices));
  }

  toCellGroups(): CellGroups {
    // we assume that indices are unique
    let groups = new Map<GroupID, Array<Coords>>();
    this.indices.iterRows(function (y, x, val) {
      if (!(val in groups)) {
        groups[val] = [];
      }
      groups[val].push(new Coords(y, x));
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

type GroupID = number;

// CellGroups allows the users to answer the following questions:
// - i have groupID, which cells correspond to it?
// - i have cell coordinates, which groupID is the cell in?
//
// For the first question use groupToCells,
// for the second one - cellToGroup
class CellGroups {
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

class Coords {
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
  state(): string {
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
  state(): string {
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
  state(): string {
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
  i: number;
  borders: CellBorders;
  coords: Coords;
  constructor(i: number, coords: Coords) {
    this.state = ko.observable(CellState.Empty);
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

class ViewModel {
  grid: KnockoutObservable<Grid>;
  toggleCellState: (number) => void;
  levels: Array<Level>;
  setLevel: (Level) => void;
  runGridChecks: () => void;
  constructor(levelsData: Array<CellGroupsIndices>) {
    let self = this;
    // load first level on start

    let gridBorders = levelsData[0].toGridBorders();
    let grid = gridBorders.toGrid();
    console.log("initialized grid", grid.items.length);
    self.levels = levelsData.map(function (value, index) {
      return new Level(index, value);
    });
    self.levels[0].isCurrent(true);
    self.grid = ko.observable(grid);
    self.toggleCellState = (cell: Cell) => {
      console.log("toggle state", cell.state(), cell.i);
      cell.toggleCellState();
      self.runGridChecks();
    };
    self.setLevel = (level: Level) => {
      console.log("set level", level.i);
      let gridBorders = level.indices.toGridBorders();
      let grid = gridBorders.toGrid();
      self.grid(grid);
      level.isCurrent(true);
    };
    self.runGridChecks = () => {
      console.log("run grid checks");
      let cells = self.grid().cells;
      cells.m.forEach(function (row, y) {
        let starCount = row.reduce((acc, val) => {
          return acc + (val.state() == CellState.Star ? 1 : 0);
        }, 0);
        if (starCount > 2) {
          console.log("star count", starCount, y);
        }
      });
    };
  }
}
let levelsData = [
  new CellGroupsIndices(
    new Matrix([
      [1, 1, 1, 2, 2, 2, 2, 2, 2],
      [1, 3, 3, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 1, 1, 1, 1, 3],
      [3, 3, 3, 3, 3, 1, 1, 1, 3],
      [1, 3, 3, 3, 3, 3, 3, 1, 3],
      [1, 1, 3, 3, 2, 2, 2, 1, 1],
      [1, 1, 1, 1, 2, 2, 2, 3, 1],
      [3, 1, 1, 1, 1, 2, 2, 3, 1],
      [3, 3, 3, 1, 1, 1, 2, 3, 1],
    ])
  ),
  new CellGroupsIndices(
    new Matrix([
      [1, 1, 1, 1, 2, 2, 3, 3, 3],
      [1, 1, 3, 1, 2, 2, 2, 2, 1],
      [1, 1, 3, 3, 4, 2, 2, 2, 1],
      [2, 1, 3, 1, 4, 2, 2, 1, 1],
      [2, 1, 1, 1, 4, 3, 2, 1, 1],
      [2, 1, 1, 3, 3, 3, 3, 1, 1],
      [2, 2, 2, 3, 3, 3, 3, 1, 1],
      [2, 2, 2, 2, 3, 3, 3, 1, 1],
      [2, 2, 2, 4, 4, 4, 1, 1, 1],
    ])
  ),
];
ko.applyBindings(new ViewModel(levelsData));
