# Availability (Chapter 4)

Availability means the system is there and ready when users need it. Faults will happen; a highly available system hides them or repairs them fast, so riders don't notice.

**Fault → error → failure.** A fault (a bug, a dead server) causes an error (a wrong internal state). If the error reaches the user, it becomes a failure. Availability tactics stop that chain.

```
availability = MTBF / (MTBF + MTTR)
```

## Tactics

Run any file with `node <path>`, or run them all with `npm run demos`.

### Detect faults

| Tactic | File | In the ride app |
|---|---|---|
| Monitor | [detect/monitor.js](detect/monitor.js) | A watchdog raises an alarm when matching stops resetting its timer |
| Ping/echo | [detect/ping-echo.js](detect/ping-echo.js) | The monitor pings payments and waits for an echo |
| Heartbeat | [detect/heartbeat.js](detect/heartbeat.js) | Driver apps say "I'm alive"; silent drivers go offline |
| Timestamp | [detect/timestamp.js](detect/timestamp.js) | Numbered trip events reveal a wrong order |
| Condition monitoring | [detect/condition-monitoring.js](detect/condition-monitoring.js) | A checksum stops a corrupted fare table from loading |
| Sanity checking | [detect/sanity-checking.js](detect/sanity-checking.js) | A GPS jump of 180 km in 10 seconds is rejected |
| Voting | [detect/voting.js](detect/voting.js) | Three fare calculators vote; the odd one out is flagged |
| Exception detection | [detect/exception-detection.js](detect/exception-detection.js) | Timeouts on payments, type checks on ride requests |
| Self-test | [detect/self-test.js](detect/self-test.js) | Matching tests itself before going live |

### Recover from faults: preparation and repair

| Tactic | File | In the ride app |
|---|---|---|
| Redundant spare | [recover/redundant-spare.js](recover/redundant-spare.js) | Hot, warm and cold spares of matching, and what each one loses |
| Rollback | [recover/rollback.js](recover/rollback.js) | A trip goes back to its last good checkpoint |
| Exception handling | [recover/exception-handling.js](recover/exception-handling.js) | A failed payment becomes "pay cash" or "pay later", not a crash |
| Software upgrade | [recover/software-upgrade.js](recover/software-upgrade.js) | Upgrade matching one copy at a time, zero downtime |
| Retry | [recover/retry.js](recover/retry.js) | Payments are retried with a growing delay, max 3 times |
| Ignore faulty behavior | [recover/ignore-faulty-behavior.js](recover/ignore-faulty-behavior.js) | A GPS device that sends garbage gets ignored |
| Graceful degradation | [recover/graceful-degradation.js](recover/graceful-degradation.js) | Maps down: rough ETA, but booking still works |
| Reconfiguration | [recover/reconfiguration.js](recover/reconfiguration.js) | A lost data center's zones move to the others |

### Recover from faults: reintroduction

| Tactic | File | In the ride app |
|---|---|---|
| Shadow | [reintroduce/shadow.js](reintroduce/shadow.js) | A repaired pricing copy must agree 5 times before going live |
| State resynchronization | [reintroduce/state-resynchronization.js](reintroduce/state-resynchronization.js) | A repaired matching copy copies the trips it missed |
| Escalating restart | [reintroduce/escalating-restart.js](reintroduce/escalating-restart.js) | Restart threads, then cache, then process, then server |
| Nonstop forwarding | [reintroduce/nonstop-forwarding.js](reintroduce/nonstop-forwarding.js) | The gateway keeps routing while the registry restarts |

### Prevent faults

| Tactic | File | In the ride app |
|---|---|---|
| Removal from service | [prevent/removal-from-service.js](prevent/removal-from-service.js) | Restart leaking copies before they crash |
| Transactions | [prevent/transactions.js](prevent/transactions.js) | Charge rider, pay driver, close trip: all or nothing |
| Predictive model | [prevent/predictive-model.js](prevent/predictive-model.js) | Start a second matching copy before the queue overflows |
| Exception prevention | [prevent/exception-prevention.js](prevent/exception-prevention.js) | A `Location` type that can never be invalid |
| Increase competence set | [prevent/increase-competence-set.js](prevent/increase-competence-set.js) | No driver nearby? Widen the search instead of failing |

### Patterns

| Pattern | File | In the ride app |
|---|---|---|
| Circuit breaker | [patterns/circuit-breaker.js](patterns/circuit-breaker.js) | Stop calling a dead payments service and fail fast |
| Triple modular redundancy | [patterns/tmr.js](patterns/tmr.js) | Three ETA copies, majority wins |
| Process pairs | [patterns/process-pairs.js](patterns/process-pairs.js) | A backup takes over from the last checkpoint |
| Forward error recovery | [patterns/forward-error-recovery.js](patterns/forward-error-recovery.js) | A damaged GPS packet is repaired, not dropped |

Redundant spare is also a pattern; see `recover/redundant-spare.js`.

### With real containers

| Tactic | Folder | What happens |
|---|---|---|
| Hot / warm / cold spare + failover | [docker/](docker) | Kill a matching container with `docker kill`; the gateway fails over and launches a new container to be the next spare |

## The ride app backend

A small backend in [`app/`](app) that puts several tactics together:

- **Hot spare**: two matching copies process every ride; if the primary is down, the spare answers.
- **Heartbeat**: drivers send heartbeats; silent drivers stop getting rides.
- **Ping/echo**: `GET /health` pings every service.
- **Graceful degradation**: maps down → rough ETA.
- **Retry + circuit breaker**: on the payments service.

Start it:

```bash
npm start
```

Then, in a second terminal, run the whole story:

```bash
npm run scenario
```

Or break things yourself:

```bash
curl -X POST http://localhost:3000/rides
curl -X POST http://localhost:3000/chaos/matching-primary/down
curl -X POST http://localhost:3000/chaos/maps/down
curl -X POST http://localhost:3000/chaos/payments/flaky
curl -X POST http://localhost:3000/chaos/payments/down
curl -X POST http://localhost:3000/chaos/driver-omar/down
curl http://localhost:3000/health
curl http://localhost:3000/drivers
curl -X POST http://localhost:3000/chaos/all/up
```

On Windows PowerShell, use `curl.exe` instead of `curl`. You can also use Postman.

| Endpoint | What it does |
|---|---|
| `GET /` | List of endpoints |
| `GET /health` | Ping/echo every service |
| `GET /drivers` | Online / offline drivers (from heartbeats) |
| `POST /drivers/:name/heartbeat` | Send a heartbeat yourself |
| `POST /rides` | Request a ride. Body is optional: `{"pickup":{"x":4,"y":4}}` |
| `GET /trips` | Trips each matching copy knows about |
| `POST /chaos/:target/:action` | Break or repair something. Targets: `matching-primary`, `matching-spare`, `maps`, `payments`, `driver-omar`, `all`. Actions: `down`, `up`, `flaky` (payments only) |

## Try it yourself

1. Take down **both** matching copies. What does the rider get? Which tactic would you add?
2. Add a timeout to the maps call in `app/server.js` using `withTimeout` from `detect/exception-detection.js`.
3. Change the hot spare in the app into a **warm** spare. Which trips does it lose when the primary crashes?
4. Write the availability scenario (source, stimulus, artifact, environment, response, response measure) for one of the chaos commands above.
