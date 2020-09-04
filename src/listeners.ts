import { Paths } from './paths';
import { LooseObject } from './types';

export interface ListenerCallbackProps {
  subPath: string;
  fullPath: string;
  path: string;

  [key: string]: any;
}

export type ListenerCallback<T> = (
  value: T,
  props: ListenerCallbackProps
) => any;

export class Listeners {
  cache: LooseObject = {};
  paths = new Paths();
  next = 0;
  prefix: string;

  constructor(prefix = 'ref') {
    this.prefix = prefix;
  }

  nextRef() {
    this.next++;
    return `${this.prefix}-${this.next}`;
  }

  add<T>(path: string, listener: ListenerCallback<T>) {
    this.cache = {};
    const ref = this.nextRef();
    this.paths.add(path, ref, { listener });
    return ref;
  }

  remove(ref: string) {
    this.paths.remove(ref);
    this.cache = {};
  }

  _get(path: string) {
    return this.paths.lookup(path).map(res => {
      res._ = Object.entries(res._).map(([ref, res]) => [ref, res['listener']]);
      return res;
    });
  }

  get(path: string) {
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

  add<T>(path: string, listener: ListenerCallback<T>): string {
    this.ref = super.add(path, listener);
    return this.ref;
  }

  get(path: string) {
    const res = super.get(path);
    this.remove(this.ref);
    return res;
  }
}
