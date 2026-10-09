// Forward error recovery: use built-in redundancy to move forward to a correct state,
// instead of going back (rollback) or dropping the data.
import { log, title, isMain } from '../shared/utils.js';
import { vote } from '../detect/voting.js';

// every field is sent three times (a simple error-correcting code)
export const encode = (point) => ({ lat: [point.lat, point.lat, point.lat], lng: [point.lng, point.lng, point.lng] });

export function decode(packet) {
  return { lat: vote(packet.lat), lng: vote(packet.lng) };
}

if (isMain(import.meta.url)) {
  title('Forward error recovery: a GPS packet gets corrupted on the way');

  const sent = encode({ lat: 31.2001, lng: 29.9187 });
  const received = structuredClone(sent);
  received.lat[1] = 13.2001; // one copy damaged by radio noise

  log('driver app', `sent ${JSON.stringify(sent)}`);
  log('server', `received ${JSON.stringify(received)}`, 'warn');
  log('server', `corrected to ${JSON.stringify(decode(received))}`, 'ok');
  log('result', 'no rollback and no resend: the trip moves forward with the right position', 'ok');
}
