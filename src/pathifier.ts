import { FlatTreeMiddleOut, Ref } from './flat-tree-middle-out';
import { BaseTransformer } from './transformers';
import { Data, Entry } from './data';

export class Pathifier {
  private f = new FlatTreeMiddleOut();
  private root: BaseTransformer<any, any>;
  private readonly data: Data;

  constructor(data: Data, root: BaseTransformer<any, any>) {
    this.data = data;
    this.root = root;
  }

  start() {
    for (const node of this.f.nodes()) {
      if (node.value instanceof BaseTransformer) {
        node.value.start();
      }
    }
  }

  stop() {
    for (const node of this.f.nodes()) {
      if (node.value instanceof BaseTransformer) {
        node.value.stop();
      }
    }
  }

  private add(path: Ref[], index: number, entry: Entry<any>) {
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

  put(index: number, value: any) {
    this.add([], index, { key: `${index}`, value } as Entry<any>);
  }

  private xremove(path: Ref[], index: number, entry: Entry<any>) {
    const res = this.f.remove(path, index);
    for (const { idx, value } of res.reverse()) {
      if (value instanceof BaseTransformer) {
        value.stop();
      }
      if (idx !== undefined) {
        this.root.remove(idx, entry);
      }
    }
  }

  private xupdate(
    path: Ref[],
    oldIndex: number,
    index: number,
    entry: Entry<any>
  ) {
    if (oldIndex === index) {
      const idx = this.f.getIndex(path, index);
      this.root.update(idx, idx, entry);
    } else {
      this.xremove(path, oldIndex, entry);
      this.add(path, index, entry);
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
          self.xremove(path, index, entry);
        }

        update(oldIndex: number, index: number, entry: Entry<any>): void {
          self.xupdate(path, oldIndex, index, entry);
        }
      })(this.data)
    );
  }
}
