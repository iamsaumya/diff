import { calculatePropertySet } from './calculate-property-set.js';
import {
  ExtendedTypeOf,
  PropertyAssignable,
  extendedTypeOf,
} from './extended-type-of.js';
import { murmur3Hash32 } from './murmur3-32.js';
import {
  Accessor,
  Changes,
  Deserializer,
  Mutator,
  Normalize,
  PathSegments,
  PropertyChange,
  PropertyChangeKinds,
  PropertyChangeWithComparand,
  PropertyChangeWithSubject,
  PropertyFilter,
  Serializer,
} from './types.js';
import { comparePaths } from './compare-paths.js';
import {
  DEFAULT_ACCESSOR,
  DEFAULT_IGNORE_ARRAY_ORDER,
  DEFAULT_INCLUDE_FUNCTIONS,
  DEFAULT_INCLUDE_NON_ENUMERABLE,
  DEFAULT_INCLUDE_SYMBOLS,
  DEFAULT_MUTATOR,
  DEFAULT_REPORT_PROPERTY_ORDER_CHANGES,
  DEFAULT_REPORT_TYPE_CHANGES,
} from './constants.js';
import { ChangeRecord } from './changes/change-record.js';
import { PropertyAddedRecord } from './changes/property-added-record.js';
import { PropertyEditedRecord } from './changes/property-edited-record.js';
import { PropertyRemovedRecord } from './changes/property-removed-record.js';
import {
  PropertyChangeRecord,
  PropertyChangeRecords,
} from './changes/types.js';
import {
  PathAndPointer,
  encodePointer,
  parentPath,
} from './path-pointers/index.js';
import { ChangeSet } from './changes/change-set.js';

function fixPath(path: PathSegments): PathSegments {
  return path.length && path[0] === '' ? path.slice(1) : path;
}

type Indices = [number[], number[]];
type ArrayMember = {
  left: unknown;
  right: unknown;
  leftHash: number;
  rightHash: number;
  leftIndices?: Indices;
  rightIndices?: Indices;
};
type ArrayMembers = ArrayMember[];

function descendPath(
  target: unknown,
  path: PathSegments,
  accessor: Accessor,
  mutator: Mutator,
  createDuringDescent = true,
): [unknown, PropertyKey] {
  if (typeof target !== 'object') throw Error("Don't know how to do that!");
  let descent: object | unknown = target;
  const last = path.length - 1;
  let i = -1;
  while (++i < last) {
    const key = path[i];
    const subpath = path.slice(0, i + 1);
    let prop = accessor(subpath, key, descent);
    if (prop === undefined || (prop === null && createDuringDescent)) {
      // If creating during descent, we infer the structure as either an
      // object in the case of a string or symbol key, otherwise an array.
      prop = mutator(
        subpath,
        key,
        descent,
        typeof path[i + 1] === 'number' ? [] : {},
      );
    }
    descent = prop;
  }
  let prop = accessor(path, path[last], descent);
  if (createDuringDescent && (prop === undefined || prop === null)) {
    // If creating during descent, we infer the structure as either an
    // object in the case of a string or symbol key, otherwise an array.
    prop = mutator(
      path,
      path[last],
      descent,
      typeof path[i + 1] === 'number' ? [] : {},
    );
  }
  return [descent, path[last]];
}

const DEFAULT_SERIALIZER: Serializer = (...changes: Changes[]): string => {
  return JSON.stringify(
    changes.length && !Array.isArray(changes[0])
      ? changes[0].compact(true)
      : changes.flat().map((it) => it.compact(true)),
  );
};
const DEFAULT_DESERIALIZER: Deserializer = (source: string): Changes => {
  const it = JSON.parse(source);
  return Array.isArray(it)
    ? it.map(ChangeRecord.from.bind(null))
    : ChangeRecord.from(it);
};

export interface DeepDiffOptions {
  includeNonEnumerable?: boolean;
  includeSymbols?: boolean;
  includeFunctions?: boolean;
  ignoreArrayOrder?: boolean;
  ignoreProperties?: PathSegments;
  ignorePaths?: string[];
  reportTypePropertyChanges?: boolean;
  reportPropertyOrderPropertyChanges?: boolean;
  serializer?: Serializer;
  deserializer?: Deserializer;
  filter?: PropertyFilter;
  normalize?: Normalize;
  accessor?: Accessor;
  mutator?: Mutator;
}

export class DeepDiff {
  public static DEFAULT_OPTIONS: DeepDiffOptions = {
    includeNonEnumerable: DEFAULT_INCLUDE_NON_ENUMERABLE,
    includeSymbols: DEFAULT_INCLUDE_SYMBOLS,
    includeFunctions: DEFAULT_INCLUDE_FUNCTIONS,
    ignoreArrayOrder: DEFAULT_IGNORE_ARRAY_ORDER,
    reportTypePropertyChanges: DEFAULT_REPORT_TYPE_CHANGES,
    reportPropertyOrderPropertyChanges: DEFAULT_REPORT_PROPERTY_ORDER_CHANGES,
    serializer: DEFAULT_SERIALIZER,
    deserializer: DEFAULT_DESERIALIZER,
    accessor: DEFAULT_ACCESSOR,
    mutator: DEFAULT_MUTATOR,
  };

  public includeNonEnumerable: boolean;
  public includeSymbols: boolean;
  public includeFunctions: boolean;
  public ignoreArrayOrder: boolean;
  public ignoreProperties?: PathSegments;
  public ignorePaths?: string[];
  public reportTypePropertyChanges: boolean;
  public reportPropertyOrderPropertyChanges: boolean;
  public serializer: Serializer;
  public deserializer: Deserializer;
  public filter?: PropertyFilter;
  public normalize?: Normalize;
  public accessor: Accessor;
  public mutator: Mutator;

  private ignoring: boolean;

  constructor(options?: DeepDiffOptions) {
    const {
      includeNonEnumerable,
      includeSymbols,
      includeFunctions,
      ignoreArrayOrder,
      ignoreProperties,
      ignorePaths,
      reportTypePropertyChanges,
      reportPropertyOrderPropertyChanges,
      serializer,
      deserializer,
      filter,
      normalize,
      accessor,
      mutator,
    } = {
      ...DeepDiff.DEFAULT_OPTIONS,
      ...options,
    };
    this.includeNonEnumerable = includeNonEnumerable;
    this.includeSymbols = includeSymbols;
    this.includeFunctions = includeFunctions;
    this.ignoreArrayOrder = ignoreArrayOrder;
    this.ignoreProperties = ignoreProperties;
    this.ignorePaths = ignorePaths;
    this.ignoring = (ignoreProperties || ignorePaths) !== undefined;
    this.reportTypePropertyChanges = reportTypePropertyChanges;
    this.reportPropertyOrderPropertyChanges =
      reportPropertyOrderPropertyChanges;
    this.serializer = serializer || DEFAULT_SERIALIZER;
    this.deserializer = deserializer || DEFAULT_DESERIALIZER;
    this.filter = filter || null;
    this.normalize = normalize || null;
    this.accessor = accessor;
    this.mutator = mutator;
  }

  listComparableMembers(
    subject: unknown,
    path?: PathSegments,
    cache?: Map<unknown, PathSegments>,
    isArray = false,
  ): PathSegments {
    path = path || [];
    if (
      subject === undefined ||
      subject === null ||
      !PropertyAssignable.get(extendedTypeOf(subject))
    ) {
      return [];
    }
    if (cache && cache.has(subject)) return cache.get(subject);
    const { includeNonEnumerable, includeSymbols, includeFunctions } = this;
    let props: PathSegments = Object.getOwnPropertyNames(subject);
    if (includeSymbols) {
      props = [...props, ...Object.getOwnPropertySymbols(subject)];
    }
    const res: PathSegments = [];
    for (const nameOrSymbol of props) {
      if (typeof nameOrSymbol === 'symbol' && !includeSymbols) continue;
      // for array types, filter length and array elements...
      if (
        (isArray &&
          (nameOrSymbol === 'length' ||
            String(Number(nameOrSymbol)) === nameOrSymbol)) ||
        (this.ignoring && this._ignoreProperty(path, nameOrSymbol))
      ) {
        continue;
      }
      const { value, get, enumerable } = Object.getOwnPropertyDescriptor(
        subject,
        nameOrSymbol,
      );
      if (!enumerable && !includeNonEnumerable) continue;
      // Getters shouldn't have side-effects, but many programs are suspect!
      // TODO: consider accessor when getting from getter!
      const resolvedValue = value || (get && subject[nameOrSymbol]);
      if (typeof resolvedValue === 'function' && !includeFunctions) continue;
      res.push(nameOrSymbol);
    }
    if (cache) cache.set(subject, res);
    return res;
  }

  _ignoreProperty(path: PathSegments, prop: PropertyKey): boolean {
    const { ignoring, ignoreProperties, ignorePaths } = this;
    if (ignoring && ignoreProperties && ignoreProperties.indexOf(prop) !== -1)
      return true;
    if (ignoring && ignorePaths) {
      const pointer = encodePointer(path);
      const len = ignorePaths.length;
      let i = -1;
      while (++i < len) {
        if (pointer.indexOf(ignorePaths[i]) === 0) return true;
      }
    }
    return false;
  }

  *changes(
    subject: unknown,
    comparand: unknown,
    path?: PathSegments,
    leftStack?: Map<unknown, number>,
    rightStack?: Map<unknown, number>,
  ): Generator<PropertyChange> {
    path = path || [];
    const { filter, normalize, accessor } = this;
    if (filter && filter(path, subject, comparand)) return;
    if (normalize) {
      const [normalizedSubject, normalizedComparand] = normalize(
        path,
        subject,
        comparand,
      );
      subject = normalizedSubject;
      comparand = normalizedComparand;
    }
    if (subject === comparand) return;
    leftStack = leftStack || new Map<unknown, number>();
    rightStack = rightStack || new Map<unknown, number>();
    const propCache = new Map<unknown, PathSegments>();
    const subjectType = extendedTypeOf(subject);
    const comparandType = extendedTypeOf(comparand);
    const propertyTypeChanged = subjectType != comparandType;
    if (propertyTypeChanged && comparandType === ExtendedTypeOf.undefined) {
      // short-circuit on deletes
      yield new PropertyRemovedRecord(path.slice(0), subject);
      return;
    }
    const descending =
      PropertyAssignable.get(comparandType) && subject !== comparand;

    const leftCycles = descending && leftStack.get(subject);
    const rightCycles = descending && rightStack.get(comparand);
    if (descending) {
      leftStack.set(subject, path.length);
      rightStack.set(comparand, path.length);
    }
    try {
      switch (subjectType) {
        case ExtendedTypeOf.object:
          if (propertyTypeChanged) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
            return;
          }
          break;
        case ExtendedTypeOf.array:
          if (propertyTypeChanged) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
            return;
          }
          yield* this._arrayPropertyChanges(
            path,
            subject as Array<unknown>,
            comparand as Array<unknown>,
            leftStack,
            rightStack,
          );
          break;
        case ExtendedTypeOf.date:
          if (
            propertyTypeChanged ||
            (subject as Date).valueOf() !== (comparand as Date).valueOf()
          ) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
            if (propertyTypeChanged) return;
          }
          break;
        case ExtendedTypeOf.function:
          if (
            !propertyTypeChanged &&
            subject.toString() !== comparand.toString()
          ) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
          }
          break;
        case ExtendedTypeOf.regexp:
          if (String(subject) !== String(comparand)) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
            return;
          }
          break;
        case ExtendedTypeOf.number: {
          const bothNaN =
            isNaN(subject as number) && isNaN(comparand as number);
          if (propertyTypeChanged || (subject !== comparand && !bothNaN)) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
          }
          return;
        }
        case ExtendedTypeOf.bigint:
        case ExtendedTypeOf.null:
        case ExtendedTypeOf.string:
        case ExtendedTypeOf.symbol:
        case ExtendedTypeOf.undefined:
          if (propertyTypeChanged || subject !== comparand) {
            yield new PropertyEditedRecord(path.slice(0), subject, comparand);
          }
          return;
      }

      if (!descending) {
        yield new PropertyEditedRecord(path.slice(0), subject, comparand);
        return;
      }
      if (leftCycles === rightCycles && leftCycles !== undefined) return;
      const propsLeft = this.listComparableMembers(
        subject,
        path,
        propCache,
        subjectType === ExtendedTypeOf.array,
      );
      const propsRight = this.listComparableMembers(
        comparand,
        path,
        propCache,
        comparandType === ExtendedTypeOf.array,
      );
      const props = calculatePropertySet(propsLeft, propsRight).reverse();
      // Handle empty object case...
      if (props.length === 0) return;
      while (props.length) {
        const [key, leftIndex, rightIndex] = props.pop();
        path.push(key);
        try {
          if (leftIndex === undefined) {
            yield new PropertyAddedRecord(
              path.slice(0),
              accessor(path, key, comparand),
            );
            continue;
          }
          if (rightIndex === undefined) {
            yield new PropertyRemovedRecord(
              path.slice(0),
              accessor(path, key, subject),
            );
            continue;
          }
          const left = accessor(path, key, subject);
          const right = accessor(path, key, comparand);
          yield* this.changes(left, right, path, leftStack, rightStack);
        } finally {
          path.pop();
        }
      }
    } finally {
      if (descending) {
        leftStack.delete(subject);
        rightStack.delete(comparand);
      }
    }
  }

  *calculateChangeSets(
    target: unknown,
    changes: PropertyChange[],
  ): Generator<ChangeSet> {
    const { accessor, mutator } = this;
    const sorted = changes.sort(({ path: a }, { path: b }): number =>
      comparePaths(a, b),
    );
    const len = sorted.length;
    let i = -1;
    let cacheTarget: unknown;
    let cacheParent: PathAndPointer;
    let cacheChanges: PropertyChange[];
    while (++i < len) {
      const change = ChangeRecord.from(sorted[i]) as PropertyChangeRecord;
      const parent = parentPath(change.path);
      if (cacheParent?.pointer !== parent.pointer) {
        if (cacheParent) {
          yield ChangeSet.from({
            target: cacheTarget,
            path: cacheParent.path,
            changes: cacheChanges,
          });
        }
        if (parent.path.length) {
          const [descent, key] = descendPath(
            target,
            parent.path,
            accessor,
            mutator,
            true,
          );
          cacheTarget = accessor(parent.path, key, descent);
        } else {
          cacheTarget = target;
        }
        cacheParent = parent;
        cacheChanges = [];
      }
      cacheChanges.push(change);
    }
    if (cacheParent) {
      yield ChangeSet.from({
        target: cacheTarget,
        path: cacheParent.path,
        changes: cacheChanges,
      });
    }
  }

  apply(target: unknown, ...changes: Changes[]): unknown {
    const { accessor, mutator } = this;
    const flat = changes.flat();
    if (flat.length === 1 && flat[0].path.length === 0) {
      // Special case; root object changed
      const change = ChangeRecord.from(flat[0]) as PropertyChangeRecord;
      return change.kind !== PropertyChangeKinds.remove
        ? (change as PropertyChangeWithComparand).comparand
        : undefined;
    }
    for (const change of this.calculateChangeSets(target, flat)) {
      change.apply(accessor, mutator);
    }
    return target;
  }

  revert(target: unknown, ...changes: Changes[]): unknown {
    const { accessor, mutator } = this;
    const flat = changes.flat();
    if (flat.length === 1 && flat[0].path.length === 0) {
      // Special case; root object changed
      const change = ChangeRecord.from(flat[0]) as PropertyChangeRecord;
      return (change as PropertyChangeWithSubject).subject;
    }
    for (const change of this.calculateChangeSets(target, flat)) {
      change.revert(accessor, mutator);
    }
    return target;
  }

  /**
   * Used internally to calculates the changes within an array, using an
   * implementation of the levenshtein distance algorithm that allows us to
   * report each change. It is a memory efficient O(n+1) version, that
   * avoids allocating a matrix.
   *
   * There are faster implementations, but they throw away information
   * necessary to report the differences. The straight levenshtein distance
   * is concerned with the number of differences, whereas we need the
   * kinds of differences and where they occur.
   */
  *_arrayPropertyChanges(
    path: PathSegments,
    subject: unknown[],
    comparand: unknown[],
    leftStack: Map<unknown, number>,
    rightStack: Map<unknown, number>,
  ): Generator<PropertyChange> {
    let leftLen = subject.length;
    let rightLen = comparand.length;

    if (subject === comparand || (rightLen === 0 && leftLen === 0)) return;
    const filter = this.filter;
    const cache = new Map<unknown, number>();
    const { members, map } = this._indexMembers(
      subject,
      comparand,
      path,
      cache,
    );

    // remove equal ends of the array
    let offset = 0;
    let leftEnd = leftLen;
    let rightEnd = rightLen;

    while (
      offset < leftEnd &&
      offset < rightEnd &&
      members[offset].leftHash == members[offset].rightHash
    ) {
      offset++;
    }
    while (
      offset < leftEnd &&
      offset < rightEnd &&
      members[leftEnd - 1].leftHash == members[rightEnd - 1].rightHash
    ) {
      leftEnd--;
      rightEnd--;
    }

    if (offset > 0 || leftEnd !== leftLen) {
      leftLen = leftEnd - offset;
      rightLen = rightEnd - offset;
    }

    // left side is empty and right side isn't, then all
    // items on right are added...
    if (leftLen === 0 && rightLen) {
      let i = -1;
      while (++i < rightLen) {
        const candidatePath = [...path, offset + i];
        if (
          filter === null ||
          !filter(candidatePath, undefined, comparand[offset + i])
        )
          yield new PropertyAddedRecord(candidatePath, comparand[offset + i]);
      }
      return;
    }
    // right side is empty and left side isn't, then all
    // items on left are deleted...
    if (rightLen === 0 && leftLen) {
      let i = -1;
      while (++i < leftLen) {
        const candidatePath = [...path, offset + i];
        if (
          filter === null ||
          !filter(candidatePath, subject[offset + i], undefined)
        )
          yield new PropertyRemovedRecord(candidatePath, subject[offset + i]);
      }
      return;
    }

    const previousRow = [...Array(rightLen)].fill(0);

    for (let i = 1; i <= rightLen; ++i) {
      previousRow[i] = i;
    }

    const movedItems = Array(members.length);
    const lookBehind: PropertyChangeRecords = [];
    let count = 0;
    for (let i = 1; i <= leftLen; ++i) {
      const indexLeft = offset + i - 1;
      let previousDiagonal = previousRow[0];
      let previousColumn = previousRow[0]++;

      for (let j = 1; j <= rightLen; ++j) {
        const indexRight = offset + j - 1;
        previousColumn = Math.min(previousColumn, previousDiagonal);
        previousColumn = Math.min(previousColumn, previousRow[j]);
        const v = ++previousColumn;

        if (i === leftLen && j > leftLen && v !== count) {
          // add
          count = v;
          const candidatePath = [...path, indexRight];
          if (
            filter === null ||
            !filter(candidatePath, undefined, comparand[indexRight])
          )
            lookBehind.push(
              movedItems[indexRight]
                ? movedItems[indexRight]
                : new PropertyAddedRecord(candidatePath, comparand[indexRight]),
            );
        } else if (j === rightLen && i > rightLen && v !== count) {
          // delete
          count = v;
          const candidatePath = [...path, indexLeft];
          if (
            filter === null ||
            !filter(candidatePath, subject[indexLeft], undefined)
          )
            lookBehind.push(
              movedItems[indexLeft]
                ? movedItems[indexLeft]
                : new PropertyRemovedRecord(candidatePath, subject[indexLeft]),
            );
        } else if (i == j && v !== count) {
          // edit
          count = v;
          const candidatePath = [...path, indexLeft];
          if (
            filter === null ||
            !filter(candidatePath, subject[indexLeft], comparand[indexLeft])
          )
            lookBehind.push(
              movedItems[indexLeft]
                ? movedItems[indexLeft]
                : new PropertyEditedRecord(
                    candidatePath,
                    subject[indexLeft],
                    comparand[indexLeft],
                  ),
            );
        }

        previousDiagonal = previousRow[j];
        previousRow[j] = previousColumn;
      }
      while (lookBehind.length) {
        const change = lookBehind.shift();
        switch (change.kind) {
          case PropertyChangeKinds.edit: {
            const {
              path: p,
              subject,
              comparand,
            } = change as PropertyEditedRecord;
            yield* this.changes(subject, comparand, p, leftStack, rightStack);
            break;
          }
          case PropertyChangeKinds.move: {
            // Special case for moves; don't descend.
            const {
              path: p,
              subject,
              comparand,
            } = change as PropertyEditedRecord;
            if ((p[p.length - 1] as number) >= leftEnd) {
              yield new PropertyAddedRecord(p, comparand);
            } else {
              yield new PropertyEditedRecord(p, subject, comparand);
            }
            break;
          }
          default:
            yield change;
        }
      }
    }
  }

  _checkStack(subject, stack, path, side): void {
    if (stack.has(subject)) {
      const prior = fixPath(path.slice(0, stack.get(subject) + 1));
      const checked = path;
      throw new Error(
        `Unsupported cycle, ${side} side: reference at '${prior}' cycles at '${checked}'`,
      );
    }
  }

  *_walkObjectForComparableProp(
    left,
    right,
    props,
    state,
  ): Generator<PropertyChange> {
    const { path } = state;
    while (props.length && !state.siblingFound) {
      const [prop, leftIndex, rightIndex] = props.pop();
      path.push(prop);
      try {
        if (leftIndex === undefined) {
          yield new PropertyAddedRecord(path.slice(0), right[prop]);
          continue;
        }
        if (rightIndex === undefined) {
          yield new PropertyRemovedRecord(path.slice(0), left[prop]);
          continue;
        }
        state.left = left[prop];
        state.right = right[prop];
        if (state.left !== state.right) {
          state.siblingFound = true;
          break;
        }
      } finally {
        if (!state.siblingFound) path.pop();
      }
    }
  }

  looksEqual(
    left: unknown,
    right: unknown,
    path?: PathSegments,
    map?: Map<unknown, number>,
  ): boolean {
    if (map) {
      let hashLeft = map.get(left);
      if (hashLeft === undefined) {
        hashLeft = this.hashUnknown(left, path, map);
      }
      let hashRight = map.get(right);
      if (hashRight === undefined) {
        hashRight = this.hashUnknown(right, path, map);
      }
      return hashRight === hashLeft;
    }
    return false;
  }

  hashString(subject: string, map?: Map<unknown, number>): number {
    let hash = (map && map.get(subject)) || 0;
    if (!hash) {
      hash = murmur3Hash32(subject);
      if (map) map.set(subject, hash);
    }
    return hash;
  }

  hashArray(
    subject: unknown[],
    path?: PathSegments,
    map?: Map<unknown, number>,
    stack?: Map<unknown, number>,
  ): number {
    path = path || [];
    map = map || new Map();
    let hash = map.get(subject) || 0;
    if (!hash) {
      stack = stack || new Map();
      if (stack.get(subject) !== undefined)
        throw new Error('Unsupported cycle encountered in the graph');
      stack.set(subject, stack.size);
      try {
        const { ignoreArrayOrder } = this;
        const len = subject.length;
        if (len) {
          let i = -1;
          while (++i < len) {
            let itemHash = this.hashUnknown(subject[i], path, map, stack);
            if (!ignoreArrayOrder) {
              itemHash = this.hashString(
                `${ExtendedTypeOf.array} [${i}] ${itemHash}`,
                map,
              );
            }
            hash += itemHash;
          }
        }
        hash += this.hashString(`${ExtendedTypeOf.array} ${hash}`, map);
        map.set(subject, hash);
      } finally {
        stack.delete(subject);
      }
    }
    return hash;
  }

  hashObject(
    subject: unknown,
    path?: PathSegments,
    map?: Map<unknown, number>,
    stack?: Map<unknown, number>,
  ): number {
    const { includeSymbols } = this;
    path = path || [];
    map = map || new Map();
    let hash = map.get(subject) || 0;
    if (!hash) {
      stack = stack || new Map();
      if (stack.get(subject) !== undefined)
        throw new Error('Unsupported cycle encountered in the graph');
      stack.set(subject, stack.size);
      try {
        const obj = subject as Record<PropertyKey, unknown>;
        const props = this.listComparableMembers(obj, path);
        const len = props.length;
        let i = -1;
        while (++i < len) {
          const key = props[i];
          const name =
            includeSymbols && typeof key === 'symbol'
              ? `Symbol(${(key as symbol).description}`
              : (key as string);
          const itemHash = this.hashUnknown(obj[key], path, map, stack);
          hash += this.hashString(
            `${ExtendedTypeOf.object} .${name} ${itemHash}`,
          );
        }
        map.set(subject, hash);
      } finally {
        stack.delete(subject);
      }
    }
    return hash;
  }

  hashUnknown(
    value: unknown,
    path?: PathSegments,
    map?: Map<unknown, number>,
    stack?: Map<unknown, number>,
  ): number {
    const type = extendedTypeOf(value);
    switch (type) {
      case ExtendedTypeOf.object:
        return this.hashObject(
          value as Record<PropertyKey, unknown>,
          path,
          map,
          stack,
        );
      case ExtendedTypeOf.array:
        return this.hashArray(value as unknown[], path, map, stack);
      case ExtendedTypeOf.string:
      case ExtendedTypeOf.number:
      case ExtendedTypeOf.bigint:
      case ExtendedTypeOf.undefined:
      case ExtendedTypeOf.null:
      case ExtendedTypeOf.date:
      case ExtendedTypeOf.function:
      case ExtendedTypeOf.regexp:
      case ExtendedTypeOf.math:
        return this.hashString(`${type} ${value}`);
      case ExtendedTypeOf.symbol:
        return this.hashString(`${type} ${String(value)}`);
    }
    throw new Error(`Unsupported typeof: ${type}`);
  }

  private _indexMembers(
    subject: unknown[],
    comparand: unknown[],
    path: PathSegments,
    cache?: Map<unknown, number>,
  ): { members: ArrayMembers; map: Map<number, [number[], number[]]> } {
    const map = new Map<number, [number[], number[]]>();
    const leftLen = subject.length;
    const rightLen = comparand.length;
    const len = Math.max(leftLen, rightLen);
    const members: ArrayMembers = Array(len);
    let i = -1;
    while (++i < len) {
      const left = subject[i];
      const right = comparand[i];
      const itemPath = [...path, i];
      let leftHash = NaN;
      let rightHash = NaN;
      let leftIndices: Indices;
      let rightIndices: Indices;
      if (i < leftLen) {
        leftHash = this.hashUnknown(left, itemPath, cache);
        let indexed = map.get(leftHash);
        if (!indexed) {
          indexed = [[], []];
          map.set(leftHash, indexed);
        }
        indexed[0].push(i);
        leftIndices = indexed;
      }
      if (i < rightLen) {
        rightHash = this.hashUnknown(right, itemPath, cache);
        let indexed = map.get(rightHash);
        if (!indexed) {
          indexed = [[], []];
          map.set(rightHash, indexed);
        }
        indexed[1].push(i);
        rightIndices = indexed;
      }
      members[i] = {
        left,
        right,
        leftHash,
        rightHash,
        leftIndices,
        rightIndices,
      };
    }
    return { members, map };
  }

  stringify(...changes: Changes[]): string {
    return this.serializer(
      changes.length && !Array.isArray(changes[0])
        ? changes[0]
        : changes.flat(),
    );
  }

  parse(changes: string): Changes {
    return this.deserializer(changes);
  }
}
