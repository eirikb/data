import { Lookup, Paths } from './paths';

export interface ListenerCallbackProps {
  subPath: string;
  fullPath: string;
  path: string;

  [key: string]: unknown;
}

export type ListenerCallback = (
  value: any,
  props: ListenerCallbackProps
) => any;

export type ListenerCallbackWithType<T> = (
  value: T,
  props: ListenerCallbackProps
) => any;

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
  Remove,
  Update,
}

export class ChangeListeners {
  listeners = {
    [ChangeType.Add]: new Listeners('add'),
    [ChangeType.Remove]: new Listeners('remove'),
    [ChangeType.Update]: new Listeners('update'),
  };

  add(changeType: ChangeType, path: string, listener: ListenerCallback) {
    this.listeners[changeType].add(path, listener);
  }

  get(changeType: ChangeType, path: string[]): Lookup<ListenerCallback>[] {
    return this.listeners[changeType].get(path);
  }
}
