import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { Normalize } from '../../src/types.js';
import { v4, parse, stringify } from 'uuid';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/33
 *
 * Feature: Add support for normalizing values before diffing.
 */
tap.test('issue-33', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const _id = parse(v4());

  const subject = {
    _id,
    submittedBy: 'wilbur_finkleworth',
  };

  const comparand = JSON.parse(JSON.stringify(subject));
  comparand._id = stringify(_id);

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  const wanted = [
    new PropertyEditedRecord('#/_id', subject._id, comparand._id),
  ];
  t.matchOnly(found, wanted, 'reflects one difference');

  type Uuid = string | Uint8Array;
  const coerceUuidToString = (it: Uuid): string =>
    typeof it !== 'string' ? stringify(it) : it;

  // If the property is '_id', coerce it to a string
  const normalize: Normalize = (path, subject, comparand) => {
    return path.length && path[path.length - 1] === '_id'
      ? [
          coerceUuidToString(subject as Uuid),
          coerceUuidToString(comparand as Uuid),
        ]
      : [subject, comparand];
  };
  const normalizing = new DeepDiff({ normalize });

  const none = Array.from(normalizing.changes(subject, comparand));

  t.matchOnly(none, [], 'reflect no differences');
});
