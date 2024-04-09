import { ChangeRecord } from './change-record.js';
import { PathPointer } from '../path-pointers/types.js';
import { PropertyAdded, PropertyChangeKinds, Mutator } from '../types.js';

export class PropertyAddedRecord extends ChangeRecord implements PropertyAdded {
  get [Symbol.toStringTag](): string {
    return 'PropertyAddedRecord';
  }

  public readonly comparand: unknown;

  constructor(path: PathPointer, comparand: unknown) {
    super(PropertyChangeKinds.add, path);
    this.comparand = comparand;
  }

  compact(audit: boolean): Record<string, unknown> {
    return {
      ...super.compact(audit),
      comparand: this.comparand,
    };
  }

  protected performApply(
    target: unknown,
    key: PropertyKey,
    offset: number,
    mutator: Mutator,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      (target as unknown[]).splice(key + offset, 0, this.comparand);
    } else {
      mutator(this.path, key, target, this.comparand);
    }
    return offset + 1;
  }

  protected performRevert(
    target: unknown,
    key: PropertyKey,
    offset: number,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      (target as unknown[]).splice(key + offset, 1);
    } else {
      delete target[key];
    }
    return offset - 1;
  }
}

ChangeRecord.register(PropertyChangeKinds.add, (change) => {
  const added = change as unknown as PropertyAdded;
  return added instanceof PropertyAddedRecord
    ? (added as PropertyAddedRecord)
    : new PropertyAddedRecord(added.path || added.pointer, added.comparand);
});
