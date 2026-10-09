// Increase competence set: teach the component to handle more cases as normal, instead of failing.
import { log, title, isMain } from '../shared/utils.js';

const drivers = [
  { name: 'Sara', x: 4, y: 1, lastKnown: null },
  { name: 'Omar', x: null, y: null, lastKnown: { x: 6, y: 6 } }, // GPS lost, last position known
];
const rider = { x: 0, y: 0 };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function findDriverV1(rider, drivers) {
  const near = drivers.filter((d) => d.x !== null && distance(rider, d) <= 2);
  if (!near.length) throw new Error('NO_DRIVER_FOUND');
  return near[0];
}

export function findDriverV2(rider, drivers) {
  const located = drivers.map((d) => (d.x === null && d.lastKnown ? { ...d, ...d.lastKnown } : d)).filter((d) => d.x !== null);
  for (const radius of [2, 5, 10]) {
    const near = located.filter((d) => distance(rider, d) <= radius);
    if (near.length) return { ...near[0], radius };
  }
  return null;
}

if (isMain(import.meta.url)) {
  title('Increase competence set: a rider in Agami late at night');

  try {
    findDriverV1(rider, drivers);
  } catch (error) {
    log('v1', `${error.message} → the rider sees an error`, 'fail');
  }

  const found = findDriverV2(rider, drivers);
  log('v2', 'nobody within 2 km → this is normal now: widen the search', 'warn');
  log('v2', `found ${found.name} within ${found.radius} km`, 'ok');
}
