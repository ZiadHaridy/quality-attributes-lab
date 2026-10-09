// Predictive model: watch a trend and act before it becomes a fault.
import { log, sleep, title, isMain } from '../shared/utils.js';

export function predict(history, stepsAhead) {
  const slope = (history.at(-1) - history[0]) / (history.length - 1);
  return Math.round(history.at(-1) + slope * stepsAhead);
}

if (isMain(import.meta.url)) {
  title('Predictive model: the queue of ride requests waiting for matching');

  const CAPACITY = 100;
  const ARRIVALS = 23;
  const PER_COPY = 15;
  let copies = 1;
  let queue = 20;
  const history = [queue];

  for (let tick = 1; tick <= 10; tick++) {
    queue = Math.max(0, queue + ARRIVALS - copies * PER_COPY);
    history.push(queue);
    const recent = history.slice(-4);
    const predicted = predict(recent, 3);

    log(`tick ${tick}`, `queue ${queue}/${CAPACITY}, predicted in 3 ticks: ${predicted}`, queue > 80 ? 'fail' : 'info');

    if (copies === 1 && predicted > CAPACITY * 0.8) {
      copies = 2;
      log('model', 'overload predicted → start matching-2 now, before anything fails', 'warn');
    }
    await sleep(150);
  }
  log('result', `the queue never reached ${CAPACITY}, no request was dropped`, 'ok');
}
