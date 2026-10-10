// Exception detection: notice when the normal flow breaks.
// Here a timeout: if the payment provider takes too long, we stop waiting and raise an error.
import { log, sleep, title, isMain } from '../shared/utils.js';

export async function withTimeout(promise, ms, what) {
  const tooLate = sleep(ms).then(() => 'TIMEOUT');
  const result = await Promise.race([promise, tooLate]);
  if (result === 'TIMEOUT') throw new Error(`${what} took more than ${ms} ms`);
  return result;
}

if (isMain(import.meta.url)) {
  title('Exception detection: a 1 second timeout on the payment provider');

  const fastProvider = () => sleep(200).then(() => 'charged');
  const slowProvider = () => sleep(1500).then(() => 'charged');

  async function pay(name, provider) {
    try {
      await withTimeout(provider(), 1000, name);
      log('payments', `${name} → charged`, 'ok');
    } catch (error) {
      log('payments', `timeout detected: ${error.message}`, 'fail');
    }
  }

  await pay('fast provider', fastProvider);
  await pay('slow provider', slowProvider);
}
