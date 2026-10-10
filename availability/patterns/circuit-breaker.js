// Circuit breaker: after too many failures, stop calling the dead service for a while and fail fast.
// CLOSED = calls go through. OPEN = calls are blocked. After the wait, one test call is let through.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class CircuitBreaker {
  constructor(call, { failureThreshold = 3, resetTimeoutMs = 1000 } = {}) {
    this.call = call;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
  }

  async fire(...args) {
    const waitIsOver = Date.now() - this.openedAt >= this.resetTimeoutMs;
    if (this.state === 'OPEN' && !waitIsOver) throw new Error('circuit is open, failing fast');

    try {
      const result = await this.call(...args);
      this.state = 'CLOSED'; // it works (again)
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN'; // too many failures: stop calling for a while
        this.openedAt = Date.now();
      }
      throw error;
    }
  }
}

if (isMain(import.meta.url)) {
  title('Circuit breaker on the payments service');

  const payments = { up: false };
  const charge = async () => {
    await sleep(payments.up ? 50 : 300); // a dead service makes you wait for the timeout
    if (!payments.up) throw new Error('payments timed out');
    return 'charged';
  };

  const breaker = new CircuitBreaker(charge, { failureThreshold: 3, resetTimeoutMs: 550 });

  for (let i = 1; i <= 10; i++) {
    if (i === 9) {
      payments.up = true;
      log('payments', 'repaired and back online', 'ok');
    }
    const wasOpen = breaker.state === 'OPEN';
    const started = Date.now();
    try {
      await breaker.fire();
      const note = wasOpen ? ' (test call worked)' : '';
      log(`call ${i}`, `charged in ${Date.now() - started} ms → ${breaker.state}${note}`, 'ok');
    } catch (error) {
      const note = wasOpen && !error.message.includes('failing fast') ? ' (test call failed)' : '';
      log(`call ${i}`, `${error.message} in ${Date.now() - started} ms → ${breaker.state}${note}`, 'fail');
    }
    await sleep(200);
  }
}
