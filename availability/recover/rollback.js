// Rollback: save known-good checkpoints and go back to the last one after a failure.
import { log, title, isMain } from '../shared/utils.js';

export class Checkpoints {
  constructor() {
    this.saved = [];
  }

  save(state) {
    this.saved.push(structuredClone(state));
  }

  last() {
    return structuredClone(this.saved.at(-1));
  }
}

const isValid = (trip) => trip.fare >= 0 && Boolean(trip.driver);

if (isMain(import.meta.url)) {
  title('Rollback: the state of trip-42');

  const checkpoints = new Checkpoints();
  let trip = { id: 'trip-42', status: 'driver assigned', driver: 'Sara', fare: 0 };
  checkpoints.save(trip);
  log('checkpoint', JSON.stringify(trip), 'ok');

  trip = { ...trip, status: 'started', fare: 35 };
  checkpoints.save(trip);
  log('checkpoint', JSON.stringify(trip), 'ok');

  trip = { ...trip, status: 'ended', fare: -9999, driver: null };
  log('pricing', 'a buggy release writes a bad update', 'warn');

  if (!isValid(trip)) {
    log('trips', `invalid state: ${JSON.stringify(trip)}`, 'fail');
    trip = checkpoints.last();
    log('trips', `rolled back to: ${JSON.stringify(trip)}`, 'ok');
  }
}
