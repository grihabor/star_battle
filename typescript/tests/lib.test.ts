import {CellGroups, CellGroupsIndices, Coords, GroupID, Matrix} from "../lib";

test('calculates unique indices', () => {

    const indices = new CellGroupsIndices(new Matrix<GroupID>([
        [1, 1, 1, 2, 2, 2, 2, 2, 2],
        [1, 3, 3, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3, 1, 1, 1, 1, 3],
        [3, 3, 3, 3, 3, 1, 1, 1, 3],
        [1, 3, 3, 3, 3, 3, 3, 1, 3],
        [1, 1, 3, 3, 2, 2, 2, 1, 1],
        [1, 1, 1, 1, 2, 2, 2, 3, 1],
        [3, 1, 1, 1, 1, 2, 2, 3, 1],
        [3, 3, 3, 1, 1, 1, 2, 3, 1],
    ]))
    const unique = indices.toUniqueCellGroupsIndices()
    const expected = new CellGroupsIndices(new Matrix<GroupID>([
        [0, 0, 0, 1, 1, 1, 1, 1, 1],
        [0, 2, 2, 1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 4, 4, 4, 4, 5],
        [2, 2, 2, 2, 2, 4, 4, 4, 5],
        [6, 2, 2, 2, 2, 2, 2, 4, 5],
        [6, 6, 2, 2, 7, 7, 7, 4, 4],
        [6, 6, 6, 6, 7, 7, 7, 8, 4],
        [9, 6, 6, 6, 6, 7, 7, 8, 4],
        [9, 9, 9, 6, 6, 6, 7, 8, 4],
    ])) 
    expect(unique).toStrictEqual(expected)
})

test("calculate cell groups", () => {
    const indices = new CellGroupsIndices(new Matrix<GroupID>([
        [0, 0, 1],
        [0, 1, 1],
        [2, 2, 2]
    ]))
    const cellGroups = indices.toCellGroups()
    const expected = new Map<GroupID, Array<Coords>>([
        [0, [new Coords(0, 0), new Coords(0, 1), new Coords(1, 0)]],
        [1, [new Coords(0, 2), new Coords(1, 1), new Coords(1, 2)]],
        [2, [new Coords(2, 0), new Coords(2, 1), new Coords(2, 2)]],
    ]);
    expect(cellGroups.groupToCells).toStrictEqual(expected)
})