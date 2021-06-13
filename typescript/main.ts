import * as ko from 'knockout';

enum CellState {
    Empty = "state-empty",
    Star = "state-star",
    NoStar = "state-no-star"
}


class CellGroupsIndices {
    indices: Array<Array<number>>
    constructor(indices: Array<Array<number>>) {
        this.indices = indices
    }
    toGroups(): CellGroups {
        let indices = this.indices
        if (indices.length == 0) {
            return new CellGroups([[]])
        }
        if (indices[0].length == 0) {
            return new CellGroups(indices.map(function (){return []}))
        }
        let borders = Array()
        let height = indices.length
        for (let y = 0; y < height; y++) {
            let row = Array()
            let width = indices[y].length
            for (let x = 0; x < width; x++) {
                // we need the border if cells are from different groups
                // i.e. group indices are different
                let right = x < width - 1 ? (indices[y][x] != indices[y][x + 1]) : false
                let bottom = y < height - 1 ? (indices[y][x] != indices[y + 1][x]) : false
                row.push(new CellBorders(right, bottom))
            }
            borders.push(row)
        }
        console.log('borders', borders)
        return new CellGroups(borders)
    }
}

class CellBorders {
    right: boolean
    bottom: boolean
    constructor(right: boolean, bottom: boolean) {
        this.right = right
        this.bottom = bottom
    }
    toString(): string {
        let result = ''
        if (this.right) {
            result += ' cell-border-right'
        }
        if (this.bottom) {
            result += ' cell-border-bottom'
        }
        return result
    }
}

class CellGroups {
    borders: Array<Array<CellBorders>>
    constructor(borders: Array<Array<CellBorders>>) {
        this.borders = borders
    }
}

class Cell {
    state: KnockoutObservable<CellState>
    i: number
    borders: CellBorders
    constructor(i: number, borders: CellBorders) {
        this.state = ko.observable(CellState.Empty)
        this.i = i
        this.borders = borders
    }
    toggleCellState() {
        let newState: CellState
        switch (this.state.peek()) {
        case CellState.Empty:
            newState = CellState.NoStar
            break
        case CellState.Star:
            newState = CellState.Empty
            break
        case CellState.NoStar:
            newState = CellState.Star
            break
        }
        this.state(newState)
    }
}

class ViewModel {
    cells: Array<Cell>
    toggleCellState: (number) => void
    constructor(levelsData: Array<CellGroupsIndices>) {
        let self = this
        let cells = Array()
        // load first level for now
        let groups = levelsData[0].toGroups()
        groups.borders.forEach(function (row, y) {
            row.forEach(function (value, x) {
                const width = 9
                cells.push(new Cell(y*width+x, value))
            })
        })
        console.log("initialized cells", cells.length)
        self.cells = cells
        self.toggleCellState = function (cell: Cell) {
            console.log("toggle state", cell.state.peek(), cell.i)
            cell.toggleCellState()
        }
    }
}
let levelsData = [
    new CellGroupsIndices([
        [1, 1, 1, 2, 2, 2, 2, 2, 2],
        [1, 3, 3, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3, 1, 1, 1, 1, 3],
        [3, 3, 3, 3, 3, 1, 1, 1, 3],
        [1, 3, 3, 3, 3, 3, 3, 1, 3],
        [1, 1, 3, 3, 2, 2, 2, 1, 1],
        [1, 1, 1, 1, 2, 2, 2, 3, 1],
        [3, 1, 1, 1, 1, 2, 2, 3, 1],
        [3, 3, 3, 1, 1, 1, 2, 3, 1],
    ]),
]
ko.applyBindings(new ViewModel(levelsData));
