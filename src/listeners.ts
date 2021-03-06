import { Lookup, Paths } from './paths';
import { ListenerCallback } from './types';

export class Listeners {
  private paths = new Paths<ListenerCallback>();
  private next = 0;
  private readonly prefix: string;

  constructor(prefix = 'ref') {
    this.prefix = prefix;
  }

  private nextRef() {
    this.next++;
    return `${this.prefix}-${this.next}`;
  }

  add(path: string, listener: ListenerCallback) {
    const ref = this.nextRef();
    this.paths.add(path, ref, listener);
    return ref;
  }

  remove(ref: string) {
    this.paths.remove(ref);
  }

  get(path: string[]) {
    return this.paths.lookup(path);
  }
}

export enum ChangeType {
  Add,
  Update,
  Remove,
}

export class ChangeListeners {
  listeners = {
    [ChangeType.Add]: new Listeners('add'),
    [ChangeType.Update]: new Listeners('update'),
    [ChangeType.Remove]: new Listeners('remove'),
  };

  add(changeType: ChangeType, path: string, listener: ListenerCallback) {
    return this.listeners[changeType].add(path, listener);
  }

  get(
    changeType: ChangeType,
    path: string[]
  ): {
    isEol: boolean;
    lookups: Lookup<ListenerCallback>[];
  } {
    return this.listeners[changeType].get(path);
  }

  off(ref: string) {
    for (const listeners of Object.values(this.listeners)) {
      listeners.remove(ref);
    }
  }
}
