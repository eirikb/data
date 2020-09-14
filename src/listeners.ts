import { Lookup, Paths } from './paths';

export interface ListenerCallbackProps {
  subPath: string;
  fullPath: string;
  path: string;
}

export type ListenerCallback = (
  value: unknown,
  props: ListenerCallbackProps
) => any;

export class Listeners {
  private cache: { [key: string]: Lookup[] } = {};
  private paths = new Paths();
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

  get(path: string): Lookup[] {
    if (this.cache[path]) {
      return this.cache[path];
    }
    return (this.cache[path] = this._get(path));
  }
}

export class ImmediateListeners extends Listeners {
  ref = '';

  constructor() {
    super('immediate');
  }

  add(path: string, listener: ListenerCallback): string {
    this.ref = super.add(path, listener);
    return this.ref;
  }

  get(path: string) {
    const res = super.get(path);
    this.remove(this.ref);
    return res;
  }
}
