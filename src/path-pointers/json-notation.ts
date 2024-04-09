import {
  CLOSE_BRACE,
  COMMA,
  OPEN_BRACE,
  QUOTE,
  expectCh,
  expectOneOf,
  sliceTo,
  sliceToNonDigit,
} from '../parse-utils.js';
import { PathSegments } from '../types.js';
import { PathSchemeCodec } from './types.js';

class JsonSchemeCodec implements PathSchemeCodec {
  encode(path: PathSegments): string {
    const segments: string[] = [];
    const len = path.length;
    let i = -1;
    while (++i < len) {
      const segment = path[i];
      segments.push(
        typeof segment === 'number'
          ? String(segment)
          : `"${encodeURIComponent(String(segment))}"`,
      );
    }
    return OPEN_BRACE + segments.join(COMMA) + CLOSE_BRACE;
  }

  decode(path: string): PathSegments {
    const segments: PathSegments = [];
    const len = path.length;
    let cursor = 0;
    expectCh(path, cursor++, OPEN_BRACE);
    while (cursor < len && path[cursor] !== CLOSE_BRACE) {
      if (path[cursor] === QUOTE) {
        const { found, at } = sliceTo(path, cursor + 1, QUOTE);
        if (at === -1) {
          throw new Error(
            `Invalid json scheme; unterminated double-quote starting at ${cursor}.`,
          );
        }
        const key = decodeURIComponent(found);
        segments.push(key);
        cursor = at + 1;
      } else {
        // If not a double-quoted string, it must be an array index.
        const { found, at } = sliceToNonDigit(path, cursor);
        if (at === -1) {
          throw new Error(
            `Invalid json scheme; number starting at ${cursor} must be followed by COMMA or CLOSE_BRACE.`,
          );
        }
        expectOneOf(path, at, [COMMA, CLOSE_BRACE]);
        segments.push(parseInt(found, 10));
        cursor = at;
      }
      if (path[cursor] === CLOSE_BRACE) return segments;
      if (cursor < len && path[cursor] === COMMA) {
        cursor++;
      }
    }
    expectCh(path, cursor, CLOSE_BRACE);
    return segments;
  }
}

export const jsonSchemeCodec = new JsonSchemeCodec();
