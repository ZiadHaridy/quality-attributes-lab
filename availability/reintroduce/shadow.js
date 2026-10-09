// Shadow: a repaired copy runs next to the active one. We compare answers,
// but riders only get the active answer until the shadow proves itself.
import { log, title, isMain } from '../shared/utils.js';

export class Shadow {
  constructor(active, shadow, needed = 5) {
    this.active = active;
    this.shadow = shadow;
    this.needed = needed;
    this.agreed = 0;
  }

  handle(request) {
    const answer = this.active(request);
    const agrees = this.shadow(request) === answer;
    this.agreed = agrees ? this.agreed + 1 : 0;
    return { answer, agrees, ready: this.agreed >= this.needed };
  }
}

const price = (km) => 15 + km * 6;

if (isMain(import.meta.url)) {
  const repairs = {
    'first repair': (km) => (km > 20 ? 15 + km * 5 : price(km)), // long trips still wrong
    'second repair': (km) => price(km),
  };

  for (const [name, repaired] of Object.entries(repairs)) {
    title(`Shadow: pricing copy after its ${name}`);
    const shadow = new Shadow(price, repaired, 5);
    let promoted = false;

    for (const km of [3, 25, 8, 12, 4, 30, 6]) {
      const result = shadow.handle(km);
      log('shadow', `${km} km → rider pays ${result.answer} EGP, shadow ${result.agrees ? 'agrees' : 'DISAGREES'}`, result.agrees ? 'ok' : 'fail');
      if (result.ready) {
        promoted = true;
        break;
      }
    }

    if (promoted) log('result', '5 answers in a row match → promote it to active', 'ok');
    else log('result', 'not trusted yet → keep it in shadow mode', 'warn');
  }
}
