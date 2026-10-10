// Exception prevention: design the code so the error cannot happen at all.
// A location is checked once, when it is created. After that it is always valid,
// so the distance code never crashes.
import { log, title, isMain } from '../shared/utils.js';

export function createLocation(raw) {
  if (typeof raw?.x !== 'number' || typeof raw?.y !== 'number') return null;
  return Object.freeze({ x: raw.x, y: raw.y }); // frozen: nobody can break it later
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

if (isMain(import.meta.url)) {
  const rider = { x: 0, y: 0 };
  const drivers = [
    { name: 'Sara', location: { x: 1, y: 2 } },
    { name: 'Omar' }, // just logged in, no location yet
    { name: 'Mona', location: { x: 4, y: 3 } },
  ];

  title('Without prevention: raw data goes straight into the math');
  try {
    for (const d of drivers) log('matching', `${d.name}: ${distance(rider, d.location).toFixed(1)} km`);
  } catch (error) {
    log('matching', `crashed: ${error.message}`, 'fail');
  }

  title('With prevention: only valid locations exist');
  for (const d of drivers) {
    const location = createLocation(d.location);
    if (!location) log('matching', `${d.name}: no valid location yet, skipped`, 'warn');
    else log('matching', `${d.name}: ${distance(rider, location).toFixed(1)} km`, 'ok');
  }
}
