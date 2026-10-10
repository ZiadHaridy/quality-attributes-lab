// Heartbeat: each driver app says "I'm alive" by itself, again and again.
// The monitor only remembers when it last heard from each one. Silence means failure.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class HeartbeatMonitor {
  constructor(maxSilenceMs) {
    this.maxSilenceMs = maxSilenceMs;
    this.lastSeen = {}; // name → time of the last heartbeat
  }

  beat(name) {
    this.lastSeen[name] = Date.now();
  }

  status(name) {
    const silence = Date.now() - (this.lastSeen[name] ?? 0);
    return silence <= this.maxSilenceMs ? 'online' : 'offline';
  }
}

if (isMain(import.meta.url)) {
  title('Heartbeat: driver apps say "I am alive" every 0.5 s');

  const monitor = new HeartbeatMonitor(1500); // 1.5 s of silence → offline
  let omarHasNetwork = true;

  const sendBeats = () => {
    monitor.beat('Sara');
    if (omarHasNetwork) monitor.beat('Omar');
  };
  sendBeats();
  const timer = setInterval(sendBeats, 500);

  const show = () => {
    const omar = monitor.status('Omar');
    log('monitor', `Sara is ${monitor.status('Sara')}, Omar is ${omar}`, omar === 'online' ? 'ok' : 'fail');
  };

  show();
  await sleep(1000);
  omarHasNetwork = false;
  log('Omar', 'drives into a tunnel, no network', 'warn');

  for (let i = 0; i < 4; i++) {
    await sleep(600);
    show();
  }
  clearInterval(timer);
}
