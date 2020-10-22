import { clean } from './paths';
import { ListenerCallbackWithType } from 'listeners';
import {
  Filter,
  FilterOn,
  LooseObject,
  Sorter,
  SorterOn,
  Stower,
} from './types';
import { Data } from 'data';

export class Pathifier {
  refs: string[] = [];

  cache: { [key: string]: unknown } = {};
  cacheNoMap: { [key: string]: unknown } = {};
  cacheArray: string[] = [];

  _to?: string;
  _filter?: Filter;
  _sort?: Sorter;
  _toArray?: Stower;
  _map?: ListenerCallbackWithType<any>;
  _then?: ListenerCallbackWithType<any>;
  _on: boolean = false;
  data: Data;
  from: string;
  cleanFrom: any;

  constructor(data: Data, from: string) {
    if (from.includes('$')) {
      throw new Error('Sorry, no named wildcard support in pathifier');
    }
    this.data = data;
    this.from = from;
    this.cleanFrom = clean(from);
  }

  sortedIndex(path: string) {
    const d = this.cacheNoMap;
    const paths = this.cacheArray;

    let low = 0;
    let high = paths.length;
    let sort = this._sort;
    // Default sort if none is specified
    if (!sort) {
      sort = (_, __, aPath, bPath) => aPath.localeCompare(bPath);
    }

    while (low < high) {
      let mid = (low + high) >>> 1;
      if (sort(d[path], d[paths[mid]], path, paths[mid]) > 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  setFilter(filter: Filter) {
    if (this._filter !== undefined) throw new Error('Sorry, only one filter');
    this._filter = filter;
  }

  setSort(sort: Sorter) {
    if (this._sort !== undefined) throw new Error('Sorry, only one sort');
    this._sort = sort;
  }

  filter(filter: Filter) {
    this.setFilter(filter);
    return this;
  }

  filterOn(path: string, filter: FilterOn) {
    this.setFilter(value => filter(this.data.get(path), value));
    this.refs.push(
      this.data.on(`!+* ${path}`, () => {
        this.update();
      })
    );
    return this;
  }

  map<T = any>(map: ListenerCallbackWithType<T>) {
    if (this._map) throw new Error('Sorry, only one map');
    this._map = map;
    return this;
  }

  sort(sort: Sorter) {
    this.setSort(sort);
    return this;
  }

  sortOn(path: string, sort: SorterOn) {
    this.setSort((a, b, aPath, bPath) =>
      sort(this.data.get(path), a, b, aPath, bPath)
    );
    this.refs.push(
      this.data.on(`!+* ${path}`, () => {
        this.update();
      })
    );
    return this;
  }

  to(path: string) {
    if (this._to) throw new Error('Sorry, only one to');
    this._to = path;
    if (!this._on) this.on();
    return this;
  }

  then<T = any>(then: ListenerCallbackWithType<T>) {
    this._then = then;
    if (!this._on) this.on();
    return this;
  }

  toArray(toArray: Stower) {
    if (this._toArray) throw new Error('Sorry, only one toArray');

    this._toArray = toArray;
    if (!this._on) this.on();
    return this;
  }

  on() {
    if (this._on) return;
    this._on = true;
    this.refs.push(
      this.data.on(`!+* ${this.from}`, (_, { path, fullPath }) => {
        if (path === fullPath) {
          this.update();
        } else {
          const subPath = fullPath.slice(this.cleanFrom.length + 1);
          const updated = this.set(subPath, this.data.get(fullPath));
          if (updated && this._then)
            this._then(this.cache, { path, fullPath, subPath });
        }
      }),
      this.data.on(`- ${this.from}`, (_, { path, fullPath }) => {
        const subPath = fullPath.slice(this.cleanFrom.length + 1);
        const updated = this.unset(subPath);
        if (updated && this._then) {
          this._then(this.cache, { path, fullPath, subPath });
        }
      })
    );
  }

  off() {
    for (let ref of this.refs) {
      this.data.off(ref);
    }
    this._on = false;
  }

  update() {
    if (!this._to && !this._toArray && !this._then) return;

    const fromData = this.data.get(this.cleanFrom);
    if (!fromData) return;

    const a = new Set(Object.keys(fromData || {}));
    const b = new Set(Object.keys(this.cache || {}));
    let updated = false;
    for (let aa of Array.from(a)) {
      if (this.set(aa, this.data.get(this.keys(this.cleanFrom, aa)))) {
        updated = true;
        b.delete(aa);
      }
    }
    for (let bb of Array.from(b)) {
      this.unset(bb);
    }
    if (updated && this._then) {
      this._then(this.cache, { path: '', fullPath: '', subPath: '' });
    }
  }

  keys(...args: string[]) {
    return args.filter(p => p).join('.');
  }

  set(key: string, value: any) {
    const parts = key.split('.');
    const k = parts[0];
    if (
      this._filter &&
      !this._filter(this.data.get(this.keys(this.cleanFrom, k)))
    ) {
      return false;
    }

    const exists = this.cache[k];
    const origValue = value;
    if (this._map) {
      const path = this.keys(this.cleanFrom, k);
      value = this._map(this.data.get(path), {
        path,
        fullPath: path,
        subPath: '',
      });
      key = k;
    }

    if (this._to) this.data.set(this.keys(this._to, key), value);
    this.setObject(this.cache, parts, value);
    this.setObject(this.cacheNoMap, parts, origValue);
    if (this._toArray) {
      if (exists) {
        const oldIndex = this.cacheArray.indexOf(k);
        this.cacheArray.splice(oldIndex, 1);
        this._toArray.remove(this.cache[k], oldIndex, 0, k);
        const index = this.sortedIndex(k);
        this._toArray.add(this.cache[k], index, 0, k);
        this.cacheArray.splice(index, 0, k);
      } else {
        const index = this.sortedIndex(k);
        this._toArray.add(this.cache[k], index, 0, k);
        this.cacheArray.splice(index, 0, k);
      }
    }
    return true;
  }

  setObject(object: LooseObject, parts: string[], value: any) {
    const parent = parts.slice(0, -1).reduce((parent, key) => {
      if (!parent[key]) parent[key] = {};
      return parent[key];
    }, object);
    parent[parts[parts.length - 1]] = value;
  }

  unsetObject(object: LooseObject, parts: string[]) {
    const parent = parts
      .slice(0, -1)
      .reduce((parent, key) => parent[key], object);
    delete parent[parts[parts.length - 1]];
  }

  unset(path: string): boolean {
    if (!this._to && !this._toArray && !this._then) return false;

    const parts = path.split('.');
    const k = parts[0];
    if (!this.cache[k]) return true;

    if (this._toArray) {
      const index = this.cacheArray.indexOf(k);
      this._toArray.remove(this.cache[k], index, 0, k);
      this.cacheArray.splice(index, 1);
    }
    this.unsetObject(this.cache, parts);
    this.unsetObject(this.cacheNoMap, parts);
    if (this._to) this.data.unset(this.keys(this._to, path));
    return true;
  }
}
