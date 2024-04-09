import tap from 'tap';
import { DeepDiff } from '../../src/deep-diff.js';
import { PropertyEditedRecord } from '../../src/changes/property-edited-record.js';

/**
 * https://github.com/flitbit/diff/issues/10
 *
 * Apply change: Error when switching 2 items in array
 */
tap.test('issue-10', async (t) => {
  // Rewritten to be valid Typescript and semantics of v2.x

  const subject = {
    id: 'Release',
    phases: [
      {
        id: 'Phase1',
        tasks: [{ id: 'Task1' }, { id: 'Task2' }],
      },
      {
        id: 'Phase2',
        tasks: [{ id: 'Task3' }],
      },
    ],
  };

  const comparand = {
    id: 'Release',
    phases: [
      {
        id: 'Phase2',
        tasks: [{ id: 'Task3' }],
      },
      {
        id: 'Phase1',
        tasks: [{ id: 'Task1' }, { id: 'Task2' }],
      },
    ],
  };

  const diff = new DeepDiff();
  const found = Array.from(diff.changes(subject, comparand));
  // const wanted = [
  //   new PropertyEditedRecord(
  //     '#/phases/0',
  //     subject.phases[0],
  //     comparand.phases[0],
  //   ),
  //   new PropertyEditedRecord(
  //     '#/phases/1',
  //     subject.phases[1],
  //     comparand.phases[1],
  //   ),
  // ];

  // t.matchOnly(found, wanted, 'matches expected changes');

  const original = JSON.parse(JSON.stringify(subject));

  // The differences can be applied...
  const changed = diff.apply(subject, found);
  t.matchOnly(changed, comparand, 'applied changes produce matching');

  // The differences can be reverted...
  const reverted = diff.revert(subject, found);
  t.matchOnly(reverted, original, 'reverted changes produce original');
});
