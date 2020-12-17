import {
  AggregateTransformer,
  ArrayTransformer,
  Data,
  Entry,
  Filter,
  FilterTransformer,
  Mapper,
  OnFilter,
  OnMapper,
  OnSorter2,
  OrTransformer,
  SliceOn,
  SliceTransformer,
  Sorter2,
  SortTransformer,
} from './';
import { MapTransformer, Transformer } from './transformers';

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

  private _addTransformer(transformer: Transformer) {
    transformer.next = this._transformer;

    let t: Transformer = this.rootTransformer;
    while (t?.next && t.next !== this._transformer) {
      t = t.next;
    }
    t.next = transformer;
  }

  map(map: Mapper): Pathifier {
    this._addTransformer(new MapTransformer(map));
    return this;
  }

  mapOn(path: string, map: OnMapper): Pathifier {
    const transformer = new MapTransformer(map);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  sortOn(path: string, sort: OnSorter2): Pathifier {
    const transformer = new SortTransformer(sort);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  sort(sort: Sorter2): Pathifier {
    this._addTransformer(new SortTransformer(sort));
    return this;
  }

  slice(start: number, end?: number): Pathifier {
    this._addTransformer(new SliceTransformer(start, end));
    return this;
  }

  sliceOn(path: string, sliceOn: SliceOn): Pathifier {
    const transformer = new SliceTransformer(0, 0, sliceOn);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  filter(filter: Filter): Pathifier {
    this._addTransformer(
      new FilterTransformer((value, opts) => filter(value, opts.opts))
    );
    return this;
  }

  filterOn(path: string, filterOn: OnFilter): Pathifier {
    const transformer = new FilterTransformer(filterOn);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  or(or: any): Pathifier {
    this._addTransformer(new OrTransformer(or));
    return this;
  }

  aggregate(aggregate: (entries: Entry[]) => void) {
    this._addTransformer(new AggregateTransformer(aggregate));
    return this;
  }

  off() {
    for (let ref of this.refs) {
      this.data.off(ref);
    }
  }
}
