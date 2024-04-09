import { ChangeRecord } from './change-record.js';
import { PathPointer } from '../path-pointers/types.js';
import { PropertyChangeKinds, PropertyMoved } from '../types.js';

export class PropertyMovedRecord extends ChangeRecord implements PropertyMoved {
  get [Symbol.toStringTag](): string {
    return 'PropertyMovedRecord';
  }

  public readonly subject: unknown;
  public readonly comparand: unknown;
  public readonly origin: number;

  constructor(
    path: PathPointer,
    subject: unknown,
    comparand: unknown,
    origin: number,
  ) {
    super(PropertyChangeKinds.move, path);
    this.subject = subject;
    this.comparand = comparand;
    this.origin = origin;
  }

  compact(audit: boolean): Record<string, unknown> {
    const { subject, comparand, origin } = this;
    return {
      ...super.compact(audit),
      ...(audit ? { subject, origin } : null),
      comparand,
    };
  }

  protected performApply(
    target: unknown,
    key: PropertyKey,
    offset: number,
  ): number {
    // Moves are only supported in arrays
    if (!Array.isArray(target) || typeof key !== 'number')
      throw new Error(`Object path '${this.pointer}' must be an array`);

    // 1.) change new location to comparand
    // 2.) remove old location (subject)
    target[key + offset] = this.comparand;
    (target as unknown[]).splice(this.origin + offset, 1);
    return this.origin < key ? offset - 1 : 0;
  }

  protected performRevert(
    target: unknown,
    key: PropertyKey,
    offset: number,
  ): number {
    // Moves are only supported in arrays
    if (!Array.isArray(target) || typeof key !== 'number')
      throw new Error(`Object path '${this.pointer}' must be an array`);

    // 1.) restore subject at new location
    // 2.) restore old location to comparand
    target[key + offset] = this.subject;
    (target as unknown[]).splice(this.origin, 0, this.comparand);
    return this.origin < key ? offset + 1 : 0;
  }
}

ChangeRecord.register(PropertyChangeKinds.move, (change) => {
  const moved = change as unknown as PropertyMoved;
  return moved instanceof PropertyMovedRecord
    ? (moved as PropertyMovedRecord)
    : new PropertyMovedRecord(
        moved.path || moved.pointer,
        moved.subject,
        moved.comparand,
        moved.origin,
      );
});
