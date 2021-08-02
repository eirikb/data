import { Entry, ListenerCallbackOptions, OnMapper, SliceOn } from 'types';
import { Data } from 'data';

// import { Data } from 'data';

export class Entries<T> {
  entries: Entry<T>[] = [];
  private keys: string[] = [];
  private hasSet = new Set<string>();

  add(entry: Entry<T>): number;
  add(entry: Entry<T>, index: number): number;

  add(entry: Entry<T>, index?: number): number {
    if (index === undefined) {
      index = this.entries.length;
    }
    this.entries.splice(index, 0, entry);
    this.keys.splice(index, 0, entry.key);
    this.hasSet.add(entry.key);
    return index;
  }

  remove(entry: Entry<T>): number;
  remove(entry: Entry<T>, index: number): number;

  remove(entry: Entry<T>, index?: number): number {
    if (index === undefined) {
      index = this.indexOf(entry);
    }
    this.entries.splice(index, 1);
    this.keys.splice(index, 1);
    this.hasSet.delete(entry.key);
    return index;
  }

  indexOf(entry: Entry<T>) {
    return this.keys.indexOf(entry.key);
  }

  replace(entry: Entry<T>): [number, number];
  replace(entry: Entry<T>, index: number, oldIndex: number): [number, number];

  replace(entry: Entry<T>, index?: number, oldIndex?: number) {
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

  get(index: number): Entry<T> {
    return this.entries[index];
  }

  forEach(cb: (entry: Entry<T>, index: number) => void) {
    this.entries.slice().forEach(cb);
  }

  has(entry: Entry<T>): boolean {
    return this.hasSet.has(entry.key);
  }
}

export abstract class BaseTransformer<T> {
  entries = new Entries<T>();
  onOpts?: ListenerCallbackOptions;
  onValue?: any;
  readonly nextTransformers: BaseTransformer<any>[] = [];
  readonly data: Data;
  readonly refs: string[] = [];

  constructor(data: Data) {
    this.data = data;
  }

  on(value: any, opts: ListenerCallbackOptions): void {
    this.onValue = value;
    this.onOpts = opts;
    this.entries.forEach((entry, index) => this.update(index, index, entry));
  }

  init() {
    for (const transformer of this.nextTransformers) {
      transformer.init();
    }
  }

  abstract add(index: number, entry: Entry<T>): void;

  abstract remove(index: number, entry: Entry<T>): void;

  abstract update(oldIndex: number, index: number, entry: Entry<T>): void;

  protected nextAdd(index: number, entry: Entry<T>): void {
    for (const transformer of this.nextTransformers) {
      transformer.add(index, entry);
    }
  }

  protected nextRemove(index: number, entry: Entry<T>): void {
    for (const transformer of this.nextTransformers) {
      transformer.remove(index, entry);
    }
  }

  protected nextUpdate(oldIndex: number, index: number, entry: Entry<T>): void {
    for (const transformer of this.nextTransformers) {
      transformer.update(oldIndex, index, entry);
    }
  }

  get values() {
    return this.entries.entries.map(e => e.value);
  }

  private addTransformer<X>(next: BaseTransformer<X>): BaseTransformer<X> {
    this.nextTransformers.push(next);
    return next;
  }

  map<X>(map: OnMapper<X>): BaseTransformer<X> {
    return this.addTransformer(new MapTransformer<X>(this.data, map));
  }

  toArray<X>(array: any[]): BaseTransformer<X> {
    return this.addTransformer(new ToArrayTransformer<X>(this.data, array));
  }

  slice(start: number, end?: number): BaseTransformer<T> {
    return this.addTransformer(new SliceTransformer(this.data, start, end));
  }
}

export class PlainTransformer<T> extends BaseTransformer<T> {
  add(index: number, entry: Entry<T>): void {
    index = this.entries.add(entry, index);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    index = this.entries.remove(entry, index);
    this.nextRemove(index, entry);
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
    const [oldIndex, index] = this.entries.replace(entry, _index, _oldIndex);
    this.nextUpdate(oldIndex, index, entry);
  }

  on(_value: any, _opts: ListenerCallbackOptions): void {}
}

export class DataTransformer<T> extends PlainTransformer<T> {
  private path: string;

  constructor(data: Data, path: string) {
    super(data);
    this.path = path;
  }

  init() {
    this.refs.push(
      this.data.on(`!+ ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.add(0, { key, value, opts });
      })
    );

    this.refs.push(
      this.data.on(`* ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.update(0, 0, { key, value, opts });
      })
    );

    this.refs.push(
      this.data.on(`- ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.remove(0, { key, value, opts });
      })
    );

    super.init();
  }
}

export class ToArrayTransformer<T> extends BaseTransformer<T> {
  array: any[];

  constructor(data: Data, array: any[]) {
    super(data);
    this.array = array;
  }

  add(index: number, entry: Entry<T>): void {
    index = this.entries.add(entry, index);
    this.array.splice(index, 0, entry.value);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    index = this.entries.remove(entry, index);
    this.array.splice(index, 1);
    this.nextRemove(index, entry);
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
    const [oldIndex, index] = this.entries.replace(entry, _index, _oldIndex);
    this.array.splice(oldIndex, 1);
    this.array.splice(index, 0, entry.value);
    this.nextUpdate(oldIndex, index, entry);
  }

  on(_value: any, _opts: ListenerCallbackOptions): void {}
}

export class MapTransformer<T> extends BaseTransformer<T> {
  private readonly _map: OnMapper<T>;

  constructor(data: Data, map: OnMapper<T>) {
    super(data);
    this._map = map;
  }

  add(index: number, entry: Entry<T>): void {
    entry = Object.assign({}, entry);
    entry.value = this._map(entry.value, {
      onValue: this.onValue,
      onOpts: this.onOpts,
      ...entry.opts,
    });
    this.entries.add(entry, index);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    this.entries.remove(entry, index);
    this.nextRemove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    entry = Object.assign({}, entry);
    entry.value = this._map(entry.value, {
      onValue: this.onValue,
      onOpts: this.onOpts,
      ...entry.opts,
    });
    this.entries.replace(entry, oldIndex, index);
    this.nextUpdate(oldIndex, index, entry);
  }
}

export class OrTransformer<T> extends BaseTransformer<T> {
  private readonly _or: Entry<T>;
  private _orSet: boolean = false;

  constructor(data: Data, or: any) {
    super(data);

    this._or = {
      value: or,
    } as Entry<T>;
  }

  init() {
    if (this.entries.length === 0 && !this._orSet) {
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  add(index: number, entry: Entry<T>): void {
    this.entries.add(entry, index);
    if (this._orSet) {
      this.nextRemove(0, this._or);
      this._orSet = false;
    }
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    this.entries.remove(entry, index);
    this?.nextRemove(index, entry);
    if (this.entries.length === 0 && !this._orSet) {
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    this.entries.replace(entry, index, oldIndex);
    this.nextUpdate(oldIndex, index, entry);
  }
}

// export class SortTransformer extends BaseTransformer {
//   private readonly sort: OnSorter2;
//
//   constructor(sort: OnSorter2) {
//     super();
//     this.sort = sort;
//   }
//
//   private _sortedIndex(a: Entry) {
//     let low = 0;
//     let high = this.entries.length;
//
//     while (low < high) {
//       let mid = (low + high) >>> 1;
//       const b = this.entries.get(mid);
//       if (
//         this.sort(a.value, b.value, {
//           aOpts: a.opts,
//           bOpts: b.opts,
//           onValue: this.onValue,
//           onOpts: this.onOpts,
//         }) > 0
//       ) {
//         low = mid + 1;
//       } else {
//         high = mid;
//       }
//     }
//     return low;
//   }
//
//   add(index: number, entry: Entry): void {
//     index = this._sortedIndex(entry);
//     this.entries.add(entry, index);
//     this.next?.add(index, entry);
//   }
//
//   remove(index: number, entry: Entry): void {
//     index = this.entries.remove(entry);
//     this.next?.remove(index, entry);
//   }
//
//   update(_: number, __: number, entry: Entry): void {
//     const oldIndex2 = this.entries.indexOf(entry);
//     let index2 = this._sortedIndex(entry);
//     if (index2 > oldIndex2) index2--;
//     if (oldIndex2 !== index2) {
//       this.entries.replace(entry, index2, oldIndex2);
//       this.next?.update(oldIndex2, index2, entry);
//     } else {
//       this.next?.update(oldIndex2, index2, entry);
//     }
//   }
// }
//
export class SliceTransformer<T> extends BaseTransformer<T> {
  private start: number;
  private end?: number;
  private readonly sliceOn?: SliceOn<T> | undefined;

  constructor(data: Data, start: number, end?: number, sliceOn?: SliceOn<T>) {
    super(data);
    this.start = start;
    this.end = end;
    this.sliceOn = sliceOn;
  }

  add(index: number, entry: Entry<T>): void {
    this.entries.add(entry, index);

    if (index >= this.start && (!this.end || index < this.end)) {
      this.nextAdd(index - this.start, entry);
    } else if (index < this.start && this.entries.length > this.start) {
      this.nextAdd(0, this.entries.get(this.start));
    } else {
      return;
    }

    if (this.end && this.entries.length > this.end) {
      this.nextRemove(this.end - this.start, this.entries.get(this.end));
    }
  }

  remove(index: number, entry: Entry<T>): void {
    this.entries.remove(entry, index);

    if (index >= this.start && (!this.end || index < this.end)) {
      this.nextRemove(index - this.start, entry);
    } else if (index < this.start) {
      this.nextRemove(0, this.entries.get(this.start - 1));
    } else {
      return;
    }

    if (this.end && this.entries.length >= this.end) {
      this.nextAdd(this.end - this.start, this.entries.get(this.end - 1));
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

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    this.remove(oldIndex, entry);
    this.add(index, entry);
  }
}

// export class FilterTransformer extends BaseTransformer {
//   private readonly filter: OnFilter;
//   private readonly all: Entries = new Entries();
//
//   constructor(filter: OnFilter) {
//     super();
//     this.filter = filter;
//   }
//
//   private _findIndex(key: string): number {
//     let index = 0;
//     const entries = this.all;
//     if (entries) {
//       for (let i = 0; i < entries.length; i++) {
//         if (entries.get(i).key === key || index >= this.entries.length) {
//           return index;
//         }
//         if (entries.get(i).key === (this.entries.get(index) || {}).key) {
//           index++;
//         }
//       }
//     }
//     return -1;
//   }
//
//   add(index: number, entry: Entry): void {
//     this.all.add(entry, index);
//
//     if (
//       this.filter(entry.value, {
//         opts: entry.opts,
//         onValue: this.onValue,
//         onOpts: this.onOpts,
//       })
//     ) {
//       index = this._findIndex(entry.key);
//       this.entries.add(entry, index);
//       this.next?.add(index, entry);
//     }
//   }
//
//   remove(index: number, entry: Entry): void {
//     this.all.remove(entry, index);
//
//     index = this.entries.remove(entry);
//     if (index >= 0) {
//       this.next?.remove(index, entry);
//     }
//   }
//
//   on(value: any, opts: ListenerCallbackOptions) {
//     this.onValue = value;
//     this.onOpts = opts;
//     let index = 0;
//     this.all.forEach(entry => {
//       const test = this.filter(entry.value, {
//         opts: entry.opts,
//         onValue: this.onValue,
//         onOpts: this.onOpts,
//       });
//       const has = this.entries.has(entry);
//
//       if (test && !has) {
//         this.entries.add(entry, index);
//         this.next?.add(index, entry);
//       } else if (!test && has) {
//         this.entries.remove(entry);
//         this.next?.remove(index, entry);
//       }
//       if (test) index++;
//     });
//   }
//
//   update(_oldIndex: number, _index: number, entry: Entry): void {
//     this.all.replace(entry, _index, _oldIndex);
//
//     const test = this.filter(entry.value, {
//       opts: entry.opts,
//       onValue: this.onValue,
//       onOpts: this.onOpts,
//     });
//     const has = this.entries.has(entry);
//     if (test && has) {
//       const index = this._findIndex(entry.key);
//       const oldIndex = this.entries.indexOf(entry);
//       this.entries.replace(entry, index, oldIndex);
//       this.next?.update(oldIndex, index, entry);
//     } else if (test && !has) {
//       const index = this._findIndex(entry.key);
//       this.entries.add(entry, index);
//       this.next?.add(index, entry);
//     } else if (!test && has) {
//       const oldIndex = this.entries.indexOf(entry);
//       this.entries.remove(entry);
//       this.next?.remove(oldIndex, entry);
//     }
//   }
// }
//
// export class AggregateTransformer<T> extends BaseTransformer {
//   private readonly aggregateCb: AggregateCb<T>;
//   private readonly delayedCallback: boolean;
//   private timeout?: any;
//
//   constructor(aggregate: AggregateCb<T>, delayedCallback: boolean) {
//     super();
//     this.aggregateCb = aggregate;
//     this.delayedCallback = delayedCallback;
//   }
//
//   private callCallback() {
//     const { entries } = this.entries;
//     const values = entries.map(entry => entry.value);
//     this.aggregateCb(values, entries);
//   }
//
//   private callback() {
//     if (!this.delayedCallback) {
//       this.callCallback();
//     } else {
//       clearTimeout(this.timeout);
//       this.timeout = setTimeout(() => this.callCallback(), 0);
//     }
//   }
//
//   add(index: number, entry: Entry): void {
//     this.entries.add(entry, index);
//     this.callback();
//     this.next?.add(index, entry);
//   }
//
//   remove(index: number, entry: Entry): void {
//     this.entries.remove(entry, index);
//     this.callback();
//     this.next?.remove(index, entry);
//   }
//
//   update(oldIndex: number, index: number, entry: Entry): void {
//     this.entries.replace(entry, index, oldIndex);
//     this.callback();
//     this.next?.update(oldIndex, index, entry);
//   }
// }
