import { decodePathPointer } from '../path-pointers/index.js';
import { PathPointer } from '../path-pointers/types.js';
import { Accessor, Mutator, PathSegments, PropertyChanges } from '../types.js';

export class ChangeSet {
  static from({ path, target, changes }): ChangeSet {
    return Array.isArray(target)
      ? new ArrayChangeSet(path, target, changes)
      : new ObjectChangeSet(path, target, changes);
  }

  public readonly path: PathSegments;
  public readonly pointer: string;
  public readonly target: unknown;
  public readonly changes: PropertyChanges;

  constructor(path: PathPointer, target: unknown, changes: PropertyChanges) {
    const p = decodePathPointer(path);
    this.path = p.path;
    this.pointer = p.pointer;
    this.target = target;
    this.changes = changes;
  }

  apply(accessor: Accessor, mutator: Mutator): void {
    for (const change of this.changes) {
      change.apply(this.target, false, 0, accessor, mutator);
    }
  }
  revert(accessor: Accessor, mutator: Mutator): void {
    for (const change of this.changes) {
      change.revert(this.target, false, 0, accessor, mutator);
    }
  }
}

export class ArrayChangeSet extends ChangeSet {
  apply(accessor: Accessor, mutator: Mutator): void {
    let offset = 0;
    for (const change of this.changes) {
      offset = change.apply(this.target, false, offset, accessor, mutator);
    }
  }
  revert(accessor: Accessor, mutator: Mutator): void {
    let offset = 0;
    for (const change of this.changes) {
      offset = change.revert(this.target, false, offset, accessor, mutator);
    }
  }
}

export class ObjectChangeSet extends ChangeSet {}
