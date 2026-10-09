// Condition monitoring: check your assumptions. Here: the fare table must match its checksum.
import { createHash } from 'node:crypto';
import { log, title, isMain } from '../shared/utils.js';

export const checksum = (data) => createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 12);

export function loadFareTable(file, current) {
  if (checksum(file.data) !== file.checksum) return { table: current, ok: false };
  return { table: file.data, ok: true };
}

if (isMain(import.meta.url)) {
  title('Condition monitoring: loading a new fare table');

  const v1 = { baseFare: 15, perKm: 6, perMinute: 1.5 };
  let fares = loadFareTable({ data: v1, checksum: checksum(v1) }, null).table;
  log('pricing', `fare table v1 loaded, checksum ok (perKm = ${fares.perKm})`, 'ok');

  const v2 = { baseFare: 15, perKm: 7, perMinute: 1.5 };
  const file = { data: v2, checksum: checksum(v2) };
  file.data = { ...v2, perKm: 700 }; // corrupted on the way
  log('network', 'the v2 file got corrupted during download', 'warn');

  const result = loadFareTable(file, fares);
  fares = result.table;
  if (!result.ok) log('pricing', `checksum mismatch → refuse v2, keep v1 (perKm = ${fares.perKm})`, 'fail');
}
