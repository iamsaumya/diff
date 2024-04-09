import { PathSegments } from '../types.js';

export type PathScheme = 'json' | 'pointer' | 'dotted';
export type PathPointer = PathSegments | string;
export type PathAndPointer = {
  path: PathSegments;
  pointer: string;
};

export type EncodePath = (path: PathSegments) => string;
export type DecodePath = (path: string) => PathSegments;

export const PathSchemes: Record<string, PathScheme> = Object.freeze({
  dotted: 'dotted',
  json: 'json',
  pointer: 'pointer',
});

export interface PathSchemeCodec {
  encode: EncodePath;
  decode: DecodePath;
}
