import { Stower } from 'types';

export interface Entry {
  index: number;
  key: string;
  value: any;
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
    console.log('add', entry);
    entry.value = this.map(entry.value);
    this.entries.push(entry);
    this.next?.add(entry);
  }

  remove(entry: Entry): void {
    console.log('remove', entry);
    this.entries.splice(entry.index, 1);
    this.next?.remove(entry);
  }

  update(entry: Entry): void {
    console.log('update', entry);
    const e = this.entries[entry.index];
    e.value = this.map(entry.value);
    this.next?.update(entry);
  }

  rebuild(entries: Entry[]): void {
    console.log('rebuild', entries);
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
