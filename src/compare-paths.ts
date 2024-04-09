import { PathSegments } from './types.js';

function compareSegment(a: PropertyKey, b: PropertyKey): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  a = String(a);
  b = String(b);
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

export function comparePaths(a: PathSegments, b: PathSegments): number {
  if (a.length === b.length) {
    const len = a.length;
    switch (len) {
      case 0:
        return 0;
      case 1:
        return compareSegment(a[0], b[0]);
      case 2:
        return compareSegment(a[0], b[0]) || compareSegment(a[1], b[1]);
      case 3:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2])
        );

      case 4:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3])
        );
      case 5:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3]) ||
          compareSegment(a[4], b[4])
        );

      case 6:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3]) ||
          compareSegment(a[4], b[4]) ||
          compareSegment(a[5], b[5])
        );
      case 7:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3]) ||
          compareSegment(a[4], b[4]) ||
          compareSegment(a[5], b[5]) ||
          compareSegment(a[6], b[6])
        );
      case 8:
        return (
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3]) ||
          compareSegment(a[4], b[4]) ||
          compareSegment(a[5], b[5]) ||
          compareSegment(a[6], b[6]) ||
          compareSegment(a[7], b[7])
        );
      default: {
        let c =
          compareSegment(a[0], b[0]) ||
          compareSegment(a[1], b[1]) ||
          compareSegment(a[2], b[2]) ||
          compareSegment(a[3], b[3]) ||
          compareSegment(a[4], b[4]) ||
          compareSegment(a[5], b[5]) ||
          compareSegment(a[6], b[6]) ||
          compareSegment(a[7], b[7]) ||
          compareSegment(a[8], b[8]);

        let i = 8;
        while (++i < len && !c) {
          c = compareSegment(a[i], b[i]);
        }
        return c;
      }
    }
  }
  return a.length > b.length ? 1 : -1;
}
