import { PathSegments } from '../types.js';
import { PathSchemeCodec } from './types.js';

const D0 = '0';
const D9 = '9';

function decodePointerSegments(path: PathSegments): PathSegments {
  let i = -1;
  const len = path.length;
  const segments: PathSegments = new Array(len);
  while (++i < len) {
    const segment = decodeURIComponent(String(path[i]))
      .replaceAll('~1', '/')
      .replaceAll('~0', '~');
    if (
      segment.length &&
      segment[0] >= D0 &&
      segment[0] <= D9 &&
      String(Number(segment)) === segment
    ) {
      segments[i] = Number(segment);
    } else {
      segments[i] = segment;
    }
  }
  return segments;
}

function encodePointerSegments(segments: PathSegments): PathSegments {
  let i = -1;
  const len = segments.length;
  const res = new Array(len);
  while (++i < len) {
    if (typeof segments[i] === 'number') {
      res[i] = segments[i];
    } else {
      res[i] = encodeURIComponent(
        String(segments[i]).replaceAll('~', '~0').replaceAll('/', '~1'),
      );
    }
  }
  return res;
}

class UriFragmentPointerCodec implements PathSchemeCodec {
  public encode(path: PathSegments): string {
    if (!path || (path && !Array.isArray(path))) {
      throw new TypeError('Invalid type: path must be an array of segments.');
    }
    if (path.length === 0) {
      return '#';
    }
    return `#/${encodePointerSegments(path).join('/')}`;
  }
  decode(pointer: string): PathSegments {
    if (typeof pointer !== 'string') {
      throw new TypeError(
        'Invalid type: JSON Pointers are represented as strings.',
      );
    }
    if (pointer.length === 0 || pointer[0] !== '#') {
      throw new ReferenceError(
        'Invalid JSON Pointer; URI fragment identifiers must begin with a hash.',
      );
    }
    if (pointer.length === 1) {
      return [];
    }
    if (pointer[1] !== '/') {
      throw new ReferenceError('Invalid JSON Pointer syntax.');
    }
    return decodePointerSegments(pointer.substring(2).split('/'));
  }
}

export const uriFragmentPointerCodec = new UriFragmentPointerCodec();
