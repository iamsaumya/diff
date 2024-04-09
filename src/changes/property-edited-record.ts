import { ChangeRecord } from './change-record.js';
import { PathPointer } from '../path-pointers/types.js';
import { PropertyChangeKinds, PropertyEdited, Mutator } from '../types.js';

export class PropertyEditedRecord
  extends ChangeRecord
  implements PropertyEdited
{
  get [Symbol.toStringTag](): string {
    return 'PropertyEditedRecord';
  }

  public readonly subject: unknown;
  public readonly comparand: unknown;

  constructor(path: PathPointer, subject: unknown, comparand: unknown) {
    super(PropertyChangeKinds.edit, path);
    this.subject = subject;
    this.comparand = comparand;
  }

  compact(audit: boolean): Record<string, unknown> {
    const { subject, comparand } = this;
    return {
      ...super.compact(audit),
      ...(audit ? { subject } : null),
      comparand,
    };
  }

  protected performApply(
    target: unknown,
    key: PropertyKey,
    offset: number,
    mutator: Mutator,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      target[key + offset] = this.comparand;
    } else {
      mutator(this.path, key, target, this.comparand);
    }
    return offset;
  }

  protected performRevert(
    target: unknown,
    key: PropertyKey,
    offset: number,
    mutator: Mutator,
  ): number {
    if (Array.isArray(target) && typeof key === 'number') {
      target[key + offset] = this.subject;
    } else {
      mutator(this.path, key, target, this.subject);
    }
    return offset;
  }
}

ChangeRecord.register(PropertyChangeKinds.edit, (change) => {
  const edited = change as unknown as PropertyEdited;
  return edited instanceof PropertyEditedRecord
    ? (edited as PropertyEditedRecord)
    : new PropertyEditedRecord(
        edited.path || edited.pointer,
        edited.subject,
        edited.comparand,
      );
});
