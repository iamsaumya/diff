import { PropertyChange } from '../types.js';

export interface Transform<T> {
  to(change: PropertyChange): T;
  from(source: T): PropertyChange;
}
