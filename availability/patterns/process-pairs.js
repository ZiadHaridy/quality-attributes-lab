// Process pairs: a backup receives checkpoints from the primary. If the primary dies,
// the backup rolls back to the last checkpoint and takes over.
import { log, title, isMain } from '../shared/utils.js';

export class ProcessPair {
  constructor(checkpointEvery = 2) {
    this.checkpointEvery = checkpointEvery;
    this.primaryState = [];
    this.backupState = [];
    this.primaryUp = true;
  }

  handle(trip) {
    if (!this.primaryUp) {
      this.backupState.push(trip);
      return 'backup';
    }
    this.primaryState.push(trip);
    if (this.primaryState.length % this.checkpointEvery === 0) this.backupState = [...this.primaryState];
    return 'primary';
  }

  failover() {
    this.primaryUp = false;
    const lastCheckpoint = this.backupState.length;
    const toRedo = this.primaryState.slice(lastCheckpoint);
    toRedo.forEach((trip) => this.backupState.push(trip));
    return toRedo;
  }
}

if (isMain(import.meta.url)) {
  title('Process pairs: trip processing, checkpoint every 2 trips');

  const pair = new ProcessPair(2);
  for (const trip of ['trip-1', 'trip-2', 'trip-3']) log('pair', `${trip} → ${pair.handle(trip)}`, 'ok');

  log('primary', 'crashes!', 'fail');
  const redone = pair.failover();
  log('backup', `rolls back to the last checkpoint and redoes: ${redone.join(', ')} (from the request log)`, 'warn');

  log('pair', `trip-4 → ${pair.handle('trip-4')}`, 'ok');
  log('result', `backup state: ${pair.backupState.join(', ')}`, 'ok');
}
