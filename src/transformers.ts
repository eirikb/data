import {
  AggregateCb,
  Entry,
  ListenerCallbackOptions,
  Mapper,
  OnFilter,
  OnSorter2,
  SliceOn,
  Sorter2,
} from 'types';
import { Data } from 'data';

export class Entries<T> {
  entries: Entry<T>[] = [];
  private keys: string[] = [];
  private hasSet = new Set<string>();

  // add(entry: Entry<T>): number;
  // add(entry: Entry<T>, index: number): number;

  add(entry: Entry<T>, index: number): void {
    // if (index === undefined) {
    //   index = this.entries.length;
    // }
    this.entries.splice(index, 0, entry);
    this.keys.splice(index, 0, entry.key);
    this.hasSet.add(entry.key);
    // return index;
  }

  // remove(entry: Entry<T>): number;
  // remove(entry: Entry<T>, index: number): number;

  remove(entry: Entry<T>, index: number): void {
    // if (index === undefined) {
    //   index = this.indexOf(entry);
    // }
    this.entries.splice(index, 1);
    this.keys.splice(index, 1);
    this.hasSet.delete(entry.key);
    // return index;
  }

  indexOf(entry: Entry<T>) {
    return this.keys.indexOf(entry.key);
  }

  // replace(entry: Entry<T>): [number, number];
  // replace(entry: Entry<T>, index: number, oldIndex: number): [number, number];

  replace(entry: Entry<T>, index: number, oldIndex: number): void {
    // if (index === undefined) {
    //   index = this.indexOf(entry);
    // }
    // if (oldIndex === undefined) {
    //   oldIndex = this.indexOf(entry);
    // }
    this.remove(entry, oldIndex);
    this.add(entry, index);
    // return [oldIndex, index];
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

export abstract class BaseTransformer<T, O> {
  entries = new Entries<O>();
  protected onOpts?: ListenerCallbackOptions;
  protected onValue?: any;
  protected readonly nextTransformers: BaseTransformer<any, any>[] = [];
  protected readonly data: Data;
  protected readonly refs: string[] = [];
  protected parent: BaseTransformer<any, any> | undefined;
  protected running = false;
  protected onPath: string | undefined;

  constructor(data: Data) {
    this.data = data;
    this.start();
  }

  on(value: any, opts: ListenerCallbackOptions): void {
    this.onValue = value;
    this.onOpts = opts;
    this.entries.forEach((entry, index) =>
      this.update(index, index, (entry as unknown) as Entry<T>)
    );
  }

  start(recursive = true) {
    if (!this.running) {
      console.log(this.constructor.name, 'Starting');
      this.running = true;

      if (this.onPath) {
        console.log('has onPath', this.onPath);
        this.refs.push(
          this.data.on(`!+* ${this.onPath}`, (value, opts) =>
            this.on(value, opts)
          )
        );
      }

      if (recursive) {
        this.parent?.start();
        for (const transformer of this.nextTransformers) {
          transformer.start();
        }
      }
    } else {
      console.log(this.constructor.name, 'Already started');
    }
  }

  stop(recursive = true) {
    if (this.running) {
      console.log(this.constructor.name, 'Stopping');
      this.running = false;

      for (const ref of this.refs) {
        this.data.off(ref);
      }
      this.refs.splice(0, this.refs.length);

      if (recursive) {
        this.parent?.stop();
        for (const transformer of this.nextTransformers) {
          transformer.stop();
        }
      }
    } else {
      console.log(this.constructor.name, 'Already stopped');
    }
  }

  abstract add(index: number, entry: Entry<T>): void;

  abstract remove(index: number, entry: Entry<T>): void;

  abstract update(oldIndex: number, index: number, entry: Entry<T>): void;

  protected nextAdd(index: number, entry: Entry<O>): void {
    console.log(this.constructor.name, 'nextAdd', index, entry.value);
    this.entries.add(entry, index);
    for (const transformer of this.nextTransformers) {
      console.log(
        this.constructor.name,
        '->',
        transformer.constructor.name,
        'nextAdd',
        index,
        entry.value
      );
      transformer.add(index, entry);
    }
  }

  protected nextRemove(index: number, entry: Entry<O>): void {
    console.log(this.constructor.name, 'nextRemove', index, entry.value);
    this.entries.remove(entry, index);
    for (const transformer of this.nextTransformers) {
      transformer.remove(index, entry);
    }
  }

  protected nextUpdate(oldIndex: number, index: number, entry: Entry<O>): void {
    console.log(
      this.constructor.name,
      'nextUpdate',
      oldIndex,
      index,
      entry.value
    );
    this.entries.replace(entry, index, oldIndex);
    for (const transformer of this.nextTransformers) {
      transformer.update(oldIndex, index, entry);
    }
  }

  // get values() {
  //   return this.entries.entries.map(e => e.value);
  // }

  addTransformer<X, Y>(next: BaseTransformer<X, Y>): BaseTransformer<X, Y> {
    console.log(
      this.constructor.name,
      'Add transformer',
      next.constructor.name
    );
    this.nextTransformers.push(next);
    next.parent = this;
    this.entries.forEach((e, i) => next.add(i, e as any));
    return next;
  }

  private addOnTransformer<X, Y>(
    path: string,
    next: BaseTransformer<X, Y>
  ): BaseTransformer<X, Y> {
    next.onPath = path;
    const res = this.addTransformer(next);
    next.stop(false);
    next.start(false);
    return res;
  }

  map<X>(map: Mapper<T, X>): BaseTransformer<T, X> {
    return this.addTransformer(new MapTransformer<T, X>(this.data, map));
  }

  toArray(array: any[]): BaseTransformer<T, T> {
    return this.addTransformer(new ToArrayTransformer<T>(this.data, array));
  }

  slice(start: number, end?: number): BaseTransformer<T, T> {
    return this.addTransformer(new SliceTransformer(this.data, start, end));
  }

  sort(sort: Sorter2<T>): BaseTransformer<T, T> {
    return this.addTransformer(new SortTransformer<T>(this.data, sort));
  }

  filter(filter: OnFilter<T>): BaseTransformer<T, T> {
    return this.addTransformer(new FilterTransformer<T>(this.data, filter));
  }

  aggregate(
    aggregate: AggregateCb<T>,
    delayedCallback = false
  ): BaseTransformer<T, T> {
    return this.addTransformer(
      new AggregateTransformer<T>(this.data, aggregate, delayedCallback)
    );
  }

  or(or: any): BaseTransformer<T, T> {
    return this.addTransformer(new OrTransformer<T>(this.data, or));
  }

  mapOn<X>(path: string, map: Mapper<T, X>): BaseTransformer<T, X> {
    return this.addOnTransformer(
      path,
      new MapTransformer<T, X>(this.data, map)
    );
  }

  sortOn(path: string, sort: OnSorter2<T>): BaseTransformer<T, T> {
    return this.addOnTransformer(path, new SortTransformer<T>(this.data, sort));
  }

  sliceOn(path: string, sliceOn: SliceOn<T>): BaseTransformer<T, T> {
    return this.addOnTransformer(
      path,
      new SliceTransformer(this.data, 0, 0, sliceOn)
    );
  }

  filterOn(path: string, filter: OnFilter<T>): BaseTransformer<T, T> {
    return this.addOnTransformer(
      path,
      new FilterTransformer<T>(this.data, filter)
    );
  }
}

export class DataTransformer<T> extends BaseTransformer<T, T> {
  private readonly path: string;

  constructor(data: Data, path: string) {
    super(data);
    this.path = path;
    this.start();
  }

  start() {
    if (!this.path) return;

    if (this.running) return;
    super.start();

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
  }

  stop() {
    super.stop();
  }

  add(_: number, entry: Entry<T>): void {
    // index = this.entries.add(entry);
    this.nextAdd(this.entries.length, entry);
  }

  remove(_: number, entry: Entry<T>): void {
    // index = this.entries.remove(entry);
    this.nextRemove(this.entries.indexOf(entry), entry);
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
    // const [oldIndex, index] = this.entries.replace(entry);
    const index = this.entries.indexOf(entry);
    this.nextUpdate(index, index, entry);
  }
}

export class ToArrayTransformer<T> extends BaseTransformer<T, T> {
  array: any[];

  constructor(data: Data, array: any[]) {
    super(data);
    this.array = array;
  }

  add(index: number, entry: Entry<T>): void {
    // index = this.entries.add(entry, index);
    this.array.splice(index, 0, entry.value);
    console.log('ToArray add', index, entry.value, ':::', this.array);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    // index = this.entries.remove(entry, index);
    this.array.splice(index, 1);
    console.log('ToArray remove', index, entry.value, ':::', this.array);
    this.nextRemove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    // const [oldIndex, index] = this.entries.replace(entry, _index, _oldIndex);
    this.array.splice(oldIndex, 1);
    this.array.splice(index, 0, entry.value);
    console.log('ToArray update', index, entry.value, ':::', this.array);
    this.nextUpdate(oldIndex, index, entry);
  }

  on(_value: any, _opts: ListenerCallbackOptions): void {}
}

export class MapTransformer<T, O> extends BaseTransformer<T, O> {
  private readonly _map: Mapper<T, O>;

  constructor(data: Data, map: Mapper<T, O>) {
    super(data);
    this._map = map;
  }

  protected toEntry(entry: Entry<T>): Entry<O> {
    return {
      key: entry.key,
      opts: entry.opts,
      value: this._map(entry.value, {
        onValue: this.onValue,
        onOpts: this.onOpts,
        ...entry.opts,
      }),
    };
  }

  add(index: number, entry: Entry<T>): void {
    const e = this.toEntry(entry);
    // this.entries.add(e, index);
    this.nextAdd(index, e);
  }

  remove(index: number, _: Entry<T>): void {
    const e = this.entries.get(index);
    // this.entries.remove(e, index);
    this.nextRemove(index, e);
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    const e = this.toEntry(entry);
    // this.entries.replace(e, oldIndex, index);
    this.nextUpdate(oldIndex, index, e);
  }
}

export class OrTransformer<T> extends BaseTransformer<T, T> {
  private readonly _or: Entry<T>;
  private _orSet: boolean = false;

  constructor(data: Data, or: any) {
    super(data);

    this._or = {
      value: or,
    } as Entry<T>;

    if (this.entries.length === 0 && !this._orSet) {
      // this.entries.add(this._or, 0);
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  add(index: number, entry: Entry<T>): void {
    // this.entries.add(entry, index);
    if (this._orSet) {
      // this.entries.remove(this._or, 0);
      this.nextRemove(0, this._or);
      this._orSet = false;
    }
    // this.entries.add(entry, index);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    // this.entries.remove(entry, index);
    this.nextRemove(index, entry);
    // this.entries.remove(entry, index);
    if (this.entries.length === 0 && !this._orSet) {
      // this.entries.add(this._or, 0);
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    // this.entries.replace(entry, index, oldIndex);
    this.nextUpdate(oldIndex, index, entry);
  }
}

export class SortTransformer<T> extends BaseTransformer<T, T> {
  private readonly _sort: OnSorter2<T>;

  constructor(data: Data, sort: OnSorter2<T>) {
    super(data);
    this._sort = sort;
  }

  private _sortedIndex(a: Entry<T>) {
    let low = 0;
    let high = this.entries.length;

    while (low < high) {
      let mid = (low + high) >>> 1;
      const b = this.entries.get(mid);
      if (
        this._sort(a.value, b.value, {
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

  add(index: number, entry: Entry<T>): void {
    index = this._sortedIndex(entry);
    // this.entries.add(entry, index);
    this.nextAdd(index, entry);
  }

  remove(_: number, entry: Entry<T>): void {
    // index = this.entries.remove(entry);
    this.nextRemove(this.entries.indexOf(entry), entry);
  }

  update(_: number, __: number, entry: Entry<T>): void {
    const oldIndex = this.entries.indexOf(entry);
    let index = this._sortedIndex(entry);
    if (index > oldIndex) index--;
    console.log('oppus', entry.value, ':', oldIndex, '->', index);
    this.nextUpdate(oldIndex, index, entry);
    console.log(this.entries.entries.map(e => e.value));
    // if (oldIndex !== index) {
    //   // this.entries.replace(entry, index2, oldIndex2);
    //   this.nextUpdate(oldIndex2, index2, entry);
    // } else {
    //   this.nextUpdate(oldIndex2, index2, entry);
    // }
  }
}

export class SliceTransformer<T> extends BaseTransformer<T, T> {
  private startIdx: number;
  private endIdx?: number;
  private readonly _sliceOn?: SliceOn<T> | undefined;

  constructor(
    data: Data,
    startIdx: number,
    endIdx?: number,
    sliceOn?: SliceOn<T>
  ) {
    super(data);
    this.startIdx = startIdx;
    this.endIdx = endIdx;
    this._sliceOn = sliceOn;
  }

  add(index: number, entry: Entry<T>): void {
    if (this.parent !== undefined) {
      if (index >= this.startIdx && (!this.endIdx || index < this.endIdx)) {
        this.nextAdd(index - this.startIdx, entry);
      } else if (
        index < this.startIdx &&
        this.parent.entries.length > this.startIdx
      ) {
        this.nextAdd(0, this.parent.entries.get(this.startIdx));
      } else {
        return;
      }

      if (this.endIdx && this.parent.entries.length > this.endIdx) {
        this.nextRemove(
          this.endIdx - this.startIdx,
          this.parent.entries.get(this.endIdx)
        );
      }
    }
  }

  remove(index: number, entry: Entry<T>): void {
    // this.entries.remove(entry, index);

    if (this.parent !== undefined) {
      if (index >= this.startIdx && (!this.endIdx || index < this.endIdx)) {
        this.nextRemove(index - this.startIdx, entry);
      } else if (index < this.startIdx) {
        const entry = this.parent.entries.get(this.startIdx - 1);
        if (entry) {
          this.nextRemove(0, entry);
        } else {
          // TODO: Is it bad that it can be undefined?
        }
      } else {
        return;
      }

      if (this.endIdx && this.parent.entries.length >= this.endIdx) {
        this.nextAdd(
          this.endIdx - this.startIdx,
          this.parent.entries.get(this.endIdx - 1)
        );
      }
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    if (this._sliceOn && this.parent !== undefined) {
      console.log(
        'GO',
        this.entries.entries.map(e => e.value)
      );
      for (let i = this.entries.length - 1; i >= 0; i--) {
        this.nextRemove(i, this.entries.get(i));
      }
      console.log(this.entries.entries);
      const [start, end] = this._sliceOn(value, opts);
      console.log(start, end);
      this.startIdx = start;
      this.endIdx = end;
      console.log(
        ' > SLICE PARENT ENTRIES',
        this.parent.entries.entries.map(e => e.value)
      );
      this.parent.entries.forEach((entry, index) => this.add(index, entry));
    }
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    this.remove(oldIndex, entry);
    this.add(index, entry);
  }
}

export class FilterTransformer<T> extends BaseTransformer<T, T> {
  private readonly _filter: OnFilter<T>;

  // private readonly all: Entries<T> = new Entries<T>();

  constructor(data: Data, filter: OnFilter<T>) {
    super(data);
    this._filter = filter;
  }

  private _findIndex(key: string): number {
    let index = 0;
    // const entries = this.;
    if (this.parent !== undefined) {
      for (let i = 0; i < this.parent.entries.length; i++) {
        if (
          this.parent.entries.get(i).key === key ||
          index >= this.entries.length
        ) {
          return index;
        }
        if (
          this.parent.entries.get(i).key === (this.entries.get(index) || {}).key
        ) {
          index++;
        }
      }
    }
    return -1;
  }

  add(index: number, entry: Entry<T>): void {
    // this.all.add(entry, index);

    if (
      this._filter(entry.value, {
        opts: entry.opts,
        onValue: this.onValue,
        onOpts: this.onOpts,
      })
    ) {
      index = this._findIndex(entry.key);
      // this.entries.add(entry, index);
      this.nextAdd(index, entry);
    }
  }

  remove(index: number, entry: Entry<T>): void {
    // this.all.remove(entry, index);

    index = this.entries.indexOf(entry);
    // index = this.entries.remove(entry);
    if (index >= 0) {
      this.nextRemove(index, entry);
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    this.onValue = value;
    this.onOpts = opts;
    let index = 0;
    if (this.parent !== undefined) {
      this.parent.entries.forEach(entry => {
        const test = this._filter(entry.value, {
          opts: entry.opts,
          onValue: this.onValue,
          onOpts: this.onOpts,
        });
        const has = this.entries.has(entry);

        if (test && !has) {
          // this.entries.add(entry, index);
          this.nextAdd(index, entry);
        } else if (!test && has) {
          // this.entries.remove(entry);
          this.nextRemove(this.entries.indexOf(entry), entry);
        }
        if (test) index++;
      });
    }
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
    // this.all.replace(entry, _index, _oldIndex);

    const test = this._filter(entry.value, {
      opts: entry.opts,
      onValue: this.onValue,
      onOpts: this.onOpts,
    });
    const has = this.entries.has(entry);
    if (test && has) {
      const index = this._findIndex(entry.key);
      const oldIndex = this.entries.indexOf(entry);
      // this.entries.replace(entry, index, oldIndex);
      this.nextUpdate(oldIndex, index, entry);
    } else if (test && !has) {
      const index = this._findIndex(entry.key);
      // this.entries.add(entry, index);
      this.nextAdd(index, entry);
    } else if (!test && has) {
      const oldIndex = this.entries.indexOf(entry);
      // this.entries.remove(entry);
      this.nextRemove(oldIndex, entry);
    }
  }
}

export class AggregateTransformer<T> extends BaseTransformer<T, T> {
  private readonly aggregateCb: AggregateCb<T>;
  private readonly delayedCallback: boolean;
  private timeout?: any;

  constructor(data: Data, aggregate: AggregateCb<T>, delayedCallback: boolean) {
    super(data);
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

  add(index: number, entry: Entry<T>): void {
    // this.entries.add(entry, index);
    this.nextAdd(index, entry);
    this.callback();
  }

  remove(index: number, entry: Entry<T>): void {
    // this.entries.remove(entry, index);
    this.nextRemove(index, entry);
    this.callback();
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    // this.entries.replace(entry, index, oldIndex);
    this.nextUpdate(oldIndex, index, entry);
    this.callback();
  }
}
