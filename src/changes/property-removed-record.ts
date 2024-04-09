import { ChangeRecord } from './change-record.js';
import { PathPointer } from '../path-pointers/types.js';
import { PropertyChangeKinds, PropertyRemoved, Mutator } from '../types.js';

export class PropertyRemovedRecord
  extends ChangeRecord
  implements PropertyRemoved
{
  get [Symbol.toStringTag](): string {
    return 'PropertyMovedRecord';
  }

  public readonly subject: unknown;

  constructor(path: PathPointer, subject: unknown) {
    super(PropertyChangeKinds.remove, path);
    this.subject = subject;
  }

  compact(audit: boolean): Record<string, unknown> {
    const { subject } = this;
    return {
      ...super.compact(audit),
      ...(audit ? { subject } : null),
    };
  }

  protected performApply(
    target: unknown,
    key: PropertyKey,
    offset: number,
    mutator: Mutator,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      (target as unknown[]).splice(key + offset, 1);
    } else {
      mutator(this.path, key, target, undefined);
    }
    return offset - 1;
  }

  protected performRevert(
    target: unknown,
    key: PropertyKey,
    offset: number,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      (target as unknown[]).splice(key, offset, this.subject);
    } else {
      target[key] = this.subject;
    }
    return offset + 1;
  }
}

ChangeRecord.register(PropertyChangeKinds.remove, (change) => {
  const edited = change as unknown as PropertyRemoved;
  return edited instanceof PropertyRemovedRecord
    ? (edited as PropertyRemovedRecord)
    : new PropertyRemovedRecord(edited.path || edited.pointer, edited.subject);
});
