import { FlatTreeMiddleOut, Ref } from './flat-tree-middle-out';
import { BaseTransformer, DataTransformer } from './transformers';
import { Data, Entry } from './data';

export class Pathifier {
  private f = new FlatTreeMiddleOut();
  private root: BaseTransformer<any, any>;
  private readonly data: Data;

  constructor(data: Data, root: BaseTransformer<any, any>) {
    this.data = data;
    this.root = root;
  }

  private wat(o: any): string {
    if (o.constructor.name.endsWith('Transformer')) {
      return o.constructor.name;
    } else if (Array.isArray(o)) {
      return '[' + o.map(this.wat).join(', ') + ']';
    } else {
      return o;
    }
  }

  private add(path: Ref[], index: number, entry: Entry<any>) {
    console.log('xadd', path, index, this.wat(entry.value));

    if (entry.value instanceof BaseTransformer) {
      this.hack(path, index, entry.value);
    } else if (Array.isArray(entry.value)) {
      const [rr] = this.f.add(path, index, [], false);
      path = path.concat(rr);
      entry.value.forEach((value, index) =>
        this.add(path, index, { ...entry, ...{ value } })
      );
    } else {
      const [, idx] = this.f.add(path, index, entry, true);
      if (idx !== undefined) {
        this.root.add(idx, entry);
      }
    }
  }

  on(path: string): DataTransformer<any> {
    return new DataTransformer<any>(this.data, path);
  }

  put(index: number, value: any) {
    this.add([], index, { key: `${index}`, value } as Entry<any>);
  }

  private xremove(path: Ref[], index: number, entry: Entry<any>) {
    const idx = this.f.remove(path, index, true);
    if (idx !== undefined) {
      this.root.remove(idx, entry);
    }
  }

  private hack(p: Ref[], iii: number, d: BaseTransformer<any, any>) {
    const [rr] = this.f.add(p, iii, d, false);
    const path = p.concat(rr);
    const self = this;
    d.addTransformer(
      new (class extends BaseTransformer<any, any> {
        add(index: number, entry: Entry<any>): void {
          self.add(path, index, entry);
        }

        remove(index: number, entry: Entry<any>): void {
          console.log('remove', index);
          self.xremove(path, index, entry);
        }

        update(oldIndex: number, index: number, entry: Entry<any>): void {
          console.log('update', oldIndex, index, entry);
        }
      })(this.data)
    );

    // d.start();
  }
}
