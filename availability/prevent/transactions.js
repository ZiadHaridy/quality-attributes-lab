// Transactions: several steps succeed together, or none of them happen.
import { log, title, isMain } from '../shared/utils.js';

export async function transaction(steps) {
  const done = [];
  try {
    for (const step of steps) {
      await step.do();
      done.push(step);
    }
  } catch (error) {
    for (const step of done.reverse()) await step.undo();
    throw error;
  }
}

function endTrip(db, payoutWorks) {
  return [
    { do: () => { db.riderWallet -= 35; log('step', 'charge rider 35 EGP'); }, undo: () => { db.riderWallet += 35; log('undo', 'refund rider', 'warn'); } },
    {
      do: () => {
        if (!payoutWorks) throw new Error('bank API refused the driver payout');
        db.driverWallet += 28;
        log('step', 'pay driver 28 EGP');
      },
      undo: () => { db.driverWallet -= 28; log('undo', 'take back driver payout', 'warn'); },
    },
    { do: () => { db.trip = 'closed'; log('step', 'close the trip'); }, undo: () => { db.trip = 'open'; } },
  ];
}

if (isMain(import.meta.url)) {
  const db = { riderWallet: 100, driverWallet: 0, trip: 'open' };

  for (const payoutWorks of [false, true]) {
    title(`Transactions: end trip-42 (driver payout ${payoutWorks ? 'works' : 'fails'})`);
    try {
      await transaction(endTrip(db, payoutWorks));
      log('result', `committed: ${JSON.stringify(db)}`, 'ok');
    } catch (error) {
      log('result', `${error.message} → rolled back: ${JSON.stringify(db)}`, 'fail');
    }
  }
}
