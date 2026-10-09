// The gateway: sends rides to the active matching container, watches it,
// fails over to the spare, and launches a fresh container to be the next spare.
import http from 'node:http';

const MODE = (process.env.MODE || 'hot').trim(); // hot | warm | cold
const IMAGE = process.env.IMAGE || 'ride-lab';
const NETWORK = process.env.NETWORK || 'ride-lab-net';

let active = 'matching-a';
let spare = 'matching-b';
let failingOver = false;
let failovers = 0;
let nextLetter = 'c';
let tripCount = 0;
const launched = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message) => console.log(`${new Date().toISOString().slice(11, 19)}  [${MODE}] ${message}`);

// talk to Docker itself through its socket (the same API the docker CLI uses)
function docker(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ socketPath: '/var/run/docker.sock', method, path, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let text = '';
      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => (res.statusCode < 400 ? resolve(text) : reject(new Error(`docker ${res.statusCode}: ${text.trim()}`))));
    });
    req.on('error', reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

async function call(name, path, { method = 'GET', body, timeoutMs = 1000 } = {}) {
  const res = await fetch(`http://${name}:4000${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch(() => {
    throw new Error(`${name} is not answering`);
  });
  if (!res.ok) throw new Error(`${name} answered ${res.status}`);
  return res.json();
}

const isAlive = (name) => call(name, '/health', { timeoutMs: 500 }).then(() => true, () => false);

async function waitUntilHealthy(name, maxMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (await isAlive(name)) return Date.now() - started;
    await sleep(200);
  }
  throw new Error(`${name} never became healthy`);
}

async function copyState(from, to) {
  const trips = await call(from, '/state');
  await call(to, '/state', { method: 'PUT', body: trips });
  return trips.length;
}

// create and start a brand-new matching container
async function launchContainer() {
  const name = `matching-${nextLetter}`;
  nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
  log(`launching a new container: ${name}`);
  await docker('POST', `/containers/create?name=${name}`, {
    Image: IMAGE,
    Cmd: ['node', 'matching.js'],
    Env: [`NAME=${name}`],
    HostConfig: { NetworkMode: NETWORK },
  });
  launched.push(name);
  await docker('POST', `/containers/${name}/start`);
  log(`${name} is up after ${await waitUntilHealthy(name)} ms`);
  return name;
}

async function failover() {
  failingOver = true;
  failovers++;
  log(`${active} is not answering → FAILOVER`);

  if (MODE === 'cold') {
    log(`powering on the cold spare ${spare}...`);
    await docker('POST', `/containers/${spare}/start`);
    log(`${spare} booted in ${await waitUntilHealthy(spare)} ms (rides failed the whole time)`);
  }

  active = spare;
  spare = null;
  log(`${active} is now ACTIVE`);

  // get redundancy back: a fresh container becomes the next spare
  const fresh = await launchContainer();
  if (MODE === 'cold') {
    await docker('POST', `/containers/${fresh}/stop`);
    log(`${fresh} stopped → it is the new cold spare`);
  } else {
    log(`${fresh} synced ${await copyState(active, fresh)} trips → it is the new ${MODE} spare`);
  }
  spare = fresh;
  failingOver = false;
}

async function handleRide() {
  const trip = { id: `trip-${++tripCount}` };
  const ride = (name) => call(name, '/match', { method: 'POST', body: trip, timeoutMs: 800 });

  if (MODE === 'hot' && spare) {
    // hot spare: both containers get every ride
    const [fromActive, fromSpare] = await Promise.allSettled([ride(active), ride(spare)]);
    if (fromActive.status === 'fulfilled') return fromActive.value;
    if (fromSpare.status === 'fulfilled') return { ...fromSpare.value, note: 'active failed, the hot spare answered' };
    throw fromActive.reason;
  }
  return ride(active);
}

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
};

http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/rides') return send(res, 201, await handleRide());
    if (req.url === '/status') return send(res, 200, { mode: MODE, active, spare, failovers });
    send(res, 200, { 'POST /rides': 'request a ride', 'GET /status': 'who is active, who is the spare' });
  } catch (error) {
    send(res, 503, { error: error.message });
  }
}).listen(8080);

// start up
log(`waiting for ${active} and ${spare}...`);
await waitUntilHealthy(active);
await waitUntilHealthy(spare);
if (MODE === 'cold') {
  await docker('POST', `/containers/${spare}/stop`);
  log(`${spare} powered off → cold spare`);
}
log(`ready on port 8080: ${active} is active, ${spare} is the ${MODE} spare`);

// monitor: ping the active container every second, fail over after 2 missed pings
let missed = 0;
setInterval(async () => {
  if (failingOver) return;
  if (await isAlive(active)) {
    missed = 0;
    return;
  }
  missed++;
  log(`${active} missed health check ${missed}/2`);
  if (missed >= 2) {
    missed = 0;
    failover().catch((error) => {
      log(`failover failed: ${error.message}`);
      failingOver = false;
    });
  }
}, 1000);

// on "docker compose down", remove the containers this gateway launched
process.on('SIGTERM', async () => {
  log('shutting down: removing the containers I launched');
  await Promise.allSettled(launched.map((name) => docker('DELETE', `/containers/${name}?force=true`)));
  process.exit(0);
});

// warm spare: copy the state every 5 seconds
if (MODE === 'warm') {
  setInterval(async () => {
    if (failingOver || !spare) return;
    try {
      log(`warm sync: ${spare} now knows ${await copyState(active, spare)} trips`);
    } catch {}
  }, 5000);
}
