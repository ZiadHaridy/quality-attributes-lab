# Redundant spares with real Docker containers

The same hot / warm / cold spare tactic as `recover/redundant-spare.js`, but with real containers instead of objects in one file.

```
                 ┌──────────────┐  every ride   ┌─────────────────────┐
  rider.js ────► │   gateway    │ ────────────► │ matching-a (active) │
                 │  :8080       │               └─────────────────────┘
                 │  monitor +   │  hot: every ride too
                 │  failover    │ ────────────► ┌─────────────────────┐
                 └──────┬───────┘  warm: state  │ matching-b (spare)  │
                        │          every 5 s    └─────────────────────┘
                        │          cold: stopped
                        ▼
                 Docker API: start the cold spare, launch new containers
```

- **matching** (`matching.js`): keeps its trips in memory, so if it dies, its data dies with it. It takes about 2 seconds to boot, like a real service.
- **gateway** (`gateway.js`): sends rides to the active container and pings it every second. After 2 missed pings it fails over to the spare. Then it **launches a brand-new container** through the Docker API to be the next spare, so the system is redundant again.

## What you need

- Docker Desktop, running
- Node.js 18+ (only for `rider.js`)

## Run it

```bash
cd availability/docker
docker compose up -d --build
```

Terminal 2: send a ride every 0.3 s.

```bash
node rider.js
```

Terminal 3: watch the gateway.

```bash
docker logs -f gateway
```

Terminal 4: crash the active container.

```bash
docker kill matching-a
```

Watch terminal 2 and 3. A new `matching-c` container is created by itself. Kill the new active one (`docker kill matching-b`) and it happens again with `matching-d`. See all containers with `docker ps -a`.

## Compare hot, warm and cold

Open `.env`, change `MODE=hot` to `warm` or `cold`, then restart everything:

```bash
docker compose down
docker compose up -d --build
```

Repeat the experiment and fill in this table:

| Mode | How the spare is kept ready | Failed rides | Trips lost |
|---|---|---|---|
| hot | gets every ride, in parallel | ? | ? |
| warm | gets a copy of the state every 5 s | ? | ? |
| cold | stopped, started only on failure | ? | ? |

Hint: look at "knows N trips" in `rider.js` before and after the crash.

## Clean up

```bash
docker compose down
```

This also removes the containers the gateway launched.

## Things to notice

- Docker gives you some tactics for free: the `healthcheck` in `docker-compose.yml` is a monitor (see `healthy` in `docker ps`).
- The gateway uses the Docker socket to create containers. That is how orchestrators like Kubernetes replace dead instances.
- The gateway itself is now a single point of failure. How would you fix that?
