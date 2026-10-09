// Fake services of the ride app. Each one can be broken on purpose with the /chaos endpoints.
import { sleep } from '../shared/utils.js';

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const drivers = [
  { name: 'Omar', x: 2, y: 3 },
  { name: 'Sara', x: 6, y: 1 },
  { name: 'Mona', x: 9, y: 7 },
];

export class Matching {
  constructor(name) {
    this.name = name;
    this.up = true;
    this.trips = [];
  }

  async ping() {
    if (!this.up) await new Promise(() => {});
  }

  match(trip, onlineDrivers) {
    if (!this.up) throw new Error(`${this.name} is down`);
    if (!onlineDrivers.length) throw new Error('no drivers online');
    const driver = onlineDrivers.reduce((best, d) => (distance(trip.pickup, d) < distance(trip.pickup, best) ? d : best));
    this.trips.push(trip.id);
    return driver;
  }
}

export const maps = {
  up: true,

  async ping() {
    if (!this.up) await new Promise(() => {});
  },

  async eta(from, to) {
    await sleep(50);
    if (!this.up) throw new Error('maps is down');
    return Math.ceil(distance(from, to) * 2.5);
  },
};

export const payments = {
  mode: 'up', // up | flaky | down
  calls: 0,

  async ping() {
    if (this.mode === 'down') await new Promise(() => {});
  },

  async authorize(amount) {
    this.calls++;
    await sleep(100);
    if (this.mode === 'down') throw new Error('payment provider is down');
    if (this.mode === 'flaky' && this.calls % 3 !== 0) throw new Error('payment provider timed out');
    return `auth-${this.calls} (${amount} EGP)`;
  },
};
