import {
  expectCh,
  expectOneOf,
  expectOnlyDecimalCharacters,
  sliceTo,
} from '../parse-utils.js';
import { Transform } from './transform.js';
import {
  PathScheme,
  PathSchemeCodec,
  decodePointer,
  getDefaultPathScheme,
  selectPathSchemeCodec,
} from '../path-pointers/index.js';
import {
  PropertyAdded,
  PropertyChange,
  PropertyChangeKinds,
  PropertyRemoved,
  PropertyEdited,
  PropertyMoved,
  Factory,
} from '../types.js';

const DEFAULT_AUDIT = false;
const DEFAULT_VALUE_TRANSFORM_TO = JSON.stringify.bind(null);
const DEFAULT_VALUE_TRANSFORM_FROM = JSON.parse.bind(null);
const DEFAULT_EDIT_VALUE_SEPARATOR = ' => ';

export interface StringTransformOptions {
  pathScheme?: PathScheme;
  audit?: boolean;
  valueTransformTo?: (v: unknown) => string;
  valueTransformFrom?: (v: string) => unknown;
  editValueSeparator?: string;
}

export class StringTransform implements Transform<string> {
  public static DEFAULT_OPTIONS: StringTransformOptions = {
    audit: DEFAULT_AUDIT,
    valueTransformTo: DEFAULT_VALUE_TRANSFORM_TO,
    valueTransformFrom: DEFAULT_VALUE_TRANSFORM_FROM,
    editValueSeparator: DEFAULT_EDIT_VALUE_SEPARATOR,
  };

  public readonly pathScheme: PathScheme;
  public readonly audit: boolean;
  public readonly valueTransformTo: (v: unknown) => string;
  public readonly valueTransformFrom: (v: string) => unknown;
  public readonly editValueSeparator: string;

  private readonly _codec: PathSchemeCodec;
  private readonly factory: Factory;

  constructor(factory: Factory, options?: StringTransformOptions) {
    const {
      pathScheme,
      audit,
      valueTransformTo,
      valueTransformFrom,
      editValueSeparator,
    } = {
      ...StringTransform.DEFAULT_OPTIONS,
      ...(options || {}),
    };
    this.factory = factory;
    this.pathScheme = pathScheme || getDefaultPathScheme();
    this.audit = audit;
    this.valueTransformTo = valueTransformTo;
    this.valueTransformFrom = valueTransformFrom;
    this.editValueSeparator = editValueSeparator;
    this._codec = selectPathSchemeCodec(pathScheme);
  }

  to(change: PropertyChange): string {
    const { pointer, kind } = change;
    const path = decodePointer(pointer);
    const encodedPath = this._codec.encode(path);
    if (kind === PropertyChangeKinds.add)
      return this._transformAddedTo(encodedPath, change as PropertyAdded);
    if (kind === PropertyChangeKinds.edit)
      return this._transformEditedTo(encodedPath, change as PropertyEdited);
    if (kind === PropertyChangeKinds.move)
      return this._transformMovedTo(encodedPath, change as PropertyMoved);
    if (kind === PropertyChangeKinds.remove)
      return this._transformRemovedTo(encodedPath, change as PropertyRemoved);
    throw new Error(`Unrecognized change kind: ${kind}.`);
  }

  from(source: string): PropertyChange {
    if (!source?.length) throw Error('source (string) is required');
    let cursor = 0;
    const kind = expectOneOf(source, cursor++, [
      PropertyChangeKinds.add,
      PropertyChangeKinds.edit,
      PropertyChangeKinds.move,
      PropertyChangeKinds.remove,
    ]);
    expectCh(source, cursor++, ' ');
    const { found, at } = sliceTo(source, cursor, ' ');
    const path = this._codec.decode(found);
    cursor = at + 1;
    switch (kind) {
      case PropertyChangeKinds.add: {
        const { found: comparand } = this._transformValueFrom(source, cursor);
        return this.factory({
          kind,
          path,
          comparand,
        } as PropertyChange);
      }
      case PropertyChangeKinds.edit: {
        const { found: subject, length } = this._transformValueFrom(
          source,
          cursor,
        );
        if (!length) throw new Error(`Expected encoded object at ${cursor}`);
        cursor += length;
        if (cursor < source.length) {
          const { found: comparand, length } = this._transformValueFrom(
            source,
            cursor,
          );
          if (!length) throw new Error(`Expected encoded object at ${cursor}`);
          cursor += length;
          return this.factory({
            kind,
            path,
            subject,
            comparand,
          } as PropertyChange);
        }
        return this.factory({
          kind,
          path,
          subject: undefined,
          comparand: subject,
        } as PropertyChange);
      }
      case PropertyChangeKinds.move: {
        const { found, at } = sliceTo(source, cursor, ' ');
        if (at === -1) {
          throw new Error(
            `Invalid numeric; expected decimal digits at ${cursor}.`,
          );
        }
        expectOnlyDecimalCharacters(found, cursor);
        const origin = parseInt(found, 10);
        const { found: subject, length } = this._transformValueFrom(
          source,
          cursor,
        );
        if (!length) throw new Error(`Expected encoded object at ${cursor}`);
        cursor += length;
        if (cursor < source.length) {
          const { found: comparand, length } = this._transformValueFrom(
            source,
            cursor,
          );
          if (!length) throw new Error(`Expected encoded object at ${cursor}`);
          cursor += length;
          return this.factory({
            kind,
            path,
            subject,
            comparand,
            origin,
          } as PropertyChange);
        }
        return this.factory({
          kind,
          path,
          subject: undefined,
          comparand: subject,
          origin,
        } as PropertyChange);
      }
      case PropertyChangeKinds.remove: {
        const { found: subject } = this._transformValueFrom(source, cursor);
        return this.factory({
          kind,
          path,
          subject,
        } as PropertyChange);
      }
    }
  }

  _transformAddedTo(path: string, { comparand }): string {
    return `${PropertyChangeKinds.add} ${path} ${this._transformValueTo(
      comparand,
    )}`;
  }
  _transformEditedTo(path: string, { subject, comparand }): string {
    return this.audit
      ? `${PropertyChangeKinds.edit} ${path} ${this._transformValueTo(
          subject,
        )}${this.editValueSeparator}${this._transformValueTo(comparand)}`
      : `${PropertyChangeKinds.edit} ${path} ${this._transformValueTo(
          comparand,
        )}`;
  }
  _transformMovedTo(path: string, { subject, comparand, origin }): string {
    return this.audit
      ? `${PropertyChangeKinds.move} ${path} ${origin} ${this._transformValueTo(
          subject,
        )}${this.editValueSeparator}${this._transformValueTo(comparand)}`
      : `${PropertyChangeKinds.move} ${path} ${origin} ${this._transformValueTo(
          comparand,
        )}`;
  }
  _transformRemovedTo(path: string, { subject }): string {
    return this.audit
      ? `${PropertyChangeKinds.remove} ${path} ${this._transformValueTo(
          subject,
        )}`
      : `${PropertyChangeKinds.remove} ${path}`;
  }
  _transformValueTo(value: unknown): string {
    const data = this.valueTransformTo(value);
    return `${data.length} ${data}`;
  }
  _transformValueFrom(
    str: string,
    cursor: number,
  ): { found: unknown; length: number } {
    // JSON encoded data is length prefixed in the string.
    const { found, at } = sliceTo(str, cursor, ' ');
    if (at === -1) {
      throw new Error(`Invalid numeric; expected decimal digits at ${cursor}.`);
    }
    expectOnlyDecimalCharacters(found, cursor);
    const length = parseInt(found, 10);
    const end = at + length + 1;
    const data = this.valueTransformFrom(str.slice(at + 1, end));
    return { found: data, length };
  }
}
