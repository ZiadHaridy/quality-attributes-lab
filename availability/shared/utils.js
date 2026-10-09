import { pathToFileURL } from 'node:url';

const start = Date.now();
const COLORS = { info: 36, ok: 32, warn: 33, fail: 31 };

export function log(who, message, type = 'info') {
  const time = `${((Date.now() - start) / 1000).toFixed(1)}s`.padStart(6);
  console.log(`\x1b[90m${time}\x1b[0m  \x1b[${COLORS[type]}m${who.padEnd(11)}\x1b[0m ${message}`);
}

export function title(text) {
  console.log(`\n\x1b[1m${text}\x1b[0m\n`);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// true when the file is run directly (node file.js), false when it is imported
export const isMain = (url) => url === pathToFileURL(process.argv[1]).href;
