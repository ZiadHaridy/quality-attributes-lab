// Self-test: a component runs its own tests before it serves real riders.
import { log, title, isMain } from '../shared/utils.js';

export function nearestDriver(rider, drivers, distance) {
  return drivers.reduce((best, d) => (distance(rider, d) < distance(rider, best) ? d : best));
}

const testCity = [
  { rider: { x: 0, y: 0 }, drivers: [{ name: 'A', x: 5, y: 5 }, { name: 'B', x: 1, y: 2 }], expected: 'B' },
  { rider: { x: 10, y: 0 }, drivers: [{ name: 'A', x: 9, y: 1 }, { name: 'B', x: 0, y: 0 }], expected: 'A' },
  { rider: { x: 3, y: 3 }, drivers: [{ name: 'A', x: 3, y: -4 }, { name: 'B', x: 0, y: 7 }], expected: 'B' },
];

export function selfTest(distance) {
  return testCity.map((t) => nearestDriver(t.rider, t.drivers, distance).name === t.expected);
}

if (isMain(import.meta.url)) {
  const versions = {
    'v1.4': (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    'v1.5': (a, b) => Math.abs(a.x - b.x), // bug: forgot the y axis
  };

  for (const [version, distance] of Object.entries(versions)) {
    title(`Self-test: matching ${version} starts up`);
    const results = selfTest(distance);
    results.forEach((passed, i) => log('self-test', `test ${i + 1}: ${passed ? 'pass' : 'FAIL'}`, passed ? 'ok' : 'fail'));
    if (results.every(Boolean)) log('matching', `${version} passed, start serving riders`, 'ok');
    else log('matching', `${version} failed its self-test, refuse to go live`, 'fail');
  }
}
