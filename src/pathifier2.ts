import { ArrayTransformer, Data, SliceTransformer, SortTransformer } from './';
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

  map(map: (value: any) => any): Pathifier2 {
    this._addTransformer(new MapTransformer(map));
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
