// Graceful degradation: when a part fails, drop the extras and keep the core working.
import { log, sleep, title, isMain } from '../shared/utils.js';

const roughEta = (driver, pickup) => Math.ceil(Math.hypot(driver.x - pickup.x, driver.y - pickup.y) * 2) + 2;

export async function bookRide(pickup, driver, maps) {
  const ride = { booked: true, driver: driver.name };
  try {
    ride.eta = `${await maps.eta(driver, pickup)} min`;
    ride.liveMap = true;
  } catch {
    ride.eta = `~${roughEta(driver, pickup)} min (rough)`;
    ride.liveMap = false;
  }
  return ride;
}

if (isMain(import.meta.url)) {
  const maps = {
    up: true,
    async eta() {
      await sleep(100);
      if (!this.up) throw new Error('maps service is down');
      return 7;
    },
  };
  const driver = { name: 'Sara', x: 2, y: 3 };
  const pickup = { x: 4, y: 5 };

  title('Graceful degradation 1: everything works');
  log('rides', JSON.stringify(await bookRide(pickup, driver, maps)), 'ok');

  title('Graceful degradation 2: the maps service is down');
  maps.up = false;
  log('maps', 'down!', 'fail');
  log('rides', JSON.stringify(await bookRide(pickup, driver, maps)), 'warn');
  log('result', 'no live map and a rough ETA, but riders can still book', 'ok');
}
