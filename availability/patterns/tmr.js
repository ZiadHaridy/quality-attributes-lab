// Triple modular redundancy (TMR): three identical copies do the same job, a voter takes the majority.
import { log, title, isMain } from '../shared/utils.js';
import { vote } from '../detect/voting.js';

const etaMinutes = (km) => Math.ceil(km * 2) + 2;

export function tmr(copies, input) {
  const answers = copies.map((copy) => copy(input));
  return { answers, result: vote(answers) };
}

if (isMain(import.meta.url)) {
  title('TMR: three copies of the ETA service');

  const copyA = (km) => etaMinutes(km);
  const copyB = (km) => etaMinutes(km);
  const copyC = (km) => etaMinutes(km) + 13; // bad memory on this server

  const { answers, result } = tmr([copyA, copyB, copyC], 2);
  ['A', 'B', 'C'].forEach((name, i) => log(`copy ${name}`, `ETA ${answers[i]} min`, answers[i] === result ? 'info' : 'fail'));
  log('voter', `majority → the rider sees ETA ${result} min`, 'ok');
  log('result', 'copy C is outvoted and flagged for repair', 'warn');
}
