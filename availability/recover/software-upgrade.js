// Software upgrade: upgrade one copy at a time while the others keep serving (rolling upgrade).
import { log, sleep, title, isMain } from '../shared/utils.js';

export function createRouter(copies) {
  let next = 0;
  return () => {
    const available = copies.filter((c) => c.up);
    if (!available.length) throw new Error('no copy available');
    return available[next++ % available.length];
  };
}

if (isMain(import.meta.url)) {
  title('Software upgrade: matching v1 → v2 with zero downtime');

  const copies = [1, 2, 3].map((n) => ({ name: `matching-${n}`, version: 'v1', up: true }));
  const route = createRouter(copies);
  let served = 0;

  for (const copy of copies) {
    copy.up = false;
    log('deploy', `${copy.name} out of service, upgrading...`, 'warn');

    for (let r = 0; r < 2; r++) {
      const target = route();
      served++;
      log('gateway', `request ${served} → ${target.name} (${target.version})`, 'ok');
      await sleep(200);
    }

    copy.version = 'v2';
    copy.up = true;
    log('deploy', `${copy.name} is back, running v2`, 'ok');
  }

  log('result', `all copies on v2, ${served} requests served, 0 failed`, 'ok');
}
