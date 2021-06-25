import * as ko from "knockout";

enum CellState {
  Empty = "item-cell item-cell-empty",
  Star = "item-cell item-cell-star",
  NoStar = "item-cell item-cell-no-star",
}

class CellGroupsIndices {
  indices: Array<Array<number>>;
  constructor(indices: Array<Array<number>>) {
    this.indices = indices;
  }
  toGridBorders(): GridBorders {
    let indices = this.indices;
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
    let items = Array();
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
          items.push(new Cell(y * width + x));
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
    return new Grid(items);
  }
}

class Grid {
  items: Array<GridItem>;
  constructor(items: Array<GridItem>) {
    this.items = items;
  }
}

class Cell {
  state: KnockoutObservable<CellState>;
  i: number;
  borders: CellBorders;
  constructor(i: number) {
    this.state = ko.observable(CellState.Empty);
    this.i = i;
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
  constructor(i: number, indices: CellGroupsIndices) {
    let self = this;
    self.i = i;
    self.indices = indices;
  }
}

class ViewModel {
  grid: KnockoutObservable<Grid>;
  toggleCellState: (number) => void;
  levels: Array<Level>;
  setLevel: (Level) => void;
  constructor(levelsData: Array<CellGroupsIndices>) {
    let self = this;
    // load first level on start
    let gridBorders = levelsData[0].toGridBorders();
    let grid = gridBorders.toGrid();
    console.log("initialized grid", grid.items.length);
    self.levels = levelsData.map(function (value, index) {
      return new Level(index, value);
    });
    self.grid = ko.observable(grid);
    self.toggleCellState = function (cell: Cell) {
      console.log("toggle state", cell.state.peek(), cell.i);
      cell.toggleCellState();
    };
    self.setLevel = function (level: Level) {
      console.log("set level", level.i);
      let gridBorders = level.indices.toGridBorders();
      let grid = gridBorders.toGrid();
      self.grid(grid);
    };
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
  new CellGroupsIndices([
    [1, 1, 1, 1, 2, 2, 3, 3, 3],
    [1, 1, 3, 1, 2, 2, 2, 2, 1],
    [1, 1, 3, 3, 4, 2, 2, 2, 1],
    [2, 1, 3, 1, 4, 2, 2, 1, 1],
    [2, 1, 1, 1, 4, 3, 2, 1, 1],
    [2, 1, 1, 3, 3, 3, 3, 1, 1],
    [2, 2, 2, 3, 3, 3, 3, 1, 1],
    [2, 2, 2, 2, 3, 3, 3, 1, 1],
    [2, 2, 2, 4, 4, 4, 1, 1, 1],
  ]),
];
ko.applyBindings(new ViewModel(levelsData));
