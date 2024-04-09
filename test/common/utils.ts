import { faker } from '@faker-js/faker';
import { PropertyKey } from '../../src/deep-diff.js';
import { hrtime } from 'process';

export const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);

export interface Vehicle {
  year: number;
  manufacturer: string;
  model: string;
  type: string;
  fuel: string;
  color: string;
  vin: string;
  blurb: string;
}

export const EnumerableVehicleProperties: PropertyKey[] = [
  'year',
  'manufacturer',
  'model',
  'type',
  'fuel',
  'color',
  'vin',
  'blurb',
];
export const AllVehicleProperties = EnumerableVehicleProperties.concat(['vrm']);

export function makeVehicle(): Vehicle {
  const vehicle = {
    year: faker.date.past({ years: 112 }).getFullYear(),
    manufacturer: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    type: faker.vehicle.type(),
    fuel: faker.vehicle.fuel(),
    color: faker.vehicle.color(),
    vin: faker.vehicle.vin(),
    blurb: faker.lorem.paragraph(),
  };
  Object.defineProperty(vehicle, 'vrm', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: faker.vehicle.vrm(),
  });
  return vehicle;
}

export function makeVehicles(count: number): Vehicle[] {
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < count; ++i) {
    vehicles.push(makeVehicle());
  }
  return vehicles;
}

export function changeVrm(it: Vehicle): Vehicle {
  const vehicle: Vehicle = {
    ...it,
  };
  Object.defineProperty(vehicle, 'vrm', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: faker.vehicle.vrm(),
  });
  return vehicle;
}

export function changeRandomVrm(it: Vehicle[]): Vehicle[] {
  const item = rand(1, it.length) - 1;
  it[item] = changeVrm(it[item]);
  return it;
}

export const $sym = Symbol('sym');

export function addSymbol<T>(it: T): T {
  it[$sym] = faker.string.uuid();
  return it;
}

export function addSymbolToRandom<T>(it: T[]): T[] {
  const item = rand(1, it.length) - 1;
  addSymbol(it[item]);
  return it;
}

export function copy<T>(
  it: T,
  includeNonEnumerable = false,
  includeSymbols = false,
): T {
  const copy = includeNonEnumerable
    ? copyWithNonEnumerable(it)
    : {
        ...it,
      };
  if (includeSymbols) {
    for (const sym of Object.getOwnPropertySymbols(it)) {
      const descriptor = Object.getOwnPropertyDescriptor(it, sym);
      Object.defineProperty(copy, sym, descriptor);
    }
  }
  return copy;
}

export function copyWithNonEnumerable<T>(it: T): T {
  const copy = {};
  for (const name of Object.getOwnPropertyNames(it)) {
    const descriptor = Object.getOwnPropertyDescriptor(it, name);
    Object.defineProperty(copy, name, descriptor);
  }
  return copy as T;
}

export function moveRandomElement<T>(arr: T[]): T[] {
  if (arr.length < 2) return arr;
  const n = rand(1, arr.length) - 1;
  let m = 0;
  do {
    m = rand(1, arr.length) - 1;
  } while (m === n);
  [arr[n], arr[m]] = [arr[m], arr[n]];
  return arr;
}

export type Gender = 'male' | 'female';

export interface Employee {
  gender: Gender;
  firstName: string;
  lastName: string;
  middleName?: string;
  prefix?: string;
  jobArea: string;
  jobDescriptor: string;
  jobTitle: string;
  jobType: string;
  boss?: Employee;
  subordinates?: [];
}

export const EnumerableEmployeeProperties: PropertyKey[] = [
  'gender',
  'firstName',
  'lastName',
  'middleName',
  'prefix',
  'jobArea',
  'jobDescriptor',
  'jobTitle',
  'jobType',
  'boss',
  'subordinates',
];
export const OptionalEmployeeProperties: PropertyKey[] = [
  'middleName',
  'prefix',
  'boss',
  'subordinates',
];

export function makeWorker(): Employee {
  const gender = faker.person.sex() as Gender;
  const chance = rand(0, 100);
  const hasMiddleName = chance % 3 === 0;
  const hasPrefix = chance % 5 === 0;
  return {
    gender,
    firstName: faker.person.firstName(gender),
    lastName: faker.person.lastName(gender),
    ...(hasMiddleName && { middleName: faker.person.middleName(gender) }),
    ...(hasPrefix && { prefix: faker.person.prefix(gender) }),
    jobArea: faker.person.jobArea(),
    jobDescriptor: faker.person.jobDescriptor(),
    jobTitle: faker.person.jobTitle(),
    jobType: faker.person.jobType(),
  };
}

const NS_PER_SEC = 1e9;
export function elapsed(
  time: [number, number],
  ops: number,
  name = 'unnamed',
): void {
  const diff = hrtime(time);
  const elapsed_ns = diff[0] * NS_PER_SEC + diff[1];
  const elapsed_ms = elapsed_ns / 1000000;
  console.log(
    `${name}: ${Math.floor(
      ops / elapsed_ms,
    )}/ms; elapsed ${elapsed_ns}ns or ${elapsed_ms}ms`,
  );
}
