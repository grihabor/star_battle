import operator
import os
import json
import numpy as np
import sys
import cv2 as cv
import matplotlib.pyplot as plt

BOARD_SIZE = 9


def take_center_square(img_color):
    img_color = cv.cvtColor(img_color, cv.COLOR_BGR2RGB)
    height, width = img_color.shape[:2]
    center_vertical = height / 2.
    y_start, y_end = int(center_vertical - width / 2.), int(center_vertical + width / 2.)
    return img_color[y_start:y_end]


def remove_margin(img_color):
    margin_color = img_color[5, 5]

    epsilon = 5
    find_first = lambda line: np.argmax(np.sum(np.abs(line - margin_color), axis=1) > epsilon)

    y_line = int(img_color.shape[0] / 2)
    first_line = img_color[y_line, :]
    x_start = find_first(first_line)
    x_end = img_color.shape[1] - find_first(first_line[::-1])

    x_column = int(img_color.shape[1] / 2)
    a_column = img_color[:, x_column]
    y_start = find_first(a_column)
    y_end = a_column.shape[0] - find_first(a_column[::-1])

    return img_color[y_start:y_end, x_start:x_end]


def get_square_colors(img_color):
    margin = 5
    width = img_color.shape[1]
    single_square_width = (width - 2 * margin) / float(BOARD_SIZE)
    start = int(single_square_width / 4) + margin
    end = int(width - single_square_width / 4)
    step = int(single_square_width)
    square_colors = img_color[
                    start:end:step,
                    start:end:step
                    ]
    return square_colors


def to_hex(img_color):
    img = img_color.astype(np.int32)
    return (img[:, :, 0] << 16) + (img[:, :, 1] << 8) + img[:, :, 2]


def merge_close_square_colors(square_colors):
    new_shape = (square_colors.shape[0] * square_colors.shape[1], square_colors.shape[2])
    reshaped = np.reshape(square_colors, new_shape)
    unique = np.unique(reshaped, axis=0)
    distance = pairwise_distance(unique)
    indices = np.argwhere(distance < 5)
    # keep only groups to be merged
    mapping = {k: v for k, v in indices if k > v}

    # replace values to merge groups
    for k, v in mapping.items():
        value_to_be_replaced = unique[k]
        new_value = unique[v]
        print('merge groups', value_to_be_replaced, new_value, file=sys.stderr)
        # print(square_colors, value_to_be_replaced, new_value)
        np.copyto(square_colors, new_value[np.newaxis, np.newaxis, :], where=square_colors == value_to_be_replaced)

    return square_colors


def pairwise_distance(unique):
    unique_repeated = np.repeat([unique], len(unique), axis=0)
    diff = np.int32(unique_repeated) - np.int32(unique[:, np.newaxis, :])
    norm = np.linalg.norm(diff, ord=1, axis=2)
    return norm


def parse_screenshot(path):
    img_color = cv.imread(path)
    img_color = take_center_square(img_color)
    img_color = remove_margin(img_color)
    square_colors = get_square_colors(img_color)
    square_colors = merge_close_square_colors(square_colors)
    square_colors = to_hex(square_colors)
    converted = [[int(x) for x in row] for row in square_colors]
    return converted


def main(path):
    if os.path.isfile(path):
        print(json.dumps(parse_screenshot(path)))
        return

    if not os.path.isdir(path):
        raise ValueError("path must be dir: {}".format(path))

    filenames = os.listdir(path)
    paths = sorted([os.path.join(path, filename) for filename in filenames])
    print(json.dumps([
        _parse_screenshot(path)
        for path in paths
    ]))


def _parse_screenshot(path):
    print(path, file=sys.stderr)
    return parse_screenshot(path)


if __name__ == '__main__':
    main(sys.argv[1])