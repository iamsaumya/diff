import tap from 'tap';
import {
  PropertySet,
  calculatePropertySet,
} from '../../src/calculate-property-set.js';

tap.test('fn calculatePropertySet()', async (t) => {
  t.test('throws when subject unspecified', async (t) => {
    t.throws(() => calculatePropertySet(undefined, undefined), {
      message: "Cannot read properties of undefined (reading 'length')",
    });
  });
  t.test('throws when comparand unspecified', async (t) => {
    t.throws(() => calculatePropertySet([], undefined), {
      message: "Cannot read properties of undefined (reading 'length')",
    });
  });
  t.test('throws when comparand unspecified', async (t) => {
    const found = calculatePropertySet([], []);
    t.match(found, [], 'expected empty prop set');
  });

  const twenty = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
    'twenty',
    'twenty-one',
    'twenty-two',
    'twenty-three',
    'twenty-four',
    'twenty-five',
    'twenty-six',
    'twenty-seven',
    'twenty-eight',
  ];

  let zeroToTwentyEight = [];
  const lastCase = twenty.length - 1;
  for (let i = 0; i < twenty.length; ++i) {
    const subset = twenty.slice(0, lastCase - i);
    zeroToTwentyEight.push([
      twenty[subset.length] || 'zero',
      subset,
      subset,
      subset.map((it, j) => [it, j, j]),
    ]);
  }
  zeroToTwentyEight = zeroToTwentyEight.reverse();

  const tests: [string, PropertyKey[], PropertyKey[], PropertySet][] =
    zeroToTwentyEight.concat([
      [
        'right has more (end)',
        ['one', 'two', 'three'],
        ['one', 'two', 'three', 'four'],
        [
          ['one', 0, 0],
          ['two', 1, 1],
          ['three', 2, 2],
          ['four', undefined, 3],
        ],
      ],
      [
        'right has more (middle)',
        ['one', 'three'],
        ['one', 'two', 'three'],
        [
          ['one', 0, 0],
          ['two', undefined, 1],
          ['three', 1, 2],
        ],
      ],
      [
        'right has more (front)',
        ['two', 'three', 'four'],
        ['one', 'two', 'three', 'four'],
        [
          ['one', undefined, 0],
          ['two', 0, 1],
          ['three', 1, 2],
          ['four', 2, 3],
        ],
      ],
      [
        'left has more (end)',
        ['one', 'two', 'three', 'four'],
        ['one', 'two', 'three'],
        [
          ['one', 0, 0],
          ['two', 1, 1],
          ['three', 2, 2],
          ['four', 3, undefined],
        ],
      ],
      [
        'left has more (middle)',
        ['one', 'two', 'three', 'four'],
        ['one', 'two', 'four'],
        [
          ['one', 0, 0],
          ['two', 1, 1],
          ['three', 2, undefined],
          ['four', 3, 2],
        ],
      ],
      [
        'left has more (front)',
        ['one', 'two', 'three', 'four'],
        ['two', 'three', 'four'],
        [
          ['one', 0, undefined],
          ['two', 1, 0],
          ['three', 2, 1],
          ['four', 3, 2],
        ],
      ],
      [
        'no overlap',
        ['one', 'two', 'three'],
        ['four', 'five', 'six'],
        [
          ['one', 0, undefined],
          ['four', undefined, 0],
          ['two', 1, undefined],
          ['five', undefined, 1],
          ['three', 2, undefined],
          ['six', undefined, 2],
        ],
      ],
      [
        'nearly disjoint',
        ['one', 'two', 'five', 'nine'],
        ['three', 'four', 'five', 'six'],
        [
          ['one', 0, undefined],
          ['three', undefined, 0],
          ['two', 1, undefined],
          ['four', undefined, 1],
          ['five', 2, 2],
          ['nine', 3, undefined],
          ['six', undefined, 3],
        ],
      ],
      [
        'disjoint middle',
        ['one', 'two', 'five', 'six'],
        ['three', 'four'],
        [
          ['one', 0, undefined],
          ['three', undefined, 0],
          ['two', 1, undefined],
          ['four', undefined, 1],
          ['five', 2, undefined],
          ['six', 3, undefined],
        ],
      ],
      [
        'removed middle',
        ['one', 'two', 'three'],
        ['one', 'three'],
        [
          ['one', 0, 0],
          ['two', 1, undefined],
          ['three', 2, 1],
        ],
      ],
    ]);

  for (const [what, left, right, wanted] of tests) {
    t.test(what, async (t) => {
      const found = calculatePropertySet(left, right);
      t.matchOnly(found, wanted, 'expected');
    });
  }
});
