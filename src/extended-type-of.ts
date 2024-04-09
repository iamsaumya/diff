export enum ExtendedTypeOf {
  array,
  bigint,
  date,
  function,
  map,
  math,
  null,
  number,
  object,
  regexp,
  set,
  string,
  symbol,
  undefined,
}

export const PropertyAssignable = new Map<ExtendedTypeOf, boolean>([
  [ExtendedTypeOf.array, true],
  [ExtendedTypeOf.date, true], // ??!
  [ExtendedTypeOf.bigint, false],
  [ExtendedTypeOf.function, true],
  [ExtendedTypeOf.map, true], // ??!
  [ExtendedTypeOf.math, true], // ??!
  [ExtendedTypeOf.null, false],
  [ExtendedTypeOf.number, false],
  [ExtendedTypeOf.object, true],
  [ExtendedTypeOf.regexp, true], // ??!
  [ExtendedTypeOf.set, true], // ??!
  [ExtendedTypeOf.string, false],
  [ExtendedTypeOf.symbol, false],
  [ExtendedTypeOf.undefined, false],
]);

export function extendedTypeOf(subject: unknown): ExtendedTypeOf {
  const type = typeof subject;
  if (type !== 'object') return ExtendedTypeOf[type];
  if (subject === null) return ExtendedTypeOf.null;
  if (Array.isArray(subject)) return ExtendedTypeOf.array;
  const objectStringTag = Object.prototype.toString.call(subject);
  // Short circuit on object, it is probably most common.
  if (objectStringTag === '[object Object]') return ExtendedTypeOf.object;
  if (objectStringTag === '[object Date]') return ExtendedTypeOf.date;
  if (objectStringTag === '[object Map]') return ExtendedTypeOf.map;
  if (objectStringTag === '[object Math]') return ExtendedTypeOf.math;
  if (objectStringTag === '[object RegExp]') return ExtendedTypeOf.regexp;
  if (objectStringTag === '[object Set]') return ExtendedTypeOf.set;
  // TODO: Decide what to do about Buffer, which occurs often in node.
  // ...all others are objects.
  return ExtendedTypeOf.object;
}
