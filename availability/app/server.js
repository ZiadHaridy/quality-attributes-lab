// A tiny ride app backend that uses several availability tactics together.
import http from 'node:http';
import { HeartbeatMonitor } from '../detect/heartbeat.js';
import { ping } from '../detect/ping-echo.js';
import { retry } from '../recover/retry.js';
import { CircuitBreaker } from '../patterns/circuit-breaker.js';
import { Matching, maps, payments, drivers, distance } from './services.js';

const PORT = process.env.PORT || 3000;

const primary = new Matching('matching-primary');
const spare = new Matching('matching-spare'); // hot spare
const heartbeats = new HeartbeatMonitor(5000);
const noNetwork = new Set();
const paymentBreaker = new CircuitBreaker(
  (amount, onRetry) => retry(() => payments.authorize(amount), { attempts: 3, delayMs: 100, onRetry }),
  { failureThreshold: 2, resetTimeoutMs: 15000 },
);

// every driver app sends a heartbeat every 2 seconds
const sendHeartbeats = () => drivers.filter((d) => !noNetwork.has(d.name)).forEach((d) => heartbeats.beat(d.name));
sendHeartbeats();
setInterval(sendHeartbeats, 2000);

let tripCount = 0;

async function requestRide({ pickup = { x: 4, y: 4 }, dropoff = { x: 12, y: 9 } } = {}) {
  const trip = { id: `trip-${++tripCount}`, pickup, dropoff };
  const online = drivers.filter((d) => heartbeats.status(d.name) === 'online');
  const notes = [];

  // hot spare: both copies process every trip, the primary answers if it can
  const answers = [primary, spare].map((copy) => {
    try {
      return { copy: copy.name, driver: copy.match(trip, online) };
    } catch (error) {
      return { copy: copy.name, error: error.message };
    }
  });
  const answer = answers.find((a) => a.driver);
  if (!answer) throw new Error(answers.map((a) => a.error).join(', '));
  if (answer.copy !== primary.name) notes.push('failover: primary matching is down, the hot spare answered');

  // graceful degradation: no maps → rough ETA
  let eta;
  try {
    eta = `${await maps.eta(answer.driver, pickup)} min`;
  } catch {
    eta = `~${Math.ceil(distance(answer.driver, pickup) * 2) + 2} min (rough)`;
    notes.push('maps is down: rough ETA, no live map');
  }

  // retry inside a circuit breaker: flaky payments get retried, dead payments fail fast
  const fare = Math.round(15 + distance(pickup, dropoff) * 6);
  let payment;
  try {
    payment = await paymentBreaker.fire(fare, (attempt, wait, error) => notes.push(`payment attempt ${attempt} failed (${error.message}), retried`));
  } catch (error) {
    payment = `pay later (${error.message})`;
    notes.push('payments failed: the ride is still booked, payment is collected later');
  }

  return { trip: trip.id, driver: answer.driver.name, matchedBy: answer.copy, eta, fare, payment, paymentCircuit: paymentBreaker.state, notes };
}

async function health() {
  const services = { 'matching-primary': primary, 'matching-spare': spare, maps, payments };
  const result = {};
  for (const [name, service] of Object.entries(services)) {
    result[name] = (await ping(service, 300)) ? 'up' : 'DOWN (no echo in 300 ms)';
  }
  return result;
}

function chaos(target, action) {
  const up = action === 'up';
  if (target === 'matching-primary') primary.up = up;
  else if (target === 'matching-spare') spare.up = up;
  else if (target === 'maps') maps.up = up;
  else if (target === 'payments') payments.mode = action;
  else if (target.startsWith('driver-')) {
    const driver = drivers.find((d) => d.name.toLowerCase() === target.slice(7).toLowerCase());
    if (!driver) throw new Error(`unknown driver ${target}`);
    if (up) noNetwork.delete(driver.name);
    else noNetwork.add(driver.name);
  } else if (target === 'all' && up) {
    primary.up = spare.up = maps.up = true;
    payments.mode = 'up';
    noNetwork.clear();
  } else throw new Error(`unknown target ${target}`);
  return { ok: true, [target]: action };
}

const HELP = {
  'GET /health': 'ping/echo every service',
  'GET /drivers': 'driver status from heartbeats',
  'POST /drivers/:name/heartbeat': 'send a heartbeat yourself',
  'POST /rides': 'request a ride (body is optional: {"pickup":{"x":4,"y":4}})',
  'GET /trips': 'trips known by each matching copy',
  'POST /chaos/:target/:action': 'targets: matching-primary, matching-spare, maps, payments, driver-omar, all | actions: down, up, flaky (payments)',
};

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
};

async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text ? JSON.parse(text) : {};
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  const route = `${req.method} /${parts[0] ?? ''}`;

  try {
    if (route === 'GET /') return send(res, 200, HELP);
    if (route === 'GET /health') return send(res, 200, await health());
    if (route === 'GET /drivers') return send(res, 200, drivers.map((d) => ({ name: d.name, status: heartbeats.status(d.name) })));
    if (route === 'POST /drivers' && parts[2] === 'heartbeat') {
      heartbeats.beat(parts[1]);
      return send(res, 200, { ok: true });
    }
    if (route === 'POST /rides') return send(res, 201, await requestRide(await readBody(req)));
    if (route === 'GET /trips') return send(res, 200, { [primary.name]: primary.trips, [spare.name]: spare.trips });
    if (route === 'POST /chaos') return send(res, 200, chaos(parts[1] ?? '', parts[2] ?? ''));
    send(res, 404, { error: 'not found', try: HELP });
  } catch (error) {
    send(res, 503, { error: error.message });
  }
});

server.listen(PORT, () => console.log(`Ride app running on http://localhost:${PORT}`));
