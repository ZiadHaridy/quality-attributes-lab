// Retry: a transient fault often goes away if you try again. Always with a limit.
import { log, sleep, title, isMain } from '../shared/utils.js';

export async function retry(task, { attempts = 3, delayMs = 200, onRetry } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task(attempt);
    } catch (error) {
      if (attempt >= attempts) throw error;
      const wait = delayMs * 2 ** (attempt - 1);
      onRetry?.(attempt, wait, error);
      await sleep(wait);
    }
  }
}

if (isMain(import.meta.url)) {
  const onRetry = (attempt, wait, error) => log('payments', `attempt ${attempt} failed (${error.message}), retry in ${wait} ms`, 'warn');

  title('Retry 1: the provider fails twice, then works');
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls <= 2) throw new Error('timeout');
    return 'charged';
  };
  const result = await retry(flaky, { onRetry });
  log('payments', `attempt ${calls} → ${result}`, 'ok');

  title('Retry 2: the provider is really down');
  try {
    await retry(async () => { throw new Error('connection refused'); }, { onRetry });
  } catch (error) {
    log('payments', `gave up after 3 attempts: ${error.message}`, 'fail');
  }
}
