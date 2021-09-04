import test from 'ava';
import { FlatTreeMiddleOut } from '../src/flat-tree-middle-out';

test('a', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
});

test('ab', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 1, 'b', true)[1], 1);
});

test('ba', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 1, 'b', true)[1], 0);
  t.is(f.add([], 0, 'a', true)[1], 0);
});

test('abc', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 1, 'b', true)[1], 1);
  t.is(f.add([], 2, 'c', true)[1], 2);
});

test('abcd', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 1, 'b', true)[1], 1);
  t.is(f.add([], 2, 'c', true)[1], 2);
  t.is(f.add([], 3, 'd', true)[1], 3);
});

test('abdc', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 1, 'b', true)[1], 1);
  t.is(f.add([], 3, 'd', true)[1], 2);
  t.is(f.add([], 2, 'c', true)[1], 2);
});

test('tree 1', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  const dt = f.add([], 1, 'DT!', false);
  t.is(dt[1], undefined);
  t.is(f.add([dt[0]], 0, 'b', true)[1], 1);
});

test('tree 2', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  const dt = f.add([], 1, 'DT!', false);
  t.is(dt[1], undefined);
  t.is(f.add([dt[0]], 0, 'b', true)[1], 1);
  t.is(f.add([dt[0]], 1, 'c', true)[1], 2);
  t.is(f.add([], 2, 'd', true)[1], 3);
});

test('tree 3', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  const dt = f.add([], 1, 'DT!', false);
  t.is(f.add([], 2, 'd', true)[1], 1);
  t.is(dt[1], undefined);
  t.is(f.add([dt[0]], 0, 'b', true)[1], 1);
  t.is(f.add([dt[0]], 1, 'c', true)[1], 2);
});

test('replace', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 0, 'b', true)[1], 0);
});

test('tree 4', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 3, 'd', true)[1], 1);
  const dt1 = f.add([], 1, 'DT!', false)[0];
  const dt2 = f.add([dt1], 0, 'DT2!', false)[0];
  const dt3 = f.add([dt1, dt2], 0, 'DT3!', false)[0];
  const dt4 = f.add([dt1, dt2], 1, 'DT4!', false)[0];
  t.is(f.add([dt1, dt2, dt3], 0, 'b', true)[1], 1);
  t.is(f.add([dt1, dt2, dt3], 1, 'c', true)[1], 2);
  t.is(f.add([dt1, dt2, dt4], 0, 'd', true)[1], 3);
  t.is(f.add([dt1, dt2], 2, 'e', true)[1], 4);
  const dt5 = f.add([], 2, 'DT5!', false)[0];
  const dt6 = f.add([dt5], 0, 'DT6!', false)[0];
  const dt7 = f.add([dt5, dt6], 0, 'DT7!', false)[0];
  const dt8 = f.add([dt5, dt6], 1, 'DT8!', false)[0];
  t.is(f.add([dt5, dt6, dt7], 0, 'f', true)[1], 5);
  t.is(f.add([dt5, dt6, dt7], 1, 'g', true)[1], 6);
  t.is(f.add([dt5, dt6, dt8], 0, 'h', true)[1], 7);
  t.is(f.add([dt5, dt6, dt8], 1, 'i', true)[1], 8);
  t.is(f.add([dt5, dt6, dt7], 0, 'X', true)[1], 5);
  t.is(f.add([dt5, dt6, dt8], 1, 'Y', true)[1], 9);
});

test('remove 1', t => {
  const f = new FlatTreeMiddleOut();
  t.is(f.add([], 0, 'a', true)[1], 0);
  t.is(f.add([], 2, 'd', true)[1], 1);

  const dt1 = f.add([], 1, 'DT 1!', false)[0];
  t.is(f.add([dt1], 0, 'b', true)[1], 1);
  t.is(f.add([dt1], 1, 'c', true)[1], 2);
  t.is(f.add([dt1], 1, 'X', true)[1], 2);

  t.is(f.remove([dt1], 1, true), 2);
});
