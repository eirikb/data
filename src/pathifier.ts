import {
  AggregateCb,
  Filter,
  Mapper,
  OnFilter,
  OnMapper,
  OnSorter2,
  SliceOn,
  Sorter2,
} from './types';
import {
  MapTransformer,
  Transformer,
  SortTransformer,
  SliceTransformer,
  OrTransformer,
  FilterTransformer,
  AggregateTransformer,
  ArrayTransformer,
} from './transformers';
import { Data } from './data';

export class Pathifier {
  private readonly data: Data;
  private readonly path: string;
  private _transformer?: Transformer;
  private rootTransformer: ArrayTransformer = new ArrayTransformer();
  private readonly refs: string[] = [];

  constructor(data: Data, path: string) {
    this.data = data;
    this.path = path;
  }

  set transformer(transformer: Transformer | undefined) {
    this._transformer = transformer;
    let t = this.rootTransformer;
    while (t.next) t = t.next;
    t.next = transformer;
  }

  get transformer(): Transformer | undefined {
    return this._transformer;
  }

  init() {
    this.refs.push(
      this.data.on(`!+ ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.rootTransformer.add(0, { key, value, opts });
      })
    );

    this.refs.push(
      this.data.on(`* ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.rootTransformer?.update(0, 0, { key, value, opts });
      })
    );

    this.refs.push(
      this.data.on(`- ${this.path}`, (value, opts) => {
        const key = opts.path.split('.').slice(-1)[0];
        this.rootTransformer.remove(0, { key, value, opts });
      })
    );

    let t = this.rootTransformer.next;
    while (t) {
      if (t.init) t.init();
      t = t.next;
    }
  }

  lastTransformer() {
    let t: Transformer = this.rootTransformer;
    while (t?.next && t.next !== this._transformer) {
      t = t.next;
    }
    return t;
  }

  addTransformer(transformer: Transformer) {
    transformer.next = this._transformer;
    const lastTransformer = this.lastTransformer();
    lastTransformer.next = transformer;
  }

  map<T = any>(map: Mapper<T>): Pathifier {
    this.addTransformer(new MapTransformer(map));
    return this;
  }

  private _addOnTransformer(path: string, transformer: Transformer) {
    this.addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, (value, opts) => transformer.on(value, opts))
    );
  }

  mapOn<T = any>(path: string, map: OnMapper<T>): Pathifier {
    const transformer = new MapTransformer(map);
    this._addOnTransformer(path, transformer);
    return this;
  }

  sortOn<T = any>(path: string, sort: OnSorter2<T>): Pathifier {
    const transformer = new SortTransformer(sort);
    this._addOnTransformer(path, transformer);
    return this;
  }

  sort<T = any>(sort: Sorter2<T>): Pathifier {
    this.addTransformer(new SortTransformer(sort));
    return this;
  }

  slice(start: number, end?: number): Pathifier {
    this.addTransformer(new SliceTransformer(start, end));
    return this;
  }

  sliceOn(path: string, sliceOn: SliceOn): Pathifier {
    const transformer = new SliceTransformer(0, 0, sliceOn);
    this._addOnTransformer(path, transformer);
    return this;
  }

  filter<T = any>(filter: Filter<T>): Pathifier {
    this.addTransformer(
      new FilterTransformer((value, opts) => filter(value, opts.opts))
    );
    return this;
  }

  filterOn<T = any>(path: string, filterOn: OnFilter<T>): Pathifier {
    const transformer = new FilterTransformer(filterOn);
    this._addOnTransformer(path, transformer);
    return this;
  }

  or(or: any): Pathifier {
    this.addTransformer(new OrTransformer(or));
    return this;
  }

  aggregate<T = any>(aggregate: AggregateCb<T>, delayedCallback = false) {
    this.addTransformer(
      new AggregateTransformer<T>(aggregate, delayedCallback)
    );
    return this;
  }

  off() {
    for (let ref of this.refs) {
      this.data.off(ref);
    }
  }
}
