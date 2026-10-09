// Exception prevention: design the code so the exception cannot happen.
// Here a Location type that can never be invalid (like smart pointers / wrappers in the book).
import { log, title, isMain } from '../shared/utils.js';

export class Location {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  static from(raw) {
    if (typeof raw?.x !== 'number' || typeof raw?.y !== 'number') return null;
    return new Location(raw.x, raw.y);
  }

  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

const unsafeDistance = (rider, driver) => Math.hypot(rider.location.x - driver.location.x, rider.location.y - driver.location.y);

export function nearbyDrivers(rider, drivers) {
  const from = Location.from(rider.location);
  return drivers
    .map((d) => ({ name: d.name, location: Location.from(d.location) }))
    .filter((d) => d.location !== null)
    .map((d) => ({ name: d.name, km: d.location.distanceTo(from).toFixed(1) }));
}

if (isMain(import.meta.url)) {
  const rider = { location: { x: 0, y: 0 } };
  const drivers = [
    { name: 'Sara', location: { x: 1, y: 2 } },
    { name: 'Omar' }, // just logged in, no location yet
    { name: 'Mona', location: { x: 4, y: 3 } },
  ];

  title('Without prevention');
  try {
    drivers.forEach((d) => log('matching', `${d.name}: ${unsafeDistance(rider, d).toFixed(1)} km`));
  } catch (error) {
    log('matching', `crashed: ${error.message}`, 'fail');
  }

  title('With prevention');
  for (const d of nearbyDrivers(rider, drivers)) log('matching', `${d.name}: ${d.km} km`, 'ok');
  log('result', 'Omar is skipped until he has a valid location, nothing crashes', 'ok');
}
