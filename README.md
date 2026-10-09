# Quality Attributes Lab

Small JavaScript examples for the Software Architecture course, based on *Software Architecture in Practice* (4th edition).

Every tactic is one short file that you can run and read in a few minutes. All examples use the same ride-sharing app we use in the lectures: riders, drivers, matching, maps and payments.

## What you need

- Node.js 18 or newer
- Nothing else. There are no packages to install.

## Getting started

```bash
git clone https://github.com/ZiadHaridy/quality-attributes-lab.git
cd quality-attributes-lab

node availability/detect/heartbeat.js   # run one tactic
npm run demos                           # run all availability tactics
npm start                               # start the ride app backend
```

To see hot, warm and cold spares with real Docker containers, go to [`availability/docker/`](availability/docker) (needs Docker Desktop).

## Quality attributes

| Chapter | Quality attribute | Folder |
|---|---|---|
| 4 | Availability | [`availability/`](availability) |

More quality attributes will be added as we cover them in the section.

## How each file is organized

- At the top: the tactic itself (a class or a function you can reuse).
- At the bottom: a short demo that only runs when you run the file directly with `node`.

Read the code first, guess what the output will be, then run it.
