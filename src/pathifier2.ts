import { Data, SortTransformer } from './';
import { MapTransformer, Transformer } from './transformers';

export class Pathifier2 {
  private readonly data: Data;
  private readonly path: string;
  private rootTransformer?: Transformer;
  transformer?: Transformer;

  constructor(data: Data, path: string) {
    this.data = data;
    this.path = path;
  }

  private _root(): Transformer | undefined {
    return this.rootTransformer || this.transformer;
  }

  init() {
    const keys: string[] = [];
    this.data.on(`!+ ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      keys.push(key);
      const index = keys.length - 1;
      this._root()?.add({ index, key, value, opts });
    });

    this.data.on(`* ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      const index = keys.findIndex(k => k === key);
      this._root()?.update({ index, key, value, opts });
    });

    this.data.on(`- ${this.path}`, (value, opts) => {
      const key = opts.path.split('.').slice(-1)[0];
      const index = keys.findIndex(k => k === key);
      keys.splice(index, 1);
      this._root()?.remove({ index, key, value, opts });
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
}
