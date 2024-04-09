import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyAddedRecord } from '../../src/changes/property-added-record.js';

/**
 * https://github.com/flitbit/diff/issues/69
 *
 * diff() does not detect properties added to functions
 */
tap.test('issue-69', async (t) => {
  const subject = {
    obj: {},
    func: function (): void {},
  };
  const comparand = {
    obj: {},
    func: function (): void {},
  };
  comparand.obj['added'] = 'test';
  comparand.func['added'] = 'test';

  // In version 2.x, functions are not processed... just like version 1.x
  let diff = new DeepDiff();
  let found = Array.from(diff.changes(subject, comparand));
  let wanted = [new PropertyAddedRecord('#/obj/added', comparand.obj['added'])];
  t.matchOnly(found, wanted, 'found no differences');

  // However, in v2.x+, you can tell deep-diff to include functions...
  diff = new DeepDiff({ includeFunctions: true });
  found = Array.from(diff.changes(subject, comparand));
  wanted = [
    new PropertyAddedRecord('#/obj/added', comparand.obj['added']),
    new PropertyAddedRecord('#/func/added', comparand.func['added']),
  ];
  t.matchOnly(found, wanted, 'found no differences');
});
