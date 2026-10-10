// Process pairs: a primary does the work and sends a copy of its state (a checkpoint)
// to a backup every few requests. If the primary dies, the backup takes over from the
// last checkpoint and redoes the requests that came after it.
import { log, title, isMain } from '../shared/utils.js';

export function takeOver(checkpoint, requestLog) {
  const missed = requestLog.slice(checkpoint.length);
  return { state: [...checkpoint, ...missed], missed };
}

if (isMain(import.meta.url)) {
  title('Process pairs: a checkpoint every 2 trips');

  const requestLog = []; // every request is written here first
  let checkpoint = [];   // what the backup knows

  for (const trip of ['trip-1', 'trip-2', 'trip-3']) {
    requestLog.push(trip);
    log('primary', `handles ${trip}`, 'ok');
    if (requestLog.length % 2 === 0) {
      checkpoint = [...requestLog];
      log('checkpoint', `backup now knows: ${checkpoint.join(', ')}`);
    }
  }

  log('primary', 'crashes!', 'fail');
  const backup = takeOver(checkpoint, requestLog);
  log('backup', `starts from the checkpoint and redoes: ${backup.missed.join(', ')}`, 'warn');
  log('result', `backup knows: ${backup.state.join(', ')} → nothing lost`, 'ok');
}
