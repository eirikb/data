import { ListenerCallbackOptions, Stower } from 'types';

export interface Entry {
  index: number;
  key: string;
  value: any;
  opts: ListenerCallbackOptions;
}

export abstract class Transformer {
  protected entries: Entry[] = [];
  next?: Transformer;

  abstract add(entry: Entry): void;

  abstract update(entry: Entry): void;

  abstract remove(entry: Entry): void;

  abstract rebuild(entries: Entry[]): void;
}

export class MapTransformer extends Transformer {
  private readonly map: (value: any) => any;

  constructor(map: (value: any) => any) {
    super();
    this.map = map;
  }

  add(entry: Entry): void {
    entry = Object.assign({}, entry);
    entry.value = this.map(entry.value);
    this.entries.splice(entry.index, 0, entry);
    this.next?.add(entry);
  }

  remove(entry: Entry): void {
    entry = Object.assign({}, entry);
    this.entries.splice(entry.index, 1);
    this.next?.remove(entry);
  }

  update(entry: Entry): void {
    entry = Object.assign({}, entry);
    const e = this.entries[entry.index];
    e.value = this.map(entry.value);
    this.next?.update(e);
  }

  rebuild(entries: Entry[]): void {
    this.entries = [];
    entries.forEach(this.add);
    this.next?.rebuild(this.entries);
  }
}

export class StowerTransformer extends Transformer {
  stower?: Stower;
  index: number = 0;

  add(entry: Entry): void {
    this.stower?.add(entry.value, this.index, entry.index);
  }

  rebuild(entries: Entry[]): void {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      this.stower?.remove(this.entries[i].value, this.index, i);
    }
    this.entries = [];
    for (let entry of entries) {
      this.add(entry);
    }
  }

  remove(entry: Entry): void {
    this.entries.splice(entry.index, 0);
    this.stower?.remove(entry.value, this.index, entry.index);
  }

  update(entry: Entry): void {
    this.entries[entry.index] = entry;
    this.stower?.add(entry.value, this.index, entry.index);
  }
}

export class SortTransformer extends Transformer {
  private readonly sort: (a: any, b: any) => number;

  constructor(sort: (a: any, b: any) => number) {
    super();
    this.sort = sort;
  }

  private _sortedIndex(value: any) {
    let low = 0;
    let high = this.entries.length;

    while (low < high) {
      let mid = (low + high) >>> 1;
      if (this.sort(value, this.entries[mid].value) > 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  add(entry: Entry): void {
    entry.index = this._sortedIndex(entry.value);
    this.entries.splice(entry.index, 0, entry);
    this.next?.add(entry);
  }

  remove(entry: Entry): void {
    this.entries.splice(entry.index, 1);
    this.next?.remove(entry);
  }

  update(entry: Entry): void {
    const currentIndex = this.entries.findIndex(
      e => e.opts.path === entry.opts.path
    );
    if (currentIndex >= 0) {
      const e = this.entries[currentIndex];
      e.value = entry.value;
      const newIndex = this._sortedIndex(e.value);
      if (newIndex !== currentIndex) {
        e.index = currentIndex;
        this.entries.splice(e.index, 1);
        this.next?.remove(e);
        e.index = newIndex;
        this.entries.splice(e.index, 0, e);
        this.next?.add(e);
      } else {
        e.index = currentIndex;
        e.value = entry.value;
        this.next?.update(e);
      }
    }
  }

  rebuild(entries: Entry[]): void {
    this.entries = [];
    entries.forEach(this.add);
    this.next?.rebuild(this.entries);
  }
}
