// Sanity checking: reject values that cannot possibly be true.
import { log, title, isMain } from '../shared/utils.js';

export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function checkGpsPoint(previous, next, maxSpeedKmh = 200) {
  const hours = (next.time - previous.time) / 3600;
  const speed = Math.round(distanceKm(previous, next) / hours);
  return { ok: speed <= maxSpeedKmh, speed };
}

if (isMain(import.meta.url)) {
  title('Sanity checking: GPS points from Sara\'s phone (one every 10 s)');

  const points = [
    { time: 0, lat: 31.2001, lng: 29.9187 },
    { time: 10, lat: 31.201, lng: 29.9195 },
    { time: 20, lat: 30.0444, lng: 31.2357 }, // suddenly in Cairo?
    { time: 30, lat: 31.2027, lng: 29.9211 },
  ];

  let last = points[0];
  log('gps', 'first point accepted', 'ok');

  for (const point of points.slice(1)) {
    const check = checkGpsPoint(last, point);
    if (check.ok) {
      log('gps', `accepted (${check.speed} km/h)`, 'ok');
      last = point;
    } else {
      log('gps', `rejected: ${check.speed} km/h is impossible for a car`, 'fail');
    }
  }
}
