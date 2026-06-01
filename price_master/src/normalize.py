# Placeholder for normalization dictionaries and functions

DICT_UNIT = {}
DICT_NAME = {}
DICT_TYPE = {}
DICT_EXCLUDE = {}


def load_dicts():
    # in future load from persistent storage or UI
    return DICT_UNIT, DICT_NAME, DICT_TYPE, DICT_EXCLUDE


def normalize_row(row):
    # apply dictionaries to raw fields
    return row
