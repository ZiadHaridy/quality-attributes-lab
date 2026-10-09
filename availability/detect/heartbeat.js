// Heartbeat: each component reports "I'm alive" by itself. Silence means failure.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class HeartbeatMonitor {
  constructor(maxSilenceMs) {
    this.maxSilenceMs = maxSilenceMs;
    this.lastSeen = new Map();
  }

  beat(name) {
    this.lastSeen.set(name, Date.now());
  }

  status(name) {
    const silence = Date.now() - (this.lastSeen.get(name) ?? 0);
    return silence <= this.maxSilenceMs ? 'online' : 'offline';
  }

  online() {
    return [...this.lastSeen.keys()].filter((name) => this.status(name) === 'online');
  }
}

if (isMain(import.meta.url)) {
  title('Heartbeat: driver apps say "I am alive" every 0.5 s');

  const monitor = new HeartbeatMonitor(1500);
  const drivers = ['Omar', 'Sara', 'Mona'];
  const noNetwork = new Set();

  const sendBeats = () => drivers.filter((d) => !noNetwork.has(d)).forEach((d) => monitor.beat(d));
  sendBeats();
  const timer = setInterval(sendBeats, 500);

  log('monitor', `online: ${monitor.online().join(', ')}`, 'ok');
  await sleep(1000);

  noNetwork.add('Omar');
  log('Omar', 'drives into a tunnel, no network', 'warn');

  for (let i = 0; i < 4; i++) {
    await sleep(600);
    const omar = monitor.status('Omar');
    log('monitor', `online: ${monitor.online().join(', ')}  |  Omar is ${omar}`, omar === 'online' ? 'info' : 'fail');
  }
  clearInterval(timer);
}
