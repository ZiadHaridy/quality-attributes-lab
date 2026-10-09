// Sends a ride request every 0.3 s and shows who answered. Press Ctrl+C to stop.
const API = process.env.API || 'http://localhost:8080';
let ok = 0;
let failed = 0;

setInterval(async () => {
  try {
    const res = await fetch(`${API}/rides`, { method: 'POST', signal: AbortSignal.timeout(2000) });
    const ride = await res.json();
    if (!res.ok) throw new Error(ride.error);
    ok++;
    const note = ride.note ? `   ← ${ride.note}` : '';
    console.log(`\x1b[32m✔\x1b[0m ${ride.trip} → ${ride.matchedBy} (knows ${ride.tripsKnown} trips)${note}`);
  } catch (error) {
    failed++;
    console.log(`\x1b[31m✘ ride failed: ${error.message}\x1b[0m`);
  }
}, 300);

process.on('SIGINT', () => {
  console.log(`\n${ok} rides ok, ${failed} failed`);
  process.exit(0);
});
