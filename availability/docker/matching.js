// One matching instance. It keeps its trips in memory, like a real stateful service.
import http from 'node:http';

const NAME = process.env.NAME || 'matching';
const STARTUP_MS = Number(process.env.STARTUP_MS ?? 2000); // real services need time to boot
const drivers = ['Omar', 'Sara', 'Mona'];
let trips = [];

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text ? JSON.parse(text) : {};
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') return send(res, 200, { name: NAME, trips: trips.length });

  if (req.url === '/state' && req.method === 'GET') return send(res, 200, trips);

  if (req.url === '/state' && req.method === 'PUT') {
    trips = await readBody(req);
    return send(res, 200, { name: NAME, trips: trips.length });
  }

  if (req.url === '/match' && req.method === 'POST') {
    const trip = await readBody(req);
    trips.push(trip.id);
    const driver = drivers[trips.length % drivers.length];
    return send(res, 200, { trip: trip.id, driver, matchedBy: NAME, tripsKnown: trips.length });
  }

  send(res, 404, { error: 'not found' });
});

process.on('SIGTERM', () => process.exit(0)); // stop quickly on docker stop

console.log(`${NAME} booting...`);
setTimeout(() => server.listen(4000, () => console.log(`${NAME} ready on port 4000`)), STARTUP_MS);
