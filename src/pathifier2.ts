import {
  ArrayTransformer,
  Data,
  Filter2,
  FilterTransformer,
  Mapper,
  OnFilter2,
  OnMapper,
  OnSorter2,
  SliceOn,
  SliceTransformer,
  Sorter2,
  SortTransformer,
} from './';
import { MapTransformer, Transformer } from './transformers';

export class Pathifier2 {
  private readonly data: Data;
  private readonly path: string;
  readonly transformer: Transformer;
  private rootTransformer: ArrayTransformer = new ArrayTransformer();
  private readonly refs: string[] = [];

  constructor(data: Data, path: string, transformer: Transformer) {
    this.data = data;
    this.path = path;
    this.transformer = transformer;
    this.rootTransformer.next = transformer;
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
  }

  private _addTransformer(transformer: Transformer) {
    transformer.next = this.transformer;

    let t: Transformer = this.rootTransformer;
    while (t?.next && t.next !== this.transformer) {
      t = t.next;
    }
    t.next = transformer;

    transformer.init(t.entries);
    t.entries.forEach((entry, index) =>
      transformer.update(index, index, entry)
    );
  }

  map(map: Mapper): Pathifier2 {
    this._addTransformer(new MapTransformer(map));
    return this;
  }

  mapOn(path: string, map: OnMapper): Pathifier2 {
    const transformer = new MapTransformer(map);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  sortOn(path: string, sort: OnSorter2): Pathifier2 {
    const transformer = new SortTransformer(sort);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  sort(sort: Sorter2): Pathifier2 {
    this._addTransformer(new SortTransformer(sort));
    return this;
  }

  slice(start: number, end?: number): Pathifier2 {
    this._addTransformer(new SliceTransformer(start, end));
    return this;
  }

  sliceOn(path: string, sliceOn: SliceOn): Pathifier2 {
    const transformer = new SliceTransformer(0, 0, sliceOn);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  filter(filter: Filter2): Pathifier2 {
    this._addTransformer(
      new FilterTransformer((value, opts) => filter(value, opts.opts))
    );
    return this;
  }

  filterOn(path: string, filterOn: OnFilter2): Pathifier2 {
    const transformer = new FilterTransformer(filterOn);
    this._addTransformer(transformer);
    this.refs.push(
      this.data.on(`!+* ${path}`, transformer.on.bind(transformer))
    );
    return this;
  }

  off() {
    for (let ref of this.refs) {
      this.data.off(ref);
    }
  }
}
