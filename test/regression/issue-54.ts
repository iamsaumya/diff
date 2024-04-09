import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { Accessor, Mutator } from '../../src/types.js';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/54
 *
 * Allow Custom Accessor and Mutator Functions
 */
tap.test('issue-54', async (t) => {
  const subject = { one: 1, two: 2, three: 'three' };
  const comparand = { one: 1, two: 'two', three: 3 };

  const map = new Map([
    ['one', 1],
    ['two', 2],
    ['three', 3],
  ]);

  const accessor: Accessor = (_path, key, target) => {
    const value = target[key];
    return typeof value === 'string' ? map.get(value) : value;
  };
  const mutator: Mutator = (_path, key, target, value) => {
    return typeof value === 'string' && map.get(value)
      ? value
      : (target[key] = value);
  };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  t.matchOnly(
    found,
    [
      new PropertyEditedRecord('#/two', subject.two, comparand.two),
      new PropertyEditedRecord('#/three', subject.three, comparand.three),
    ],
    'found wanted differences',
  );

  const customized = new DeepDiff({ accessor, mutator });

  const again = Array.from(customized.changes(comparand, subject));
  t.matchOnly(again, [], 'found no differences');
});
