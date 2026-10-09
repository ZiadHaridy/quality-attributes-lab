// Exception handling: catch the error, use what it tells you, and recover instead of crashing.
import { log, title, isMain } from '../shared/utils.js';

export class PaymentError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export async function chargeRider(provider, trip) {
  try {
    await provider.charge(trip.fare);
    return { ok: true, message: `${trip.id}: paid ${trip.fare} EGP` };
  } catch (error) {
    if (error.code === 'CARD_DECLINED') return { ok: false, message: `${trip.id}: card declined → ask the rider to pay cash` };
    if (error.code === 'PROVIDER_DOWN') return { ok: false, message: `${trip.id}: provider down → save as "pay later", charge tonight` };
    throw error;
  }
}

if (isMain(import.meta.url)) {
  title('Exception handling: charging riders at the end of the trip');

  const providers = [
    { charge: async () => {} },
    { charge: async () => { throw new PaymentError('CARD_DECLINED', 'card declined'); } },
    { charge: async () => { throw new PaymentError('PROVIDER_DOWN', 'connection refused'); } },
  ];

  for (const [i, provider] of providers.entries()) {
    const result = await chargeRider(provider, { id: `trip-${40 + i}`, fare: 35 });
    log('payments', result.message, result.ok ? 'ok' : 'warn');
  }
  log('result', 'every trip ended, no crash', 'ok');
}
