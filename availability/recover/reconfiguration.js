// Reconfiguration: after losing a part, give its work to the parts that are left.
import { log, title, isMain } from '../shared/utils.js';

export function reassign(plan, lost) {
  const remaining = [...new Set(Object.values(plan))].filter((dc) => dc !== lost);
  const load = (dc) => Object.values(plan).filter((d) => d === dc).length;
  const moved = [];

  for (const [zone, dc] of Object.entries(plan)) {
    if (dc !== lost) continue;
    const target = remaining.sort((a, b) => load(a) - load(b))[0];
    plan[zone] = target;
    moved.push(`${zone} → ${target}`);
  }
  return moved;
}

if (isMain(import.meta.url)) {
  title('Reconfiguration: Alexandria zones served by three data centers');

  const plan = {
    Smouha: 'dc-1', Miami: 'dc-2', 'Sidi Gaber': 'dc-3',
    Montaza: 'dc-1', Agami: 'dc-2', Raml: 'dc-3',
  };
  console.table(plan);

  log('dc-2', 'power failure, the whole data center is lost', 'fail');
  for (const move of reassign(plan, 'dc-2')) log('config', `moved ${move}`, 'warn');

  console.table(plan);
  log('result', 'every zone is served again, by fewer data centers', 'ok');
}
