import tap from 'tap';
import { PathSegments } from '../../../src/types.js';
import {
  PathSchemes,
  decodePointer,
  encodePointer,
} from '../../../src/path-pointers/index.js';

tap.test('encodePointer()', async (t) => {
  const cases: [string, PathSegments, string, string, string][] = [
    ['empty', [], '.', '#', '[]'],
    ['single prop', ['prop'], '.prop', '#/prop', '["prop"]'],
    ['keyword', ['private'], '.["private"]', '#/private', '["private"]'],
    [
      'prop with dashes',
      ['prop-with-dashes'],
      '.["prop-with-dashes"]',
      '#/prop-with-dashes',
      '["prop-with-dashes"]',
    ],
    [
      'prop with space',
      ['prop with space'],
      '.["prop with space"]',
      '#/prop%20with%20space',
      '["prop%20with%20space"]',
    ],

    [
      'prop with quote',
      ['prop"quote'],
      '.["prop\\"quote"]',
      '#/prop%22quote',
      '["prop%22quote"]',
    ],

    [
      'prop beginning with digit',
      ['4giggles'],
      '.["4giggles"]',
      '#/4giggles',
      '["4giggles"]',
    ],

    ['prop with digit', ['g1ggl3s'], '.g1ggl3s', '#/g1ggl3s', '["g1ggl3s"]'],

    [
      'chain of props',
      ['one', 'two', 'three'],
      '.one.two.three',
      '#/one/two/three',
      '["one","two","three"]',
    ],

    [
      'chain of props with number',
      ['one', 2, 'three'],
      '.one.[2].three',
      '#/one/2/three',
      '["one",2,"three"]',
    ],

    [
      'chain number at beginning',
      [0, 'one', 'two'],
      '.[0].one.two',
      '#/0/one/two',
      '[0,"one","two"]',
    ],

    [
      'chain number at end',
      ['zero', 'one', 2],
      '.zero.one.[2]',
      '#/zero/one/2',
      '["zero","one",2]',
    ],
  ];

  t.test('dotted scheme notation', async (t) => {
    for (const [what, it, expect, ,] of cases) {
      t.test(`${what} round-trips`, (t) => {
        const encoded = encodePointer(it, PathSchemes.dotted);
        t.equal(encoded, expect, `encodes as ${expect}`);
        const decoded = decodePointer(encoded);
        t.matchOnly(decoded, it, `decodes as expected`);
        t.end();
      });
    }
  });
  t.test('pointer scheme notation', async (t) => {
    for (const [what, it, , expect] of cases) {
      t.test(`${what} round-trips`, (t) => {
        const encoded = encodePointer(it, PathSchemes.pointer);
        t.equal(encoded, expect, `encodes as ${expect}`);
        const decoded = decodePointer(encoded);
        t.matchOnly(decoded, it, `decodes as expected`);
        t.end();
      });
    }
  });
  t.test('json scheme notation', async (t) => {
    for (const [what, it, , , expect] of cases) {
      t.test(`${what} round-trips`, (t) => {
        const encoded = encodePointer(it, PathSchemes.json);
        t.equal(encoded, expect, `encodes as ${expect}`);
        const decoded = decodePointer(encoded);
        t.matchOnly(decoded, it, `decodes as expected`);
        t.end();
      });
    }
  });
});
