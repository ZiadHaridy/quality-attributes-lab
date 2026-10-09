// Ping/echo: the monitor sends a ping and expects an echo back in time.
import { log, sleep, title, isMain } from '../shared/utils.js';

export async function ping(service, timeoutMs) {
  const echo = service.ping().then(() => true).catch(() => false);
  const timeout = sleep(timeoutMs).then(() => false);
  return Promise.race([echo, timeout]);
}

if (isMain(import.meta.url)) {
  title('Ping/echo: the monitor checks the payments service');

  const payments = {
    stuck: false,
    async ping() {
      if (this.stuck) await new Promise(() => {}); // never answers
      await sleep(100);
    },
  };

  for (let i = 1; i <= 4; i++) {
    if (i === 3) {
      payments.stuck = true;
      log('payments', 'gets stuck (deadlock)', 'warn');
    }
    const alive = await ping(payments, 500);
    if (alive) log('monitor', `ping ${i} → echo, payments is alive`, 'ok');
    else log('monitor', `ping ${i} → no echo within 500 ms → payments FAILED`, 'fail');
  }
}
