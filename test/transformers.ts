import test from 'ava';
import {
  Entries,
  Entry,
  ListenerCallbackOptions,
  SliceTransformer,
  Transformer,
} from '../src';

const parent = {} as Transformer;

function create(transformer: Transformer) {
  const array: any[] = [];
  transformer.next = new (class implements Transformer {
    entries: Entries = new Entries();

    add(index: number, entry: Entry): void {
      array.splice(index, 0, entry.value);
    }

    on(_: any, __: ListenerCallbackOptions): void {}

    remove(index: number, _: Entry): void {
      array.splice(index, 1);
    }

    update(oldIndex: number, index: number, entry: Entry): void {
      this.remove(oldIndex, entry);
      this.add(index, entry);
    }
  })();
  return array;
}

test('slice 1', t => {
  const slice = new SliceTransformer(parent, 0, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  t.deepEqual(array, ['a']);
  slice.add(1, { value: 'b' } as Entry);
  t.deepEqual(array, ['a', 'b']);
  slice.add(2, { value: 'c' } as Entry);
  t.deepEqual(array, ['a', 'b']);
});

test('slice 2', t => {
  const slice = new SliceTransformer(parent, 0, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  t.deepEqual(array, ['a']);
  slice.add(0, { value: 'b' } as Entry);
  t.deepEqual(array, ['b', 'a']);
  slice.add(0, { value: 'c' } as Entry);
  t.deepEqual(array, ['c', 'b']);
  slice.add(0, { value: 'd' } as Entry);
  t.deepEqual(array, ['d', 'c']);
});

test('slice 3', t => {
  const slice = new SliceTransformer(parent, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  t.deepEqual(array, []);
  slice.add(1, { value: 'b' } as Entry);
  t.deepEqual(array, []);
  slice.add(2, { value: 'c' } as Entry);
  t.deepEqual(array, ['c']);
  slice.add(3, { value: 'd' } as Entry);
  t.deepEqual(array, ['c', 'd']);
});

test('slice 4', t => {
  const slice = new SliceTransformer(parent, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  t.deepEqual(array, []);
  slice.add(0, { value: 'b' } as Entry);
  t.deepEqual(array, []);
  slice.add(0, { value: 'c' } as Entry);
  t.deepEqual(array, ['a']);
  slice.add(0, { value: 'd' } as Entry);
  t.deepEqual(array, ['b', 'a']);
});

test('slice 5', t => {
  const slice = new SliceTransformer(parent, 0, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(1, { value: 'b' } as Entry);
  slice.add(2, { value: 'c' } as Entry);
  slice.remove(1, { value: 'b' } as Entry);
  t.deepEqual(array, ['a', 'c']);
  slice.remove(1, { value: 'c' } as Entry);
  t.deepEqual(array, ['a']);
  slice.remove(0, { value: 'a' } as Entry);
  t.deepEqual(array, []);
});

test('slice 6', t => {
  const slice = new SliceTransformer(parent, 0, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(1, { value: 'b' } as Entry);
  slice.add(2, { value: 'c' } as Entry);
  slice.remove(2, { value: 'c' } as Entry);
  t.deepEqual(array, ['a', 'b']);
  slice.remove(0, { value: 'a' } as Entry);
  t.deepEqual(array, ['b']);
});

test('slice 7', t => {
  const slice = new SliceTransformer(parent, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(1, { value: 'b' } as Entry);
  slice.add(2, { value: 'c' } as Entry);
  slice.add(3, { value: 'd' } as Entry);
  slice.remove(3, { value: 'd' } as Entry);
  t.deepEqual(array, ['c']);
  slice.remove(2, { value: 'c' } as Entry);
  t.deepEqual(array, []);
});

test('slice 8', t => {
  const slice = new SliceTransformer(parent, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(1, { value: 'b' } as Entry);
  slice.add(2, { value: 'c' } as Entry);
  slice.add(3, { value: 'd' } as Entry);
  slice.remove(0, { value: 'a' } as Entry);
  t.deepEqual(array, ['d']);
  slice.remove(0, { value: 'b' } as Entry);
  t.deepEqual(array, []);
});

test('slice 9', t => {
  const slice = new SliceTransformer(parent, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(0, { value: 'b' } as Entry);
  slice.add(0, { value: 'c' } as Entry);
  slice.add(0, { value: 'd' } as Entry);
  slice.remove(0, { value: 'd' } as Entry);
  t.deepEqual(array, ['a']);
  slice.remove(0, { value: 'c' } as Entry);
  t.deepEqual(array, []);
});

test('slice 10', t => {
  const slice = new SliceTransformer(parent, 0, 2);
  const array = create(slice);
  slice.add(0, { value: 'a' } as Entry);
  slice.add(1, { value: 'b' } as Entry);
  slice.add(2, { value: 'c' } as Entry);
  slice.add(3, { value: 'd' } as Entry);

  slice.update(0, 3, { value: 'a' } as Entry);
  t.deepEqual(array, ['b', 'c']);
});

test('slice 11', t => {
  const slice = new SliceTransformer(parent, 1, 3);
  const array = create(slice);
  slice.add(0, { value: 'b' } as Entry);
  slice.add(1, { value: 'c' } as Entry);
  slice.add(2, { value: 'd' } as Entry);
  slice.add(3, { value: 'e' } as Entry);
  t.deepEqual(array, ['c', 'd']);
});
