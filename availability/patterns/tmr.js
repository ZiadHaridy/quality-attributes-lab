// Triple modular redundancy (TMR): three identical copies do the same job,
// and a voter picks the answer that at least two of them agree on.
import { log, title, isMain } from '../shared/utils.js';

export function vote(a, b, c) {
  if (a === b || a === c) return a;
  if (b === c) return b;
  return null; // all three disagree
}

if (isMain(import.meta.url)) {
  title('TMR: three copies of the ETA service');

  const eta = (km) => Math.ceil(km * 2) + 2;
  const copyA = (km) => eta(km);
  const copyB = (km) => eta(km);
  const copyC = (km) => eta(km) + 13; // bad memory on this server

  const a = copyA(2);
  const b = copyB(2);
  const c = copyC(2);
  log('copy A', `ETA ${a} min`);
  log('copy B', `ETA ${b} min`);
  log('copy C', `ETA ${c} min`, 'fail');

  log('voter', `2 of 3 agree → the rider sees ETA ${vote(a, b, c)} min`, 'ok');
  log('result', 'copy C is outvoted and flagged for repair', 'warn');
}
