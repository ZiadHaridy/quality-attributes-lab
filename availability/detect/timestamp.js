// Timestamp: number every event so a wrong order (or a missing event) can be detected.
import { log, title, isMain } from '../shared/utils.js';

export function checkOrder(events) {
  let last = 0;
  return events.map((event) => {
    let result = 'ok';
    if (event.seq <= last) result = 'out of order';
    else if (event.seq > last + 1) result = 'gap';
    last = Math.max(last, event.seq);
    return { ...event, result };
  });
}

if (isMain(import.meta.url)) {
  title('Timestamp: events of trip-42, in the order they arrived');

  const received = [
    { seq: 1, type: 'trip requested' },
    { seq: 2, type: 'driver assigned' },
    { seq: 4, type: 'trip ended' },
    { seq: 3, type: 'trip started' },
  ];

  for (const event of checkOrder(received)) {
    if (event.result === 'ok') log('trip-42', `#${event.seq} ${event.type}`, 'ok');
    if (event.result === 'gap') log('trip-42', `#${event.seq} ${event.type} → an earlier event is missing, wait for it`, 'warn');
    if (event.result === 'out of order') log('trip-42', `#${event.seq} ${event.type} → arrived late, out of order!`, 'fail');
  }
}
