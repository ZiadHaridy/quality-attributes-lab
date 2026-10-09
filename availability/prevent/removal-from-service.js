// Removal from service: take a copy out on purpose and restart it before a slow fault
// (here a memory leak) turns into a crash.
import { log, title, isMain } from '../shared/utils.js';

export const LIMIT_MB = 512;
export const RESTART_AT_MB = 400;

export function nightlyCheck(copies) {
  const inService = copies.filter((c) => c.inService);
  const victim = inService.find((c) => c.memory >= RESTART_AT_MB);
  if (victim && inService.length > 1) {
    victim.inService = false;
    return victim;
  }
  return null;
}

if (isMain(import.meta.url)) {
  title('Removal from service: matching leaks 40 MB every hour');

  const copies = [
    { name: 'matching-1', memory: 200, inService: true },
    { name: 'matching-2', memory: 260, inService: true },
    { name: 'matching-3', memory: 320, inService: true },
  ];

  for (let hour = 1; hour <= 6; hour++) {
    copies.forEach((c) => { c.memory += 40; });
    log(`hour ${hour}`, copies.map((c) => `${c.name}: ${c.memory} MB`).join('  '));

    const victim = nightlyCheck(copies);
    if (victim) {
      log('ops', `${victim.name} reached ${victim.memory} MB → remove it and restart it`, 'warn');
      victim.memory = 200;
      victim.inService = true;
      log('ops', `${victim.name} back in service at 200 MB`, 'ok');
    }
  }

  const crashed = copies.filter((c) => c.memory >= LIMIT_MB);
  log('result', crashed.length ? `${crashed.length} copies crashed` : `no copy ever reached the ${LIMIT_MB} MB crash limit`, crashed.length ? 'fail' : 'ok');
}
