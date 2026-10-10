// Transactions: several steps succeed together, or none of them happen.
// Ending a trip = charge the rider + pay the driver + close the trip.
import { log, title, isMain } from '../shared/utils.js';

export function endTrip(db, bankWorks) {
  const before = { ...db }; // remember everything before we start

  try {
    db.riderWallet -= 35;
    log('step', 'charge rider 35 EGP');

    if (!bankWorks) throw new Error('bank refused the driver payout');
    db.driverWallet += 28;
    log('step', 'pay driver 28 EGP');

    db.trip = 'closed';
    log('step', 'close the trip');
  } catch (error) {
    Object.assign(db, before); // ROLLBACK: put everything back
    throw error;
  }
}

if (isMain(import.meta.url)) {
  const db = { riderWallet: 100, driverWallet: 0, trip: 'open' };

  for (const bankWorks of [false, true]) {
    title(`Transactions: end trip-42 (bank ${bankWorks ? 'works' : 'fails'})`);
    try {
      endTrip(db, bankWorks);
      log('result', `COMMIT: ${JSON.stringify(db)}`, 'ok');
    } catch (error) {
      log('result', `${error.message} → ROLLBACK: ${JSON.stringify(db)}`, 'fail');
    }
  }
}
