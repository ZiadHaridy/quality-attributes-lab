// Ignore faulty behavior: stop listening to a source that keeps sending nonsense.
import { log, title, isMain } from '../shared/utils.js';

export class GpsFilter {
  constructor(maxBad = 3) {
    this.maxBad = maxBad;
    this.bad = new Map();
    this.ignored = new Set();
  }

  accept(message) {
    if (this.ignored.has(message.device)) return 'ignored';

    const valid = Math.abs(message.lat) <= 90 && Math.abs(message.lng) <= 180;
    if (valid) {
      this.bad.set(message.device, 0);
      return 'accepted';
    }

    const count = (this.bad.get(message.device) || 0) + 1;
    this.bad.set(message.device, count);
    if (count >= this.maxBad) {
      this.ignored.add(message.device);
      return 'now ignored';
    }
    return 'rejected';
  }
}

if (isMain(import.meta.url)) {
  title('Ignore faulty behavior: a broken GPS device floods garbage');

  const filter = new GpsFilter(3);
  const colors = { accepted: 'ok', rejected: 'warn', 'now ignored': 'fail', ignored: 'info' };

  for (let i = 0; i < 5; i++) {
    for (const message of [
      { device: 'gps-3', lat: Number((31.2 + i / 1000).toFixed(3)), lng: 29.9 },
      { device: 'gps-7', lat: 999, lng: -999 },
    ]) {
      const result = filter.accept(message);
      log(message.device, `(${message.lat}, ${message.lng}) → ${result}`, colors[result]);
    }
  }
}
