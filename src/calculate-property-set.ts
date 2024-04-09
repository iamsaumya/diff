export type PropertyOccurrence = [PropertyKey, number?, number?];
export type PropertySet = PropertyOccurrence[];

/**
 * Maps properties to their index.
 * @param props list of properties
 * @returns  Map of property => index
 */
function indexProps(props: PropertyKey[]): Map<PropertyKey, number> {
  const map = new Map<PropertyKey, number>();
  const len = props.length;
  /** unroll loops up to 10 items */
  switch (len) {
    case 0: {
      break;
    }
    case 1: {
      map.set(props[0], 0);
      return map;
    }
    case 2: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      return map;
    }
    case 3: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      return map;
    }
    case 4: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      return map;
    }

    case 5: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      return map;
    }
    case 6: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      map.set(props[5], 5);
      return map;
    }
    case 7: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      map.set(props[5], 5);
      map.set(props[6], 6);
      return map;
    }
    case 8: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      map.set(props[5], 5);
      map.set(props[6], 6);
      map.set(props[7], 7);
      return map;
    }
    case 9: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      map.set(props[5], 5);
      map.set(props[6], 6);
      map.set(props[7], 7);
      map.set(props[8], 8);
      return map;
    }
    case 10: {
      map.set(props[0], 0);
      map.set(props[1], 1);
      map.set(props[2], 2);
      map.set(props[3], 3);
      map.set(props[4], 4);
      map.set(props[5], 5);
      map.set(props[6], 6);
      map.set(props[7], 7);
      map.set(props[8], 8);
      map.set(props[9], 9);
      return map;
    }
  }
  // We have at-least 10 items, take them in chunks
  let i = 0;
  while (i < len - 10) {
    map.set(props[i], i);
    map.set(props[i + 1], i + 1);
    map.set(props[i + 2], i + 2);
    map.set(props[i + 3], i + 3);
    map.set(props[i + 4], i + 4);
    map.set(props[i + 5], i + 5);
    map.set(props[i + 6], i + 6);
    map.set(props[i + 7], i + 7);
    map.set(props[i + 8], i + 8);
    map.set(props[i + 9], i + 9);
    i += 10;
  }
  while (i < len - 5) {
    map.set(props[i], i);
    map.set(props[i + 1], i + 1);
    map.set(props[i + 2], i + 2);
    map.set(props[i + 3], i + 3);
    map.set(props[i + 4], i + 4);
    i += 5;
  }
  while (i < len - 2) {
    map.set(props[i], i);
    map.set(props[i + 1], i + 1);
    i += 2;
  }
  while (i < len) {
    map.set(props[i], i++);
  }
  return map;
}

/**
 * Calculates the set of properties, and their locations
 * in the specified objects.
 * @param subject object the subject data object
 * @param comparand object the comparand data object
 * @returns the set of properties across both objects,
 * and their locations relative to each
 */
export function calculatePropertySet(
  subject: PropertyKey[],
  comparand: PropertyKey[],
): PropertySet {
  const leftLen = subject.length;
  const rightLen = comparand.length;
  const left = indexProps(subject);
  const right = indexProps(comparand);
  const leftProbe = Array(leftLen);
  const props: PropertySet = [];
  const len = Math.max(leftLen, rightLen);
  let i = -1;
  while (++i < len) {
    if (i < rightLen) {
      const p = comparand[i];
      const l = left.get(p);
      if (l !== i && i < leftLen) {
        const p = subject[i];
        const rr = right.get(p);
        if (rr === undefined) {
          props.push([p, i, rr]);
          leftProbe[i] = true;
        }
      }
      props.push([p, l, i]);
      leftProbe[l] = true;
      continue;
    }
    if (i < leftLen && !leftProbe[i]) {
      props.push([subject[i], i, undefined]);
    }
  }
  return props;
}
