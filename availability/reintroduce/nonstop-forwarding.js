// Nonstop forwarding: keep routing with the last known table while the control part restarts.
import { log, sleep, title, isMain } from '../shared/utils.js';

export class Gateway {
  constructor() {
    this.routes = {};
  }

  updateRoutes(routes) {
    this.routes = { ...routes };
  }

  forward(path) {
    const target = this.routes[path.split('/')[1]];
    if (!target) throw new Error(`no route for ${path}`);
    return target;
  }
}

if (isMain(import.meta.url)) {
  title('Nonstop forwarding: the service registry restarts');

  const gateway = new Gateway();
  const registry = { up: true, routes: { rides: '10.0.0.5', payments: '10.0.0.8' } };
  gateway.updateRoutes(registry.routes);

  const send = (path) => log('gateway', `${path} → ${gateway.forward(path)}`, 'ok');

  send('/rides/new');
  registry.up = false;
  log('registry', 'restarting (control part is down)', 'warn');

  for (const path of ['/rides/new', '/payments/charge', '/rides/42']) {
    await sleep(300);
    send(path); // the data part keeps forwarding with the cached table
  }

  registry.up = true;
  registry.routes.rides = '10.0.0.9';
  gateway.updateRoutes(registry.routes);
  log('registry', 'back, pushes a fresh table (rides moved to 10.0.0.9)', 'ok');
  send('/rides/new');
}
