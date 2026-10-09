// State resynchronization: bring a repaired copy's data back in line before it rejoins.
import { log, title, isMain } from '../shared/utils.js';
import { checksum } from '../detect/condition-monitoring.js';

export function resync(active, repaired) {
  const updates = active.filter((trip) => {
    const mine = repaired.find((t) => t.id === trip.id);
    return !mine || mine.version < trip.version;
  });
  const synced = active.map((trip) => updates.find((u) => u.id === trip.id) ?? repaired.find((t) => t.id === trip.id));
  return { synced, updates };
}

if (isMain(import.meta.url)) {
  title('State resynchronization: matching-2 comes back after 10 minutes down');

  const active = [
    { id: 'trip-4', status: 'ended', version: 3 },
    { id: 'trip-5', status: 'ended', version: 3 },
    { id: 'trip-6', status: 'started', version: 2 },
    { id: 'trip-7', status: 'requested', version: 1 },
  ];
  const repaired = [
    { id: 'trip-4', status: 'ended', version: 3 },
    { id: 'trip-5', status: 'started', version: 2 },
  ];

  log('matching-2', `knows ${repaired.length} trips, active copy knows ${active.length}`, 'warn');
  const { synced, updates } = resync(active, repaired);
  for (const trip of updates) log('resync', `copy ${trip.id} (${trip.status}, v${trip.version})`);

  if (checksum(synced) === checksum(active)) log('result', 'checksums match → matching-2 rejoins', 'ok');
  else log('result', 'still different → do not rejoin yet', 'fail');
}
