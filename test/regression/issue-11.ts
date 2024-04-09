import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { randomBytes, randomInt } from 'crypto';
import { PropertyEditedRecord } from '../../src/changes/index.js';

/**
 * https://github.com/flitbit/diff/issues/11
 *
 * Filter/Ignore Keys?
 */
tap.test('issue-11', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = {
    obj: {
      with: {
        random: {
          $key: 'to ignore',
          num: randomInt(1000000),
        },
      },
    },
    but: ['also', 'other', { data: randomBytes(10).toString('hex') }],
  };

  const comparand = {
    obj: {
      with: {
        random: {
          $key: randomBytes(16).toString('hex'),
          num: randomInt(1000000),
        },
      },
    },
    but: ['also', 'other', { data: randomBytes(28).toString('hex') }],
  };

  const diff = new DeepDiff({ ignoreProperties: ['$key'] });
  const found = Array.from(diff.changes(subject, comparand));
  const expect = [
    new PropertyEditedRecord(
      '.obj.with.random.num',
      subject.obj.with.random.num,
      comparand.obj.with.random.num,
    ),
    new PropertyEditedRecord(
      '.but.[2].data',
      subject.but[2]['data'],
      comparand.but[2]['data'],
    ),
  ];
  t.matchOnly(found, expect, 'matches expected changes');
});
