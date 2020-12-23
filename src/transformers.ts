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

  add(entry: Entry): number;
  add(entry: Entry, index: number): number;

  add(entry: Entry, index?: number): number {
    if (index === undefined) {
      index = this.entries.length;
    }
    this.entries.splice(index, 0, entry);
    this.keys.splice(index, 0, entry.key);
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
}

export interface Transformer {
  entries: Entries;
  parent?: Transformer;
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

  private verify(index: number): boolean {
    if (index < this.start) return false;
    return !(this.end && index >= this.end);
  }

  add(index: number, entry: Entry): void {
    this.entries.add(entry, index);
    if (!this.verify(index)) {
      if (index > this.start) return;

      if (this.entries.length > this.start) {
        this.next?.add(0, this.entries.get(this.start));
        if (this.end && this.entries.length > this.end) {
          this.next?.remove(this.end - this.start, this.entries.get(this.end));
        }
      }
      return;
    }
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    this.entries.remove(entry, index);
    if (!this.verify(index)) return;
    this.next?.remove(index, entry);
  }

  on(value: any, opts: ListenerCallbackOptions) {
    if (this.sliceOn) {
      const [start, end] = this.sliceOn(value, opts);
      const endBefore = this.end || this.entries.length;
      const endAfter = end || this.entries.length;
      for (let i = endAfter; i < endBefore; i++) {
        this.next?.remove(i, this.entries.get(i));
      }
      for (let i = this.start; i < start; i++) {
        this.next?.remove(i, this.entries.get(i));
      }
      for (let i = endBefore; i < endAfter; i++) {
        this.next?.add(i, this.entries.get(i));
      }
      for (let i = start; i < this.start; i++) {
        this.next?.add(i, this.entries.get(i));
      }

      this.start = start;
      this.end = end;
    }
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.entries.replace(entry, index, oldIndex);
    const oldOk = this.verify(oldIndex);
    const newOk = this.verify(index);
    if (!oldOk && !newOk) return;

    if (oldOk && newOk) {
      this.next?.update(oldIndex, index, entry);
    } else if (!oldOk && newOk) {
      this.next?.add(index, entry);
    } else if (oldOk && !newOk) {
      this.next?.remove(index, entry);
    }
  }
}

export class FilterTransformer extends BaseTransformer {
  private readonly filter: OnFilter;
  private readonly all: Entries = new Entries();

  constructor(filter: OnFilter) {
    super();
    this.filter = filter;
  }

  private _findIndex(key: string): number {
    let index = 0;
    for (let i = 0; i < this.all.length; i++) {
      if (this.all.get(i).key === key || index >= this.entries.length) {
        return index;
      }
      if (this.all.get(i).key === (this.entries.get(index) || {}).key) {
        index++;
      }
    }
    return -1;
  }

  add(index: number, entry: Entry): void {
    this.all.add(entry, index);

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
    this.all.remove(entry, index);

    index = this.entries.remove(entry);
    if (index >= 0) {
      this.next?.remove(index, entry);
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    this.onValue = value;
    this.onOpts = opts;
    this.all.forEach((entry, index) => this.update(index, index, entry));
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.all.replace(entry, index, oldIndex);

    const test = this.filter(entry.value, {
      opts: entry.opts,
      onValue: this.onValue,
      onOpts: this.onOpts,
    });
    oldIndex = this.entries.indexOf(entry);
    const has = oldIndex >= 0;
    if (test && has) {
      index = this._findIndex(entry.key);
      this.entries.replace(entry, index, oldIndex);
      this.next?.update(oldIndex, index, entry);
    } else if (test && !has) {
      index = this._findIndex(entry.key);
      this.entries.add(entry, index);
      this.next?.add(index, entry);
    } else if (!test && has) {
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
