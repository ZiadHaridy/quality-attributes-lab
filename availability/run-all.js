// Runs every availability tactic demo, one after the other.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const demos = [
  'detect/monitor.js', 'detect/ping-echo.js', 'detect/heartbeat.js', 'detect/timestamp.js',
  'detect/condition-monitoring.js', 'detect/sanity-checking.js', 'detect/voting.js',
  'detect/exception-detection.js', 'detect/self-test.js',
  'recover/redundant-spare.js', 'recover/rollback.js', 'recover/exception-handling.js',
  'recover/software-upgrade.js', 'recover/retry.js', 'recover/ignore-faulty-behavior.js',
  'recover/graceful-degradation.js', 'recover/reconfiguration.js',
  'reintroduce/shadow.js', 'reintroduce/state-resynchronization.js',
  'reintroduce/escalating-restart.js', 'reintroduce/nonstop-forwarding.js',
  'prevent/removal-from-service.js', 'prevent/transactions.js', 'prevent/predictive-model.js',
  'prevent/exception-prevention.js', 'prevent/increase-competence-set.js',
  'patterns/circuit-breaker.js', 'patterns/tmr.js', 'patterns/process-pairs.js', 'patterns/forward-error-recovery.js',
];

let failed = 0;
for (const demo of demos) {
  console.log(`\n\x1b[90m──────── ${demo} ────────\x1b[0m`);
  const { status } = spawnSync(process.execPath, [join(here, demo)], { stdio: 'inherit' });
  if (status !== 0) failed++;
}

console.log(failed ? `\n${failed} demo(s) failed` : `\nAll ${demos.length} demos ran.`);
process.exit(failed ? 1 : 0);
