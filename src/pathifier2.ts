import {
  ArrayTransformer,
  Data,
  Mapper,
  OnMapper,
  SliceTransformer,
  SortTransformer,
} from './';
import { MapTransformer, Transformer } from './transformers';

export class Pathifier2 {
  private readonly data: Data;
  private readonly path: string;
  private readonly transformer: Transformer;
  private rootTransformer: Transformer = new ArrayTransformer();

  constructor(data: Data, path: string, transformer: Transformer) {
    this.data = data;
    this.path = path;
    this.transformer = transformer;
    this.rootTransformer.next = transformer;
  }

  init() {
    this.data.on(`!+ ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      this.rootTransformer.add(0, { key, value, opts });
    });

    this.data.on(`* ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      this.rootTransformer?.update(0, 0, { key, value, opts });
    });

    this.data.on(`- ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      this.rootTransformer.remove(0, { key, value, opts });
    });
  }

  private _addTransformer(transformer: Transformer) {
    transformer.next = this.transformer;

    if (!this.rootTransformer) {
      this.rootTransformer = transformer;
      return;
    }

    let t = this.rootTransformer;
    while (t?.next && t.next !== this.transformer) {
      t = t.next;
    }
    t.next = transformer;
  }

  map(map: Mapper): Pathifier2 {
    this._addTransformer(
      new MapTransformer((_onValue, _onOpts, value, opts) => map(value, opts))
    );
    return this;
  }

  mapOn(path: string, map: OnMapper) {
    const transformer = new MapTransformer(map);
    this._addTransformer(transformer);
    this.data.on(`!+* ${path}`, transformer.on.bind(transformer));
    return this;
  }

  sort(sort: (a: any, b: any) => number): Pathifier2 {
    this._addTransformer(new SortTransformer(sort));
    return this;
  }

  slice(start: number, end?: number): Pathifier2 {
    this._addTransformer(new SliceTransformer(start, end));
    return this;
  }
}
