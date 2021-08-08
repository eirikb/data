import test from 'ava';
import { Data, Entry, PlainTransformer } from '../src';

test('slice 1', t => {
  const array: string[] = [];
  const input = new PlainTransformer(new Data());
  input.slice(0, 2).toArray(array);
  input.add(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, ['a']);
  input.add(1, { value: 'b' } as Entry<string>);
  t.deepEqual(array, ['a', 'b']);
  input.add(2, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['a', 'b']);
});

test('slice 2', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(0, 2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, ['a']);
  slice.add(0, { value: 'b' } as Entry<string>);
  t.deepEqual(array, ['b', 'a']);
  slice.add(0, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['c', 'b']);
  slice.add(0, { value: 'd' } as Entry<string>);
  t.deepEqual(array, ['d', 'c']);
});

test('slice 3', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, []);
  slice.add(1, { value: 'b' } as Entry<string>);
  t.deepEqual(array, []);
  slice.add(2, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['c']);
  slice.add(3, { value: 'd' } as Entry<string>);
  t.deepEqual(array, ['c', 'd']);
});

test('slice 4', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, []);
  slice.add(0, { value: 'b' } as Entry<string>);
  t.deepEqual(array, []);
  slice.add(0, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['a']);
  slice.add(0, { value: 'd' } as Entry<string>);
  t.deepEqual(array, ['b', 'a']);
});

test('slice 5', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(0, 2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(1, { value: 'b' } as Entry<string>);
  slice.add(2, { value: 'c' } as Entry<string>);
  slice.remove(1, { value: 'b' } as Entry<string>);
  t.deepEqual(array, ['a', 'c']);
  slice.remove(1, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['a']);
  slice.remove(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, []);
});

test('slice 6', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(0, 2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(1, { value: 'b' } as Entry<string>);
  slice.add(2, { value: 'c' } as Entry<string>);
  slice.remove(2, { value: 'c' } as Entry<string>);
  t.deepEqual(array, ['a', 'b']);
  slice.remove(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, ['b']);
});

test('slice 7', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(1, { value: 'b' } as Entry<string>);
  slice.add(2, { value: 'c' } as Entry<string>);
  slice.add(3, { value: 'd' } as Entry<string>);
  slice.remove(3, { value: 'd' } as Entry<string>);
  t.deepEqual(array, ['c']);
  slice.remove(2, { value: 'c' } as Entry<string>);
  t.deepEqual(array, []);
});

test('slice 8', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(1, { value: 'b' } as Entry<string>);
  slice.add(2, { value: 'c' } as Entry<string>);
  slice.add(3, { value: 'd' } as Entry<string>);
  slice.remove(0, { value: 'a' } as Entry<string>);
  t.deepEqual(array, ['d']);
  slice.remove(0, { value: 'b' } as Entry<string>);
  t.deepEqual(array, []);
});

test('slice 9', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(0, { value: 'b' } as Entry<string>);
  slice.add(0, { value: 'c' } as Entry<string>);
  slice.add(0, { value: 'd' } as Entry<string>);
  slice.remove(0, { value: 'd' } as Entry<string>);
  t.deepEqual(array, ['a']);
  slice.remove(0, { value: 'c' } as Entry<string>);
  t.deepEqual(array, []);
});

test('slice 10', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(0, 2).toArray(array);
  slice.add(0, { value: 'a' } as Entry<string>);
  slice.add(1, { value: 'b' } as Entry<string>);
  slice.add(2, { value: 'c' } as Entry<string>);
  slice.add(3, { value: 'd' } as Entry<string>);

  slice.update(0, 3, { value: 'a' } as Entry<string>);
  t.deepEqual(array, ['b', 'c']);
});

test('slice 11', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(1, 3).toArray(array);
  slice.add(0, { value: 'b' } as Entry<string>);
  slice.add(1, { value: 'c' } as Entry<string>);
  slice.add(2, { value: 'd' } as Entry<string>);
  slice.add(3, { value: 'e' } as Entry<string>);
  t.deepEqual(array, ['c', 'd']);
});

test('or', t => {
  const array: string[] = [];
  const slice = new PlainTransformer(new Data());
  slice.slice(1, 3).toArray(array);
  slice.add(0, { value: 'b' } as Entry<string>);
  slice.add(1, { value: 'c' } as Entry<string>);
  slice.add(2, { value: 'd' } as Entry<string>);
  slice.add(3, { value: 'e' } as Entry<string>);
  t.deepEqual(array, ['c', 'd']);
});
