import {
  AggregateCb,
  Entry,
  ListenerCallbackOptions,
  OnFilter,
  OnMapper,
  OnSorter2,
  SliceOn,
} from 'types';

export class Entries {
  entries: Entry[] = [];
  private keys: string[] = [];
  private hasSet = new Set<string>();

  add(entry: Entry): number;
  add(entry: Entry, index: number): number;

  add(entry: Entry, index?: number): number {
    if (index === undefined) {
      index = this.entries.length;
    }
    this.entries.splice(index, 0, entry);
    this.keys.splice(index, 0, entry.key);
    this.hasSet.add(entry.key);
    return index;
  }

  remove(entry: Entry): number;
  remove(entry: Entry, index: number): number;

  remove(entry: Entry, index?: number): number {
    if (index === undefined) {
      index = this.indexOf(entry);
    }
    this.entries.splice(index, 1);
    this.keys.splice(index, 1);
    this.hasSet.delete(entry.key);
    return index;
  }

  indexOf(entry: Entry) {
    return this.keys.indexOf(entry.key);
  }

  replace(entry: Entry): [number, number];
  replace(entry: Entry, index: number, oldIndex: number): [number, number];

  replace(entry: Entry, index?: number, oldIndex?: number) {
    if (index === undefined) {
      index = this.indexOf(entry);
    }
    if (oldIndex === undefined) {
      oldIndex = this.indexOf(entry);
    }
    this.remove(entry, oldIndex);
    this.add(entry, index);
    return [oldIndex, index];
  }

  get length() {
    return this.entries.length;
  }

  get(index: number): Entry {
    return this.entries[index];
  }

  forEach(cb: (entry: Entry, index: number) => void) {
    this.entries.slice().forEach(cb);
  }

  has(entry: Entry): boolean {
    return this.hasSet.has(entry.key);
  }
}

export interface Transformer {
  parent?: Transformer;
  entries: Entries;
  next?: Transformer;
  onValue?: any;
  onOpts?: ListenerCallbackOptions;

  on(value: any, opts: ListenerCallbackOptions): void;

  add(index: number, entry: Entry): void;

  update(oldIndex: number, index: number, entry: Entry): void;

  remove(index: number, entry: Entry): void;

  init?(): void;
}

export abstract class BaseTransformer implements Transformer {
  parent?: Transformer;
  entries = new Entries();
  next?: Transformer;
  onOpts?: ListenerCallbackOptions;
  onValue?: any;

  on(value: any, opts: ListenerCallbackOptions): void {
    this.onValue = value;
    this.onOpts = opts;
    this.entries.forEach((entry, index) => this.update(index, index, entry));
  }

  abstract add(index: number, entry: Entry): void;

  abstract remove(index: number, entry: Entry): void;

  abstract update(oldIndex: number, index: number, entry: Entry): void;
}

export class ArrayTransformer implements Transformer {
  entries = new Entries();
  next?: Transformer;

  add(index: number, entry: Entry): void {
    index = this.entries.add(entry);
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    index = this.entries.remove(entry);
    this.next?.remove(index, entry);
  }

  update(_oldIndex: number, _index: number, entry: Entry): void {
    const [oldIndex, index] = this.entries.replace(entry);
    this.next?.update(oldIndex, index, entry);
  }

  on(_value: any, _opts: ListenerCallbackOptions): void {}
}

export class MapTransformer extends BaseTransformer {
  private readonly map: OnMapper;

  constructor(map: OnMapper) {
    super();
    this.map = map;
  }

  add(index: number, entry: Entry): void {
    entry = Object.assign({}, entry);
    entry.value = this.map(entry.value, {
      onValue: this.onValue,
      onOpts: this.onOpts,
      ...entry.opts,
    });
    this.entries.add(entry, index);
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    this.entries.remove(entry);
    this.next?.remove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    entry = Object.assign({}, entry);
    entry.value = this.map(entry.value, {
      onValue: this.onValue,
      onOpts: this.onOpts,
      ...entry.opts,
    });
    this.entries.replace(entry, oldIndex, index);
    this.next?.update(oldIndex, index, entry);
  }
}

export class OrTransformer extends BaseTransformer {
  private readonly _or: Entry;
  private _orSet: boolean = false;

  constructor(or: any) {
    super();
    this._or = {
      value: or,
    } as Entry;
  }

  init() {
    if (this.entries.length === 0 && !this._orSet) {
      this.next?.add(0, this._or);
      this._orSet = true;
    }
  }

  add(index: number, entry: Entry): void {
    this.entries.add(entry, index);
    if (this._orSet) {
      this.next?.remove(0, this._or);
      this._orSet = false;
    }
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    this.entries.remove(entry, index);
    this?.next?.remove(index, entry);
    if (this.entries.length === 0 && !this._orSet) {
      this.next?.add(0, this._or);
      this._orSet = true;
    }
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.entries.replace(entry, index, oldIndex);
    this.next?.update(oldIndex, index, entry);
  }
}

export class SortTransformer extends BaseTransformer {
  private readonly sort: OnSorter2;

  constructor(sort: OnSorter2) {
    super();
    this.sort = sort;
  }

  private _sortedIndex(a: Entry) {
    let low = 0;
    let high = this.entries.length;

    while (low < high) {
      let mid = (low + high) >>> 1;
      const b = this.entries.get(mid);
      if (
        this.sort(a.value, b.value, {
          aOpts: a.opts,
          bOpts: b.opts,
          onValue: this.onValue,
          onOpts: this.onOpts,
        }) > 0
      ) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  add(index: number, entry: Entry): void {
    index = this._sortedIndex(entry);
    this.entries.add(entry, index);
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    index = this.entries.remove(entry);
    this.next?.remove(index, entry);
  }

  update(_: number, __: number, entry: Entry): void {
    const oldIndex2 = this.entries.indexOf(entry);
    let index2 = this._sortedIndex(entry);
    if (index2 > oldIndex2) index2--;
    if (oldIndex2 !== index2) {
      this.entries.replace(entry, index2, oldIndex2);
      this.next?.update(oldIndex2, index2, entry);
    } else {
      this.next?.update(oldIndex2, index2, entry);
    }
  }
}

export class SliceTransformer extends BaseTransformer {
  private start: number;
  private end?: number;
  private readonly sliceOn?: SliceOn | undefined;

  constructor(start: number, end?: number, sliceOn?: SliceOn) {
    super();
    this.start = start;
    this.end = end;
    this.sliceOn = sliceOn;
  }

  add(index: number, entry: Entry): void {
    this.entries.add(entry, index);

    if (index >= this.start && (!this.end || index < this.end)) {
      this.next?.add(index - this.start, entry);
    } else if (index < this.start && this.entries.length > this.start) {
      this.next?.add(0, this.entries.get(this.start));
    } else {
      return;
    }

    if (this.end && this.entries.length > this.end) {
      this.next?.remove(this.end - this.start, this.entries.get(this.end));
    }
  }

  remove(index: number, entry: Entry): void {
    this.entries.remove(entry, index);

    if (index >= this.start && (!this.end || index < this.end)) {
      this.next?.remove(index - this.start, entry);
    } else if (index < this.start) {
      this.next?.remove(0, this.entries.get(this.start - 1));
    } else {
      return;
    }

    if (this.end && this.entries.length >= this.end) {
      this.next?.add(this.end - this.start, this.entries.get(this.end - 1));
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    if (this.sliceOn) {
      const entries = this.entries.entries.slice();
      for (let i = entries.length - 1; i >= 0; i--) {
        this.remove(i, entries[i]);
      }
      const [start, end] = this.sliceOn(value, opts);
      this.start = start;
      this.end = end;
      entries.forEach((entry, index) => this.add(index, entry));
    }
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.remove(oldIndex, entry);
    this.add(index, entry);
  }
}

export class FilterTransformer extends BaseTransformer {
  private readonly filter: OnFilter;

  constructor(filter: OnFilter) {
    super();
    this.filter = filter;
  }

  private _findIndex(key: string): number {
    let index = 0;
    const entries = this.parent?.entries;
    if (entries) {
      for (let i = 0; i < entries.length; i++) {
        if (entries.get(i).key === key || index >= this.entries.length) {
          return index;
        }
        if (entries.get(i).key === (this.entries.get(index) || {}).key) {
          index++;
        }
      }
    }
    return -1;
  }

  add(index: number, entry: Entry): void {
    if (
      this.filter(entry.value, {
        opts: entry.opts,
        onValue: this.onValue,
        onOpts: this.onOpts,
      })
    ) {
      index = this._findIndex(entry.key);
      this.entries.add(entry, index);
      this.next?.add(index, entry);
    }
  }

  remove(index: number, entry: Entry): void {
    index = this.entries.remove(entry);
    if (index >= 0) {
      this.next?.remove(index, entry);
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    this.onValue = value;
    this.onOpts = opts;
    let index = 0;
    this.parent?.entries.forEach(entry => {
      const test = this.filter(entry.value, {
        opts: entry.opts,
        onValue: this.onValue,
        onOpts: this.onOpts,
      });
      const has = this.entries.has(entry);

      if (test && !has) {
        this.entries.add(entry, index);
        this.next?.add(index, entry);
      } else if (!test && has) {
        this.entries.remove(entry);
        this.next?.remove(index, entry);
      }
      if (test) index++;
    });
  }

  update(_oldIndex: number, _index: number, entry: Entry): void {
    const test = this.filter(entry.value, {
      opts: entry.opts,
      onValue: this.onValue,
      onOpts: this.onOpts,
    });
    const has = this.entries.has(entry);
    if (test && has) {
      const index = this._findIndex(entry.key);
      const oldIndex = this.entries.indexOf(entry);
      this.entries.replace(entry, index, oldIndex);
      this.next?.update(oldIndex, index, entry);
    } else if (test && !has) {
      const index = this._findIndex(entry.key);
      this.entries.add(entry, index);
      this.next?.add(index, entry);
    } else if (!test && has) {
      const oldIndex = this.entries.indexOf(entry);
      this.entries.remove(entry);
      this.next?.remove(oldIndex, entry);
    }
  }
}

export class AggregateTransformer<T> extends BaseTransformer {
  private readonly aggregateCb: AggregateCb<T>;
  private readonly delayedCallback: boolean;
  private timeout?: any;

  constructor(aggregate: AggregateCb<T>, delayedCallback: boolean) {
    super();
    this.aggregateCb = aggregate;
    this.delayedCallback = delayedCallback;
  }

  private callCallback() {
    const { entries } = this.entries;
    const values = entries.map(entry => entry.value);
    this.aggregateCb(values, entries);
  }

  private callback() {
    if (!this.delayedCallback) {
      this.callCallback();
    } else {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.callCallback(), 0);
    }
  }

  add(index: number, entry: Entry): void {
    this.entries.add(entry, index);
    this.callback();
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    this.entries.remove(entry, index);
    this.callback();
    this.next?.remove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.entries.replace(entry, index, oldIndex);
    this.callback();
    this.next?.update(oldIndex, index, entry);
  }
}
