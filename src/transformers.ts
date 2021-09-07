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

  add(entry: Entry<T>, index: number): void {
    this.entries.splice(index, 0, entry);
    this.keys.splice(index, 0, entry.key);
    this.hasSet.add(entry.key);
  }

  remove(entry: Entry<T>, index: number): void {
    this.entries.splice(index, 1);
    this.keys.splice(index, 1);
    this.hasSet.delete(entry.key);
  }

  indexOf(entry: Entry<T>) {
    return this.keys.indexOf(entry.key);
  }

  replace(entry: Entry<T>, index: number, oldIndex: number): void {
    this.remove(entry, oldIndex);
    this.add(entry, index);
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
      this.running = true;

      if (this.onPath) {
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
    }
  }

  stop(recursive = true) {
    if (this.running) {
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
    }
  }

  abstract add(index: number, entry: Entry<T>): void;

  abstract remove(index: number, entry: Entry<T>): void;

  abstract update(oldIndex: number, index: number, entry: Entry<T>): void;

  protected nextAdd(index: number, entry: Entry<O>): void {
    this.entries.add(entry, index);
    for (const transformer of this.nextTransformers) {
      transformer.add(index, entry);
    }
  }

  protected nextRemove(index: number, entry: Entry<O>): void {
    this.entries.remove(entry, index);
    for (const transformer of this.nextTransformers) {
      transformer.remove(index, entry);
    }
  }

  protected nextUpdate(oldIndex: number, index: number, entry: Entry<O>): void {
    this.entries.replace(entry, index, oldIndex);
    for (const transformer of this.nextTransformers) {
      transformer.update(oldIndex, index, entry);
    }
  }

  addTransformer<X, Y>(next: BaseTransformer<X, Y>): BaseTransformer<X, Y> {
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
      new SliceTransformer(this.data, 0, undefined, sliceOn)
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
    this.nextAdd(this.entries.length, entry);
  }

  remove(_: number, entry: Entry<T>): void {
    this.nextRemove(this.entries.indexOf(entry), entry);
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
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
    this.array.splice(index, 0, entry.value);
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    this.array.splice(index, 1);
    this.nextRemove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    this.array.splice(oldIndex, 1);
    this.array.splice(index, 0, entry.value);
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
    this.nextAdd(index, e);
  }

  remove(index: number, _: Entry<T>): void {
    const e = this.entries.get(index);
    this.nextRemove(index, e);
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    const e = this.toEntry(entry);
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
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  add(index: number, entry: Entry<T>): void {
    if (this._orSet) {
      this.nextRemove(0, this._or);
      this._orSet = false;
    }
    this.nextAdd(index, entry);
  }

  remove(index: number, entry: Entry<T>): void {
    this.nextRemove(index, entry);
    if (this.entries.length === 0 && !this._orSet) {
      this.nextAdd(0, this._or);
      this._orSet = true;
    }
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
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
    this.nextAdd(index, entry);
  }

  remove(_: number, entry: Entry<T>): void {
    this.nextRemove(this.entries.indexOf(entry), entry);
  }

  update(_: number, __: number, entry: Entry<T>): void {
    const oldIndex = this.entries.indexOf(entry);
    let index = this._sortedIndex(entry);
    if (index > oldIndex) index--;
    this.nextUpdate(oldIndex, index, entry);
  }
}

export class SliceTransformer<T> extends BaseTransformer<T, T> {
  private startAt: number;
  private endAt: number;
  private itemsBeforeStart: number = 0;
  private readonly _sliceOn?: SliceOn<T> | undefined;

  constructor(
    data: Data,
    startAt: number,
    endAt?: number,
    sliceOn?: SliceOn<T>
  ) {
    super(data);
    this.startAt = startAt;
    this.endAt = endAt !== undefined ? endAt : Number.MAX_VALUE;
    this._sliceOn = sliceOn;
  }

  add(index: number, entry: Entry<T>): void {
    if (this.parent !== undefined) {
      const mySize = this.entries.length;
      const start = this.startAt;
      const end = this.endAt;
      const expectedSize = end - start;

      if (index >= start && index < end) {
        if (mySize + 1 > expectedSize) {
          this.nextRemove(expectedSize - 1, this.entries.get(expectedSize - 1));
        }
        this.nextAdd(index - start, entry);
      } else if (index < end) {
        if (this.itemsBeforeStart === start) {
          if (mySize + 1 > expectedSize) {
            this.nextRemove(
              expectedSize - 1,
              this.entries.get(expectedSize - 1)
            );
          }
          this.nextAdd(0, this.parent.entries.get(start));
        } else {
          this.itemsBeforeStart++;
        }
      }
    }
  }

  remove(index: number, entry: Entry<T>): void {
    if (this.parent !== undefined) {
      const mySize = this.entries.length;
      const parentSize = this.parent.entries.length;
      const start = this.startAt;
      const end = this.endAt;
      const expectedSize = end - start;

      if (index >= start && index < end) {
        this.nextRemove(index - start, entry);
        if (mySize - 1 < expectedSize && parentSize > start + expectedSize) {
          this.nextAdd(
            expectedSize - 1,
            this.parent.entries.get(start + expectedSize - 1)
          );
        }
      } else if (index < end) {
        if (this.itemsBeforeStart === start && mySize > 0) {
          this.nextRemove(0, this.entries.get(index));
          if (mySize - 1 < expectedSize) {
            this.nextAdd(
              expectedSize - 1,
              this.parent.entries.get(start + expectedSize - 1)
            );
          }
        } else {
          this.itemsBeforeStart--;
        }
      }
    }
  }

  on(value: any, opts: ListenerCallbackOptions) {
    if (this._sliceOn && this.parent !== undefined) {
      for (let i = this.entries.length - 1; i >= 0; i--) {
        this.nextRemove(i, this.entries.get(i));
      }
      const [start, end] = this._sliceOn(value, opts);
      this.startAt = start;
      this.endAt = end !== undefined ? end : Number.MAX_VALUE;
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

  constructor(data: Data, filter: OnFilter<T>) {
    super(data);
    this._filter = filter;
  }

  private _findIndex(key: string): number {
    let index = 0;
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
    if (
      this._filter(entry.value, {
        opts: entry.opts,
        onValue: this.onValue,
        onOpts: this.onOpts,
      })
    ) {
      index = this._findIndex(entry.key);
      this.nextAdd(index, entry);
    }
  }

  remove(index: number, entry: Entry<T>): void {
    index = this.entries.indexOf(entry);
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
          this.nextAdd(index, entry);
        } else if (!test && has) {
          this.nextRemove(this.entries.indexOf(entry), entry);
        }
        if (test) index++;
      });
    }
  }

  update(_oldIndex: number, _index: number, entry: Entry<T>): void {
    const test = this._filter(entry.value, {
      opts: entry.opts,
      onValue: this.onValue,
      onOpts: this.onOpts,
    });
    const has = this.entries.has(entry);
    if (test && has) {
      const index = this._findIndex(entry.key);
      const oldIndex = this.entries.indexOf(entry);
      this.nextUpdate(oldIndex, index, entry);
    } else if (test && !has) {
      const index = this._findIndex(entry.key);
      this.nextAdd(index, entry);
    } else if (!test && has) {
      const oldIndex = this.entries.indexOf(entry);
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
    this.nextAdd(index, entry);
    this.callback();
  }

  remove(index: number, entry: Entry<T>): void {
    this.nextRemove(index, entry);
    this.callback();
  }

  update(oldIndex: number, index: number, entry: Entry<T>): void {
    this.nextUpdate(oldIndex, index, entry);
    this.callback();
  }
}
