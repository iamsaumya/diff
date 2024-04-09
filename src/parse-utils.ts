import { ok } from 'assert';

export const DOT = '.';
export const OPEN_BRACE = '[';
export const CLOSE_BRACE = ']';
export const QUOTE = '"';
export const DELIMITER = '\\';
export const COMMA = ',';
export const HASH = '#';

const D0 = '0';
const D9 = '9';

export function seekEndQuote(
  str: string,
  offset = 0,
  quote = QUOTE,
  delimiter = DELIMITER,
): number {
  const len = str.length;
  let cursor = offset;
  while (cursor < len) {
    const i = str.indexOf(quote, cursor);
    if (i === -1) break;
    // skip the quote if it is delimited
    if (i > offset && str[i - 1] === delimiter) {
      cursor = i + 1;
    } else return i;
  }
  return -1;
}

export function quote(str: string): string {
  return `"${str.replace(/"/g, '\\"')}"`;
}

export function unquote(str: string): string {
  return str.slice(0, str.length).replace(/\\"/g, QUOTE);
}

export function expectCh(
  str: string,
  cursor: number,
  ch: string,
  description?: string,
): void {
  ok(cursor >= 0 && cursor < str.length, 'cursor out of range');
  if (str[cursor] !== ch) {
    throw new Error(
      `expected ${description || `"${ch}"`} but received (${
        str[cursor]
      }) at ${cursor}.`,
    );
  }
}
export function expectOneOf<T extends string>(
  str: string,
  cursor: number,
  chars: T[],
  description?: string,
): T {
  ok(cursor >= 0 && cursor < str.length, 'cursor out of range');
  const ch = str[cursor];
  const numChars = chars.length;
  switch (numChars) {
    case 0:
      break;
    case 1: {
      if (ch == chars[0]) return chars[0];
      break;
    }
    case 2: {
      if (ch == chars[0]) return chars[0];
      if (ch == chars[1]) return chars[1];
      break;
    }
    case 3: {
      if (ch == chars[0]) return chars[0];
      if (ch == chars[1]) return chars[1];
      if (ch == chars[2]) return chars[2];
      break;
    }
    default: {
      if (ch == chars[0]) return chars[0];
      if (ch == chars[1]) return chars[1];
      if (ch == chars[2]) return chars[2];
      if (ch == chars[3]) return chars[3];
      let i = 3;
      while (++i < numChars) {
        if (ch === chars[i]) return chars[i];
      }
    }
  }
  throw new Error(
    `expected ${
      description || chars.map((c) => `"${c}"`).join(' | ')
    }} but received "${ch}" at ${cursor}.`,
  );
}

export function sliceTo(
  str: string,
  cursor = 0,
  ch: string,
): { found: string; at: number } {
  const at = str.indexOf(ch, cursor);
  const found = at === -1 ? '' : str.slice(cursor, at);
  return { found, at };
}

export function sliceToOneOf(
  str: string,
  cursor = 0,
  ch: string[],
): { found: string; at: number } {
  if (str.length === 0) return { found: '', at: -1 };
  const len = str.length;
  const count = ch.length;
  let found = '';
  let at = -1;
  let i = cursor - 1;
  // Just the cases we need.
  switch (count) {
    case 1:
      return sliceTo(str, cursor, ch[0]);
    case 2: {
      while (++i < len) {
        if (ch[0] === str[i] || ch[1] === str[i]) {
          at = i;
          found = str.slice(cursor, at);
          break;
        }
      }
      break;
    }
    case 3: {
      while (++i < len) {
        if (ch[0] === str[i] || ch[1] === str[i] || ch[2] === str[i]) {
          at = i;
          found = str.slice(cursor, at);
          break;
        }
      }
    }
  }
  return { found, at };
}

export function sliceToNonDigit(
  str: string,
  cursor = 0,
): { found: string; at: number } {
  const len = str.length;
  let at = cursor - 1;
  while (++at < len) {
    if (str[at] < D0 || str[at] > D9)
      return { found: str.slice(cursor, at), at };
  }
  return { found: '', at: -1 };
}

export function expectOnlyDecimalCharacters(str: string, cursor = 0): void {
  const len = str.length;
  let i = -1;
  while (++i < len) {
    if (str[i] < D0 || str[i] > D9)
      throw new Error(
        `Invalid dot-notation; index starting at ${cursor} contains an invalid decimal character at ${
          cursor + i
        }.`,
      );
  }
}
