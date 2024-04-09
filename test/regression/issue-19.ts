import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import {
  PropertyAddedRecord,
  PropertyRemovedRecord,
} from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/19
 *
 * Path param in prefilter function is not useful.
 *
 * In version 2.x, 'prefilter' has been renamed to 'filter' in
 * constructor options.
 */
tap.test('issue-19', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const filterIndexFour = (path): boolean =>
    path.length && path[path.length - 1] === 4;

  const filterNamedProperty = (path): boolean =>
    path.length && path[path.length - 1] === 'two';

  t.test('arrays of numbers, filtering an index', (t) => {
    const subject = [1, 2, 3, 4];
    const comparand = [1, 2, 3, 4, 5, 6, 7];

    const diff = new DeepDiff({
      filter: filterIndexFour,
    });

    const found = Array.from(diff.changes(subject, comparand));
    const expect = [
      new PropertyAddedRecord('#/5', 6),
      new PropertyAddedRecord('#/6', 7),
    ];
    t.matchOnly(found, expect, 'matches expected changes');
    t.end();
  });

  t.test('arrays of objects, filtering an index', (t) => {
    const subject = [{ one: 1 }, { two: 2 }, { three: 3 }, { four: 4 }];
    const comparand = [
      { one: 1 },
      { two: 2 },
      { three: 3 },
      { four: 4 },
      { five: 5 },
      { six: 6 },
      { seven: 7 },
    ];

    const diff = new DeepDiff({
      filter: filterIndexFour,
    });

    const found = Array.from(diff.changes(subject, comparand));
    const expect = [
      new PropertyAddedRecord('#/5', comparand[5]),
      new PropertyAddedRecord('#/6', comparand[6]),
    ];
    t.matchOnly(found, expect, 'matches expected changes');
    t.end();
  });

  t.test('nested arrays of objects, filtering an index', (t) => {
    const subject = {
      objects: [{ one: 1 }, { two: 2 }, { three: 3 }, { four: 4 }],
    };
    const comparand = {
      objects: [
        { one: 1 },
        { two: 2 },
        { three: 3 },
        { four: 4 },
        { five: 5 },
        { six: 6 },
        { seven: 7 },
      ],
    };

    const diff = new DeepDiff({
      filter: filterIndexFour,
    });

    const found = Array.from(diff.changes(subject, comparand));
    const expect = [
      new PropertyAddedRecord('#/objects/5', comparand.objects[5]),
      new PropertyAddedRecord('#/objects/6', comparand.objects[6]),
    ];
    t.matchOnly(found, expect, 'matches expected changes');
    t.end();
  });

  t.test('nested arrays of objects, filtering a property by name', (t) => {
    const subject = {
      objects: [{ one: 1 }, { two: 2 }, { three: 3 }, { four: 4 }],
    };
    const comparand = {
      objects: [{ one: 1 }, { two: 'two' }, { three: 3 }],
    };

    const diff = new DeepDiff({
      filter: filterNamedProperty,
    });

    const found = Array.from(diff.changes(subject, comparand));
    const expect = [
      //new PropertyEditedRecord('#/objects/1/two', subject.objects[1].two, comparand.objects[1].two),
      new PropertyRemovedRecord('#/objects/3', subject.objects[3]),
    ];
    t.matchOnly(found, expect, 'matches expected changes');
    t.end();
  });
});
