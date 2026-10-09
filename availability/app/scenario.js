// Breaks the running ride app step by step and shows how it reacts.
// Start the server first (npm start), then run: npm run scenario
import { sleep } from '../shared/utils.js';

const API = process.env.API || 'http://localhost:3000';

async function call(method, path) {
  const res = await fetch(API + path, { method });
  return res.json();
}

async function step(text, ...requests) {
  console.log(`\n\x1b[1m${text}\x1b[0m`);
  for (const [method, path] of requests) {
    console.log(`\x1b[36m${method} ${path}\x1b[0m`);
    console.log(JSON.stringify(await call(method, path), null, 2));
  }
}

try {
  await call('GET', '/');
} catch {
  console.log(`Cannot reach ${API}. Start the server first: npm start`);
  process.exit(1);
}

await step('1. Everything works', ['POST', '/rides']);
await step('2. The primary matching copy crashes (hot spare)', ['POST', '/chaos/matching-primary/down'], ['POST', '/rides'], ['GET', '/trips']);
await step('3. The maps service goes down (graceful degradation)', ['POST', '/chaos/maps/down'], ['POST', '/rides']);
await step('4. Payments become flaky (retry)', ['POST', '/chaos/payments/flaky'], ['POST', '/rides']);
await step('5. Payments die (retry + circuit breaker)', ['POST', '/chaos/payments/down'], ['POST', '/rides'], ['POST', '/rides'], ['POST', '/rides']);
await step('6. Health check (ping/echo)', ['GET', '/health']);

await step('7. Omar loses his network (heartbeat)', ['POST', '/chaos/driver-omar/down']);
console.log('waiting 6 seconds for missed heartbeats...');
await sleep(6000);
await step('   6 seconds later: Omar is offline, so he gets no new rides', ['GET', '/drivers'], ['POST', '/rides']);

await step('8. Repair everything', ['POST', '/chaos/all/up'], ['GET', '/health']);
