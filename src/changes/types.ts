import { PropertyAddedRecord } from './property-added-record.js';
import { PropertyEditedRecord } from './property-edited-record.js';
import { PropertyMovedRecord } from './property-moved-record.js';
import { PropertyRemovedRecord } from './property-removed-record.js';

export type PropertyChangeRecord =
  | PropertyAddedRecord
  | PropertyEditedRecord
  | PropertyRemovedRecord
  | PropertyMovedRecord;

export type PropertyChangeRecords = PropertyChangeRecord[];
