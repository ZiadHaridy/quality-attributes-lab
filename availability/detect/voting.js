// Voting: several components compute the same result; the majority wins.
import { log, title, isMain } from '../shared/utils.js';

export function vote(results) {
  const counts = new Map();
  for (const r of results) counts.set(r, (counts.get(r) || 0) + 1);
  const [winner, votes] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return votes > results.length / 2 ? winner : null;
}

if (isMain(import.meta.url)) {
  title('Voting: three teams wrote the fare calculator (functional redundancy)');

  const trip = { km: 8, minutes: 20 };
  const calculators = {
    teamA: (t) => 15 + t.km * 6 + t.minutes * 1.5,
    teamB: (t) => [15, t.km * 6, t.minutes * 1.5].reduce((a, b) => a + b),
    teamC: (t) => 15 + t.km * 1000 * 6 + t.minutes * 1.5, // bug: meters instead of km
  };

  const results = Object.entries(calculators).map(([team, calculate]) => {
    const fare = calculate(trip);
    log(team, `fare = ${fare} EGP`);
    return { team, fare };
  });

  const winner = vote(results.map((r) => r.fare));
  const faulty = results.filter((r) => r.fare !== winner).map((r) => r.team);
  log('voter', `majority says ${winner} EGP`, 'ok');
  if (faulty.length) log('voter', `${faulty.join(', ')} disagrees → flag it as faulty`, 'fail');
}
