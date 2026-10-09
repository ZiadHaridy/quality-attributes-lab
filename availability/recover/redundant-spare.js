// Redundant spare: a backup copy takes over when the active copy fails.
// Hot = gets every request, warm = gets state updates now and then, cold = off until needed.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class MatchingCopy {
  constructor(name) {
    this.name = name;
    this.up = true;
    this.trips = [];
  }

  handle(trip) {
    if (!this.up) throw new Error(`${this.name} is down`);
    this.trips.push(trip);
  }
}

async function run(kind) {
  title(`${kind.toUpperCase()} spare`);
  const primary = new MatchingCopy('primary');
  const spare = new MatchingCopy('spare');
  let active = primary;

  for (let i = 1; i <= 6; i++) {
    const trip = `trip-${i}`;
    if (i === 5) {
      primary.up = false;
      log('primary', 'crashes!', 'fail');
    }

    try {
      active.handle(trip);
      if (kind === 'hot' && active === primary) spare.handle(trip);
      log('gateway', `${trip} → ${active.name}`, 'ok');
      if (kind === 'warm' && active === primary && i % 3 === 0) {
        spare.trips = [...primary.trips];
        log('spare', `state update: now knows ${spare.trips.length} trips`);
      }
    } catch {
      if (kind === 'cold') {
        log('spare', 'powering on and starting up...', 'warn');
        await sleep(1500);
      }
      active = spare;
      active.handle(trip);
      log('gateway', `${trip} → FAILOVER → ${active.name}`, 'warn');
    }
  }

  const lost = primary.trips.filter((t) => !spare.trips.includes(t));
  if (lost.length) log('result', `the spare never heard of: ${lost.join(', ')}`, 'fail');
  else log('result', 'the spare knows every trip, nothing lost', 'ok');
}

if (isMain(import.meta.url)) {
  for (const kind of ['hot', 'warm', 'cold']) await run(kind);
}
