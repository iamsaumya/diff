import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyRemovedRecord } from '../../src/changes/property-removed-record.js';

/**
 * https://github.com/flitbit/diff/issues/70
 *
 * DeepDiff({ foo : undefined }, {}) reports no differences
 */
tap.test('issue-70', async (t) => {
  t.test('original report', (t) => {
    const subject = { foo: undefined };
    const comparand = {};

    const diff = new DeepDiff();
    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [new PropertyRemovedRecord('#/foo', subject.foo)];
    t.matchOnly(found, wanted, 'found no differences');
    t.end();
  });
  t.test('later report', (t) => {
    //https://github.com/flitbit/diff/issues/70#issuecomment-298158143
    const subject = { foo: undefined };
    const comparand = { foo: undefined };

    const diff = new DeepDiff();
    const found = Array.from(diff.changes(subject, comparand));
    const wanted = [];
    t.matchOnly(found, wanted, 'found no differences');
    t.end();
  });
});
