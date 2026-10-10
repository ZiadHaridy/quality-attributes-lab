// Removal from service: restart a copy on purpose BEFORE a slow fault crashes it.
// Here matching leaks 40 MB of memory every hour and crashes at 512 MB.
import { log, title, isMain } from '../shared/utils.js';

export const CRASH_AT_MB = 512;
export const RESTART_AT_MB = 400; // well before the crash

export function restartIfNeeded(copy) {
  if (copy.memory < RESTART_AT_MB) return false;
  copy.memory = 200; // a restart gives the leaked memory back
  return true;
}

if (isMain(import.meta.url)) {
  title('Removal from service: matching leaks 40 MB every hour');

  const copies = [
    { name: 'matching-1', memory: 200 },
    { name: 'matching-2', memory: 320 },
  ];

  for (let hour = 1; hour <= 6; hour++) {
    for (const copy of copies) copy.memory += 40;
    log(`hour ${hour}`, copies.map((copy) => `${copy.name}: ${copy.memory} MB`).join('   '));

    for (const copy of copies) {
      if (restartIfNeeded(copy)) {
        log('ops', `${copy.name} restarted (the other copy kept serving riders)`, 'warn');
      }
    }
  }

  log('result', `no copy ever reached the ${CRASH_AT_MB} MB crash`, 'ok');
}
