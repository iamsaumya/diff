import { Accessor, Mutator } from './types.js';

export const DEFAULT_ACCESSOR: Accessor = (_, key, target): unknown =>
  target[key];

export const DEFAULT_MUTATOR: Mutator = (_, key, target, value): unknown => {
  if (typeof value === 'undefined') {
    // Our default is to delete properties that are set to undefined
    // since simply setting it to undefined leaves the structure intact
    delete target[key];
    return value;
  }
  return (target[key] = value);
};

export const DEFAULT_INCLUDE_NON_ENUMERABLE = false;
export const DEFAULT_INCLUDE_SYMBOLS = false;
export const DEFAULT_INCLUDE_FUNCTIONS = false;
export const DEFAULT_IGNORE_ARRAY_ORDER = false;
export const DEFAULT_REPORT_TYPE_CHANGES = false;
export const DEFAULT_REPORT_PROPERTY_ORDER_CHANGES = false;
