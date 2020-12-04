import { ListenerCallbackOptions, Stower } from 'types';

export interface Entry {
  key: string;
  value: any;
  opts: ListenerCallbackOptions;
}

export abstract class Transformer {
  next?: Transformer;

  abstract add(index: number, entry: Entry): void;

  abstract update(oldIndex: number, index: number, entry: Entry): void;

  abstract remove(index: number, entry: Entry): void;
}

export class ArrayTransformer extends Transformer {
  private entries: Entry[] = [];

  add(index: number, entry: Entry): void {
    index = this.entries.push(entry);
    this.next?.add(index - 1, entry);
  }

  remove(index: number, entry: Entry): void {
    index = this.entries.findIndex(e => e.key === entry.key);
    this.entries.splice(index, 1);
    this.next?.remove(index, entry);
  }

  update(_oldIndex: number, index: number, entry: Entry): void {
    index = this.entries.findIndex(e => e.key === entry.key);
    this.entries[index] = entry;
    this.next?.update(index, index, entry);
  }
}

export class MapTransformer extends Transformer {
  private entries: { [key: string]: Entry } = {};
  private readonly map: (value: any) => any;

  constructor(map: (value: any) => any) {
    super();
    this.map = map;
  }

  add(index: number, entry: Entry): void {
    entry = Object.assign({}, entry);
    entry.value = this.map(entry.value);
    this.entries[entry.key] = entry;
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    delete this.entries[entry.key];
    this.next?.remove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    entry = Object.assign({}, entry);
    entry.value = this.map(entry.value);
    this.entries[entry.key] = entry;
    this.next?.update(oldIndex, index, entry);
  }
}

export class StowerTransformer extends Transformer {
  stower?: Stower;
  index: number = 0;

  add(index: number, entry: Entry): void {
    this.stower?.add(entry.value, this.index, index);
  }

  remove(index: number, entry: Entry): void {
    this.stower?.remove(entry.value, this.index, index);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.stower?.remove(entry.value, this.index, oldIndex);
    this.stower?.add(entry.value, this.index, index);
  }
}

export class SortTransformer extends Transformer {
  private entries: Entry[] = [];
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

  add(index: number, entry: Entry): void {
    index = this._sortedIndex(entry.value);
    this.entries.splice(index, 0, entry);
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    index = this.entries.findIndex(e => e.key === entry.key);
    this.entries.splice(index, 1);
    this.next?.remove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    const oldIndex2 = this.entries.findIndex(e => e.key === entry.key);
    if (oldIndex2 >= 0) {
      const index2 = this._sortedIndex(entry.value);
      if (oldIndex2 !== index2) {
        this.entries.splice(oldIndex, 1);
        this.entries.splice(index, 0, entry);
        this.next?.update(oldIndex2, index2, entry);
      } else {
        this.next?.update(oldIndex, index, entry);
      }
    } else {
      this.next?.update(oldIndex, index, entry);
    }
  }
}

export class SliceTransformer extends Transformer {
  private entries: Entry[] = [];
  private readonly start: number;
  private readonly end?: number;

  constructor(start: number, end?: number) {
    super();
    this.start = start;
    this.end = end;
  }

  private verify(index: number): boolean {
    if (index < this.start) return false;
    return !(this.end && index >= this.end);
  }

  add(index: number, entry: Entry): void {
    this.entries.splice(index, 0, entry);
    if (!this.verify(index)) {
      if (index > this.start) return;

      if (this.entries.length > this.start) {
        this.next?.add(0, this.entries[this.start]);
        if (this.end && this.entries.length > this.end) {
          this.next?.remove(this.end - this.start, this.entries[this.end]);
        }
      }
      return;
    }
    this.next?.add(index, entry);
  }

  remove(index: number, entry: Entry): void {
    this.entries.splice(index, 1);
    if (!this.verify(index)) return;
    this.next?.remove(index, entry);
  }

  update(oldIndex: number, index: number, entry: Entry): void {
    this.entries.splice(oldIndex, 1);
    this.entries.splice(index, 1);
    const oldOk = this.verify(oldIndex);
    const newOk = this.verify(index);
    if (!oldOk && !newOk) return;

    if (oldOk && newOk) {
      this.next?.update(oldIndex, index, entry);
    } else if (!oldOk && newOk) {
      this.next?.add(index, entry);
    } else if (oldOk && !newOk) {
      this.next?.remove(index, entry);
    }
  }
}
