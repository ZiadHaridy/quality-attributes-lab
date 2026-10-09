// Circuit breaker: after too many failures, stop calling the dead service for a while and fail fast.
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
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt < this.resetTimeoutMs) throw new Error('circuit is open, failing fast');
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.call(...args);
      this.state = 'CLOSED';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
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
    const before = breaker.state;
    const started = Date.now();
    try {
      await breaker.fire();
      const note = before === 'OPEN' ? ' (half-open test call worked)' : '';
      log(`call ${i}`, `charged in ${Date.now() - started} ms → ${breaker.state}${note}`, 'ok');
    } catch (error) {
      const note = before === 'OPEN' && !error.message.includes('open') ? ' (half-open test call failed)' : '';
      log(`call ${i}`, `${error.message} in ${Date.now() - started} ms → ${breaker.state}${note}`, 'fail');
    }
    await sleep(200);
  }
}
