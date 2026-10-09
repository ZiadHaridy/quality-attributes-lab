// Exception detection: notice when the normal flow breaks (timeouts, wrong message types).
import { log, sleep, title, isMain } from '../shared/utils.js';

export class TimeoutError extends Error {}

export function withTimeout(promise, ms, what) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(`${what} took more than ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function checkRideRequest(message) {
  const errors = [];
  if (typeof message.riderId !== 'string') errors.push('riderId must be a string');
  if (typeof message.pickup?.lat !== 'number') errors.push('pickup.lat must be a number');
  if (typeof message.pickup?.lng !== 'number') errors.push('pickup.lng must be a number');
  return errors;
}

if (isMain(import.meta.url)) {
  title('Exception detection 1: timeout on the payment provider');

  const providers = {
    fast: () => sleep(200).then(() => 'charged'),
    slow: () => sleep(1500).then(() => 'charged'),
  };

  for (const [name, charge] of Object.entries(providers)) {
    try {
      await withTimeout(charge(), 1000, `${name} provider`);
      log('payments', `${name} provider → charged`, 'ok');
    } catch (error) {
      if (error instanceof TimeoutError) log('payments', `TimeoutError: ${error.message}`, 'fail');
    }
  }

  title('Exception detection 2: parameter typing on ride requests');

  const messages = [
    { riderId: 'r-1', pickup: { lat: 31.2, lng: 29.9 } },
    { riderId: 42, pickup: { lat: '31.2' } },
  ];

  for (const message of messages) {
    const errors = checkRideRequest(message);
    if (errors.length) log('gateway', `rejected: ${errors.join(', ')}`, 'fail');
    else log('gateway', 'request accepted', 'ok');
  }
}
