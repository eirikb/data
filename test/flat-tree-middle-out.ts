import test from 'ava';
import { FlatTreeMiddleOut } from '../src/flat-tree-middle-out';

test('a', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
});

test('ab', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'b', true), 1);
});

test('ba', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([1], 'b', true), 0);
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
});

test('abc', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([2], 'c', true), 2);
});

test('abcd', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([2], 'c', true), 2);
  t.is(flatTreeMiddleOut.add([3], 'd', true), 3);
});

test('abdc', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([3], 'd', true), 2);
  t.is(flatTreeMiddleOut.add([2], 'c', true), 2);
});

test('tree 1', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'DT!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0], 'b', true), 1);
});

test('tree 2', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'DT!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([1, 1], 'c', true), 2);
  t.is(flatTreeMiddleOut.add([2], 'd', true), 3);
});

test('tree 3', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([1], 'DT!', false), null);
  t.is(flatTreeMiddleOut.add([2], 'd', true), 1);
  t.is(flatTreeMiddleOut.add([1, 0], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([1, 1], 'c', true), 2);
});

test('replace', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([0], 'b', true), 0);
});

test('tree 4', t => {
  const flatTreeMiddleOut = new FlatTreeMiddleOut();
  t.is(flatTreeMiddleOut.add([0], 'a', true), 0);
  t.is(flatTreeMiddleOut.add([3], 'd', true), 1);
  t.is(flatTreeMiddleOut.add([1], 'DT!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0], 'DT 2!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0, 0], 'DT 3!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0, 1], 'DT 4!', false), null);
  t.is(flatTreeMiddleOut.add([1, 0, 0, 0], 'b', true), 1);
  t.is(flatTreeMiddleOut.add([1, 0, 0, 1], 'c', true), 2);
  t.is(flatTreeMiddleOut.add([1, 0, 1, 0], 'd', true), 3);
  t.is(flatTreeMiddleOut.add([1, 0, 2], 'e', true), 4);
  t.is(flatTreeMiddleOut.add([2], 'DT 6!', false), null);
  t.is(flatTreeMiddleOut.add([2, 0], 'DT 7!', false), null);
  t.is(flatTreeMiddleOut.add([2, 0, 0], 'DT 8!', false), null);
  t.is(flatTreeMiddleOut.add([2, 0, 1], 'DT 9!', false), null);
  t.is(flatTreeMiddleOut.add([2, 0, 0, 0], 'f', true), 5);
  t.is(flatTreeMiddleOut.add([2, 0, 0, 1], 'g', true), 6);
  t.is(flatTreeMiddleOut.add([2, 0, 1, 0], 'h', true), 7);
  t.is(flatTreeMiddleOut.add([2, 0, 1, 1], 'i', true), 8);

  t.is(flatTreeMiddleOut.add([2, 0, 0, 0], 'X', true), 5);
  t.is(flatTreeMiddleOut.add([2, 0, 1, 1], 'Y', true), 9);
});
