import {
  CLOSE_BRACE,
  DOT,
  OPEN_BRACE,
  QUOTE,
  expectCh,
  expectOneOf,
  expectOnlyDecimalCharacters,
  quote,
  sliceTo,
  sliceToOneOf,
  unquote,
} from '../parse-utils.js';
import { PathSegments } from '../types.js';
import { PathSchemeCodec } from './types.js';

/**
 * Determines if a string matches the following identifier grammar
 *
 * Identifier ::
 *    IdentifierName but not ReservedWord
 *
 * IdentifierName ::
 *    IdentifierStart
 *    IdentifierName IdentifierPart
 *
 * IdentifierStart ::
 *     UnicodeLetter
 *     $
 *     _
 *     \ UnicodeEscapeSequence
 *
 * IdentifierPart ::
 *     IdentifierStart
 *     UnicodeCombiningMark
 *     UnicodeDigit
 *     UnicodeConnectorPunctuation
 *     \ UnicodeEscapeSequence
 *
 * UnicodeLetter
 *     any character in the Unicode categories “Uppercase letter (Lu)”, “Lowercase letter (Ll)”, “Titlecase letter (Lt)”,
 *     “Modifier letter (Lm)”, “Other letter (Lo)”, or “Letter number (Nl)”.
 *
 * UnicodeCombiningMark
 *     any character in the Unicode categories “Non-spacing mark (Mn)” or “Combining spacing mark (Mc)”
 *
 * UnicodeDigit
 *     any character in the Unicode category “Decimal number (Nd)”
 *
 * UnicodeConnectorPunctuation
 *     any character in the Unicode category “Connector punctuation (Pc)”
 *
 * UnicodeEscapeSequence
 *     see 7.8.4.
 *
 * HexDigit :: one of
 *     0 1 2 3 4 5 6 7 8 9 a b c d e f A B C D E F
 *
 *
 */
const ALWAYS_QUOTE = [
  // keywords
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  // strict mode keywords
  'let',
  'static',
  'yield',
  // module/async keyword
  'await',
  // future reserved words
  'enum',
  // reserved in strict mode
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  // reserved in older standards
  'abstract',
  'boolean',
  'byte',
  'char',
  'double',
  'final',
  'float',
  'goto',
  'int',
  'long',
  'native',
  'short',
  'synchronized',
  'throws',
  'transient',
  'volatile',
  // special meaning
  'arguments',
  'as',
  'async',
  'eval',
  'from',
  'get',
  'of',
  'set',
].sort();

function isEcmaScriptWord(word: string): boolean {
  // binary search
  let start = 0;
  let end = ALWAYS_QUOTE.length - 1;
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    if (ALWAYS_QUOTE[mid] === word) return true;
    else if (ALWAYS_QUOTE[mid] < word) start = mid + 1;
    else end = mid - 1;
  }
  return false;
}

const IDENTIFIER_RE =
  /^[$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}][$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*$/u;

function mustQuote(candidate: string): boolean {
  return !IDENTIFIER_RE.test(candidate) || isEcmaScriptWord(candidate);
}

class DottedPathPointerCodec implements PathSchemeCodec {
  public encode(path: PathSegments): string {
    const len = path.length;
    if (len === 0) return DOT;
    let dotted = '';
    let i = -1;
    while (++i < len) {
      let it = path[i];
      if (typeof it === 'number') {
        dotted += `.[${it}]`;
      } else {
        it = String(it);
        dotted += mustQuote(it) ? `.[${quote(it)}]` : `.${it}`;
      }
    }
    return dotted;
  }

  decode(dotted: string): PathSegments {
    const keys: PathSegments = [];
    const len = dotted.length;
    let cursor = 0;
    if (dotted[cursor] === DOT) cursor++;
    while (cursor < len) {
      if (dotted[cursor] === OPEN_BRACE) {
        cursor++;
        if (dotted[cursor] === QUOTE) {
          const { found, at } = sliceTo(dotted, cursor + 1, CLOSE_BRACE);
          if (at === -1) {
            throw new Error(
              `Invalid dot-notation; unterminated double-quote starting at ${cursor}.`,
            );
          }
          const key = unquote(found);
          keys.push(key);
          cursor = at;
          expectCh(dotted, cursor++, CLOSE_BRACE);
        } else {
          // If not a double-quoted string, it must be an array index.
          const { found, at } = sliceTo(dotted, cursor, CLOSE_BRACE);
          if (at === -1) {
            throw new Error(
              `Invalid dot-notation; unterminated open-brace starting at ${cursor}.`,
            );
          }
          expectOnlyDecimalCharacters(found, cursor);
          keys.push(parseInt(found, 10));
          cursor = at + 1;
        }
      } else {
        const { found, at } = sliceToOneOf(dotted, cursor, [DOT, OPEN_BRACE]);
        if (at === cursor)
          throw new Error(
            `Invalid dot-notation; empty path segment at ${cursor} not allowed.`,
          );
        keys.push(at !== -1 ? found : dotted.slice(cursor));
        cursor = at === -1 ? len : at;
      }
      // expect dot separating keys
      if (cursor < len) {
        const ch = expectOneOf(dotted, cursor, [DOT, OPEN_BRACE]);
        if (ch === DOT) cursor++;
      }
    }
    return keys;
  }
}

export const dottedPathSchemeCodec = new DottedPathPointerCodec();
