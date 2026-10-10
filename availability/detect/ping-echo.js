// Ping/echo: the monitor asks "are you alive?" and waits for an answer.
// No answer in time means the service has failed.
import { log, sleep, title, isMain } from '../shared/utils.js';

export async function ping(service, timeoutMs) {
  const echo = service.ping().then(() => true, () => false); // answered → alive
  const noAnswer = sleep(timeoutMs).then(() => false);       // too late → dead
  return Promise.race([echo, noAnswer]);                     // whichever comes first
}

if (isMain(import.meta.url)) {
  title('Ping/echo: the monitor checks the payments service');

  const payments = {
    stuck: false,
    async ping() {
      if (this.stuck) await new Promise(() => {}); // stuck: never answers
      return 'echo';
    },
  };

  async function check() {
    if (await ping(payments, 500)) log('monitor', 'ping → echo → payments is alive', 'ok');
    else log('monitor', 'ping → no echo in 500 ms → payments FAILED', 'fail');
  }

  await check();
  await check();
  payments.stuck = true;
  log('payments', 'gets stuck (deadlock)', 'warn');
  await check();
}
