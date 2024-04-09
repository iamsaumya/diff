export type PropertyChangeKind = 'A' | 'E' | 'R' | 'M';

export const PropertyChangeKinds = Object.freeze({
  add: 'A',
  edit: 'E',
  remove: 'R',
  move: 'M',
});

export type PathSegments = PropertyKey[];

export interface BasicPropertyChange {
  readonly kind: PropertyChangeKind;
  readonly path: PathSegments;
  readonly pointer: string;

  /**
   * Applies a captured change to the target object.
   * @param target a target of the change
   */
  apply(
    target: unknown,
    descend: boolean,
    offset: number,
    accessor: Accessor,
    mutator: Mutator,
  ): number;

  /**
   * Reverts a captured change on the target object.
   * @param target a target of the change
   */
  revert(
    target: unknown,
    descend: boolean,
    offset: number,
    accessor: Accessor,
    mutator: Mutator,
  ): number;

  compact(audit: boolean): Record<string, unknown>;
}

export interface PropertyChangeWithComparand extends BasicPropertyChange {
  readonly comparand: unknown;
}

export interface PropertyChangeWithSubject extends BasicPropertyChange {
  readonly subject: unknown;
}

export interface PropertyAdded extends PropertyChangeWithComparand {}

export type PropertyEdited = PropertyChangeWithComparand &
  PropertyChangeWithSubject;

export interface PropertyMoved extends PropertyEdited {
  readonly origin: number;
}

export interface PropertyRemoved extends PropertyChangeWithSubject {
  readonly subject: unknown;
}

export type PropertyChange =
  | PropertyAdded
  | PropertyEdited
  | PropertyRemoved
  | PropertyMoved;

export type PropertyChanges = PropertyChange[];

export type Changes = PropertyChange | PropertyChanges;

export type PropertyFilter = (
  path: PathSegments,
  subject: unknown,
  comparand: unknown,
) => boolean;

export type Normalize = (
  path: PathSegments,
  subject: unknown,
  comparand: unknown,
) => [unknown, unknown];

export type Accessor = (
  path: PathSegments,
  key: PropertyKey,
  target: unknown,
) => unknown;

export type Mutator = (
  path: PathSegments,
  key: PropertyKey,
  target: unknown,
  value: unknown,
) => unknown;

export type Factory = (change: PropertyChange) => PropertyChange;

export type Serializer = (target: Changes) => string;
export type Deserializer = (string: string) => Changes;
