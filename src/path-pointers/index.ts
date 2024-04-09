import { DOT, HASH, OPEN_BRACE, expectOneOf } from '../parse-utils.js';
import { PathSegments } from '../types.js';
import { dottedPathSchemeCodec } from './dotted-notation.js';
import { uriFragmentPointerCodec } from './fragment-pointer-notation.js';
import { jsonSchemeCodec } from './json-notation.js';
import {
  PathAndPointer,
  PathPointer,
  PathScheme,
  PathSchemeCodec,
  PathSchemes,
} from './types.js';

let defaultScheme = PathSchemes.pointer;

export function getDefaultPathScheme(): PathScheme {
  return defaultScheme;
}

export function setDefaultPathScheme(scheme: PathScheme): PathScheme {
  if (!PathSchemes[scheme])
    throw new Error(`Unrecognized path scheme: ${scheme}`);
  const recent = defaultScheme;
  defaultScheme = scheme;
  return recent;
}

export function selectPathSchemeCodec(scheme?: PathScheme): PathSchemeCodec {
  const which = PathSchemes[scheme || defaultScheme];
  if (which === PathSchemes.pointer) return uriFragmentPointerCodec;
  if (which === PathSchemes.dotted) return dottedPathSchemeCodec;
  if (which === PathSchemes.json) return jsonSchemeCodec;
  throw new Error(`Unrecognized path scheme: ${scheme}`);
}

export function encodePointer(path: PathSegments, scheme?: PathScheme): string {
  const which = PathSchemes[scheme || defaultScheme];
  if (which === PathSchemes.pointer)
    return uriFragmentPointerCodec.encode(path);
  if (which === PathSchemes.dotted) return dottedPathSchemeCodec.encode(path);
  if (which === PathSchemes.json) return jsonSchemeCodec.encode(path);
  throw new Error(`Unrecognized path scheme: ${scheme}`);
}

export function decodePointer(pointer: string): PathSegments {
  const which = expectOneOf(pointer, 0, [HASH, DOT, OPEN_BRACE]);
  if (which === HASH) return uriFragmentPointerCodec.decode(pointer);
  if (which === DOT) return dottedPathSchemeCodec.decode(pointer);
  return jsonSchemeCodec.decode(pointer);
}

export function decodePathPointer(target: PathPointer): PathAndPointer {
  // Normalize pointer to the default notation.
  const isPointer = typeof target === 'string';
  const path = isPointer ? decodePointer(target) : (target as PropertyKey[]);
  return { path, pointer: encodePointer(path, defaultScheme) };
}

export function parentPath(path: PathPointer): PathAndPointer {
  return decodePathPointer(path.slice(0, path.length - 1));
}

export * from './types.js';
export * from './dotted-notation.js';
export * from './fragment-pointer-notation.js';
export * from './json-notation.js';
