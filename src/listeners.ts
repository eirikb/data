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
  private cache: { [key: string]: Lookup<ListenerCallback>[] } = {};
  private paths = new Paths<ListenerCallback>();
  private next = 0;
  private prefix: string;

  constructor(prefix = 'ref') {
    this.prefix = prefix;
  }

  private nextRef() {
    this.next++;
    return `${this.prefix}-${this.next}`;
  }

  add(path: string, listener: ListenerCallback) {
    this.cache = {};
    const ref = this.nextRef();
    this.paths.add(path, ref, listener);
    return ref;
  }

  remove(ref: string) {
    this.paths.remove(ref);
    this.cache = {};
  }

  private _get(path: string) {
    return this.paths.lookup(path);
  }

  get(path: string): Lookup<ListenerCallback>[] {
    if (this.cache[path]) {
      return this.cache[path];
    }
    return (this.cache[path] = this._get(path));
  }
}
