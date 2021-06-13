import * as ko from 'knockout';

enum CellState {
    Empty = "state-empty",
    Star = "state-star",
    NoStar = "state-no-star"
}

class Cell {
    state: KnockoutObservable<CellState>
    i: number
    constructor(i: number) {
        this.state = ko.observable(CellState.Empty)
        this.i = i
    }
    toggleCellState() {
        let newState: CellState
        switch (this.state.peek()) {
        case CellState.Empty:
            newState = CellState.Star
            break
        case CellState.Star:
            newState = CellState.NoStar
            break
        case CellState.NoStar:
            newState = CellState.Empty
            break
        }
        this.state(newState)
    }
}

class ViewModel {
    cells: Array<Cell>
    toggleCellState: (number) => void
    constructor() {
        let self = this
        self.cells = Array.from(Array(100).keys()).map(
            function (i) {return new Cell(i)},
        )
        self.toggleCellState = function (cell: Cell) {
            console.log("toggle state", cell.state.peek(), cell.i)
            cell.toggleCellState()
        }
    }
}
ko.applyBindings(new ViewModel());
