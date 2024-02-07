const SortType = {
  DEFAULT: 'default',
  TIME: 'time',
  PRICE: 'price',
};

const UserAction = {
  UPDATE_EVENT: 'UPDATE_EVENT',
  ADD_EVENT: 'ADD_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
};

const UpdateType = {
  PATCH: 'PATCH',
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  INIT: 'INIT',
};

const FilterType = {
  EVERYTHING: 'EVERYTHING',
  FUTURE: 'FUTURE',
  PRESENT: 'PRESENT',
  PAST: 'PAST',
};

const DEFAULT_EVENT = {
  id: '',
  basePrice: 0,
  dateFrom: '',
  dateTo: '',
  destination: '',
  isFavorite: false,
  offers: [],
  type: 'flight',
};

const TIME_LIMIT = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000,
};

export const EVENT_COUNT = 10;
export const MS_IN_MIN = 60000;
export const MIN_IN_HOUR = 60;
export const MIN_IN_DAY = 1440;

export { SortType, UserAction, UpdateType, FilterType, DEFAULT_EVENT, TIME_LIMIT };
