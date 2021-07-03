import * as ko from "knockout";
import {CellGroupsIndices, Matrix, ViewModel} from "./lib";

const levelsData = [
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
