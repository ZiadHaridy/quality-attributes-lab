// Escalating restart: restart as little as possible. Escalate only if the fault is still there.
import { log, sleep, title, isMain } from '../shared/utils.js';

export const LEVELS = [
  { level: 0, action: 'restart the stuck threads', ms: 100 },
  { level: 1, action: 'clear the cache (unprotected memory)', ms: 300 },
  { level: 2, action: 'restart the whole matching process', ms: 800 },
  { level: 3, action: 'reboot the server and reload everything', ms: 2000 },
];

export async function escalatingRestart(service) {
  for (const step of LEVELS) {
    log('restart', `level ${step.level}: ${step.action}`, 'warn');
    await sleep(step.ms);
    if (service.healthyAfter(step.level)) return step;
    log('restart', 'still broken, escalate', 'fail');
  }
  return null;
}

if (isMain(import.meta.url)) {
  title('Escalating restart: matching keeps returning wrong drivers');

  const matching = { healthyAfter: (level) => level >= 2 }; // the bug lives in the process memory
  const fixedBy = await escalatingRestart(matching);

  if (fixedBy) log('result', `healthy again after level ${fixedBy.level}; levels 3+ were never needed`, 'ok');
  else log('result', 'nothing worked, call the on-call engineer', 'fail');
}
