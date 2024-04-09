import { decodePathPointer } from '../path-pointers/index.js';
import { PathPointer } from '../path-pointers/types.js';
import { StringTransform } from '../transforms/string-transform.js';
import {
  BasicPropertyChange,
  PathSegments,
  PropertyChange,
  PropertyChangeKind,
  Accessor,
  Mutator,
  Factory,
} from '../types.js';

const STRING_TRANSFORM_SYMBOL = Symbol('string-transform');
const REGISTRY_SYMBOL = Symbol('registry');

export class ChangeRecord implements BasicPropertyChange {
  static [REGISTRY_SYMBOL]: Map<PropertyChangeKind, Factory> = new Map();
  static [STRING_TRANSFORM_SYMBOL]: StringTransform;

  static set stringTransform(transform: StringTransform) {
    ChangeRecord[STRING_TRANSFORM_SYMBOL] = transform;
  }

  static get stringTransform(): StringTransform {
    if (!ChangeRecord[STRING_TRANSFORM_SYMBOL]) {
      ChangeRecord[STRING_TRANSFORM_SYMBOL] = new StringTransform(
        ChangeRecord.from,
        { audit: true },
      );
    }
    return ChangeRecord[STRING_TRANSFORM_SYMBOL];
  }

  static register(kind: PropertyChangeKind, factory: Factory): void {
    ChangeRecord[REGISTRY_SYMBOL].set(kind, factory);
  }

  static from(change: PropertyChange): PropertyChange {
    if (change instanceof ChangeRecord)
      return change as unknown as PropertyChange;
    const factory = ChangeRecord[REGISTRY_SYMBOL].get(change.kind);
    if (factory) return factory(change);
    throw new Error(`Unrecognized change kind: ${change.kind}.`);
  }

  get [Symbol.toStringTag](): string {
    return 'ChangeRecord';
  }

  public readonly kind: PropertyChangeKind;
  public readonly path: PathSegments;
  public readonly pointer: string;

  constructor(kind: PropertyChangeKind, pathPointer: PathPointer) {
    this.kind = kind;
    const { path, pointer } = decodePathPointer(pathPointer);
    this.path = path;
    this.pointer = pointer;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compact(_audit: boolean): Record<string, unknown> {
    const { kind, pointer } = this;
    return { kind, pointer };
  }

  descendPath(
    target: unknown,
    accessor: Accessor,
    mutator: Mutator,
    createDuringDescent = true,
  ): [unknown, PropertyKey] {
    if (typeof target !== 'object') throw Error("Don't know how to do that!");
    const path = this.path;
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
    return [descent, path[last]];
  }

  apply(
    target: unknown,
    descend: boolean,
    offset: number,
    accessor: Accessor,
    mutator: Mutator,
  ): number {
    if (descend) {
      const [descent, key] = this.descendPath(target, accessor, mutator);
      return this.performApply(descent, key, offset, mutator);
    } else {
      return this.performApply(
        target,
        this.path[this.path.length - 1],
        offset,
        mutator,
      );
    }
  }

  revert(
    target: unknown,
    descend: boolean,
    offset: number,
    accessor: Accessor,
    mutator: Mutator,
  ): number {
    if (descend) {
      const [descent, key] = this.descendPath(target, accessor, mutator);
      return this.performRevert(descent, key, offset, mutator);
    } else {
      return this.performRevert(
        target,
        this.path[this.path.length - 1],
        offset,
        mutator,
      );
    }
  }

  protected performApply(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _target: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _key: PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _offset: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mutator: Mutator,
  ): number {
    throw new Error('not implemented');
  }
  protected performRevert(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _target: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _key: PropertyKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _offset: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mutator: Mutator,
  ): number {
    throw new Error('not implemented');
  }

  public toString(): string {
    const transform = ChangeRecord.stringTransform;
    return transform.to(this as unknown as PropertyChange);
  }
}
