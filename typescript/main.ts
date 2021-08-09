import * as ko from "knockout";
import { CellGroupsIndices, Matrix, ViewModel } from "./lib";
import { data } from "./data";

const levelsData = data.easy
  .concat(data.medium)
  .concat(data.difficult)
  .concat(data.fiendish)
  .map((level) => {
    return new CellGroupsIndices(new Matrix(level));
  });
ko.applyBindings(new ViewModel(levelsData));
