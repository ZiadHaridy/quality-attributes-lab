// Monitor (watchdog): the component must reset a timer before it runs out.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class Watchdog {
  constructor(name, timeoutMs, onTimeout) {
    this.name = name;
    this.timeoutMs = timeoutMs;
    this.onTimeout = onTimeout;
  }

  reset() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.onTimeout(this.name), this.timeoutMs);
  }

  stop() {
    clearTimeout(this.timer);
  }
}

if (isMain(import.meta.url)) {
  title('Monitor: a watchdog on the matching service');

  const watchdog = new Watchdog('matching', 1500, (name) =>
    log('watchdog', `${name} did not reset the timer for 1.5 s → ALARM, restart it`, 'fail'));

  watchdog.reset();
  for (let i = 0; i < 3; i++) {
    await sleep(1000);
    log('matching', 'working... reset the watchdog timer', 'ok');
    watchdog.reset();
  }

  log('matching', 'stuck in an infinite loop', 'warn');
  await sleep(2000);
  watchdog.stop();
}
