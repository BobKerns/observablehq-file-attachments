/**
 * A generator that returns an object whenever it has been signaled that the object has been updated.
 *
 * @module regenerator
 */

import { Regenerable } from "./types";

export async function* regenerator<T extends Regenerable>(obj: T): AsyncGenerator<T> {
    let p = Promise.resolve(obj);
    obj.updateCount = 0;
    while (true) {
      p = new Promise((acc, rej) => {
        obj.updated = acc;
        obj.errored = rej;
      });
      yield obj;
      await p;
      obj.updateCount++;
    }
  }