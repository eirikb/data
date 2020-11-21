import test from 'ava';
import { Paths } from '../src/paths';

test('add static path', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: {},
      value: { ref: { ok: 1 } },
      path: 'a.b.c',
      fullPath: 'a.b.c',
    },
  ]);
});

test('add dynamic path', t => {
  const paths = new Paths();
  paths.add('a.$b.c', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: { $b: 'b' },
      value: { ref: { ok: 1 } },
      path: 'a.b.c',
      fullPath: 'a.b.c',
    },
  ]);
});

test('add multiple dynamic paths', t => {
  const paths = new Paths();
  const a = { ok: 1 };
  const b = {};
  paths.add('a.$x.c', 'ref', a);
  paths.add('a.$x.c', 'raf', a);
  paths.add('a.$y.c', 'ref', b);
  const res = paths.lookupByString('a.b.c');
  t.is(a, res[0].value.ref);
  t.is(b, res[1].value.ref);
  t.is(2, res.length);
});

test('dynamic paths exact match', t => {
  const paths = new Paths();
  paths.add('a.$x', 'ref', {});
  t.is(0, paths.lookupByString('a.b.c').length);
  t.is(0, paths.lookupByString('a').length);
  t.is(1, paths.lookupByString('a.b').length);
});

test('dynamic paths exact match 2', t => {
  const paths = new Paths();
  paths.add('a.$x.$y.b', 'ref', {});
  t.is(0, paths.lookupByString('a.b.c').length);
  t.is(0, paths.lookupByString('a').length);
  t.is(0, paths.lookupByString('a.b').length);
  t.is(0, paths.lookupByString('a.b.c').length);
  t.is(0, paths.lookupByString('a.b.c.d').length);
  t.is(0, paths.lookupByString('a.b.c.d.e').length);
  t.is(1, paths.lookupByString('a.b.c.b').length);
});

test('dynamic paths exact match 3', t => {
  const paths = new Paths();
  paths.add('a.$x.b.$y', 'ref', {});
  t.is(0, paths.lookupByString('a.b.c').length);
  t.is(0, paths.lookupByString('a').length);
  t.is(0, paths.lookupByString('a.b').length);
  t.is(0, paths.lookupByString('a.b.c').length);
  t.is(0, paths.lookupByString('a.b.c.d').length);
  t.is(0, paths.lookupByString('a.b.c.d.e').length);
  t.is(1, paths.lookupByString('a.b.b.e').length);
});

test('keys', t => {
  const paths = new Paths();
  paths.add('a.$x.y', 'ref', { ok: 1 });
  paths.add('a.$x.$y', 'ref', { ok: 2 });
  t.deepEqual(paths.lookupByString('a.b.y'), [
    {
      value: { ref: { ok: 2 } },
      keys: { $x: 'b', $y: 'y' },
      path: 'a.b.y',
      fullPath: 'a.b.y',
    },
    {
      value: { ref: { ok: 1 } },
      keys: { $x: 'b' },
      path: 'a.b.y',
      fullPath: 'a.b.y',
    },
  ]);
});

test('remove wildcard end', t => {
  const paths = new Paths();
  paths.add('a.*', 'ref', { ok: 1 });
  paths.remove('ref');
  t.pass();
});

test('multiple wildcard key end', t => {
  const paths = new Paths();
  paths.add('*.b.*.*', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a'), []);
  t.deepEqual(paths.lookupByString('a.b'), []);
  t.deepEqual(paths.lookupByString('a.b.c'), []);
  t.deepEqual(paths.lookupByString('a.b.c.d'), [
    {
      keys: {},
      value: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c.d',
    },
  ]);
});

test('recursive wildcard', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a'), []);
  t.deepEqual(paths.lookupByString('a.b'), [
    { keys: {}, value: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b' },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c'), [
    { keys: {}, value: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c' },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c.d'), [
    { keys: {}, value: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c.d' },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c.d.e'), [
    { keys: {}, value: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c.d.e' },
  ]);
});

test('recursive with named', t => {
  const paths = new Paths();
  paths.add('a.b.$c.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a'), []);
  t.deepEqual(paths.lookupByString('a.b'), []);
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: { $c: 'c' },
      value: { ref: { ok: 1 } },
      path: 'a.b.c',
      fullPath: 'a.b.c',
    },
  ]);
  t.deepEqual(paths.lookupByString('a.b.x.d'), [
    {
      keys: { $c: 'x' },
      value: { ref: { ok: 1 } },
      path: 'a.b.x',
      fullPath: 'a.b.x.d',
    },
  ]);
  t.deepEqual(paths.lookupByString('a.b.y.d.e'), [
    {
      keys: { $c: 'y' },
      value: { ref: { ok: 1 } },
      path: 'a.b.y',
      fullPath: 'a.b.y.d.e',
    },
  ]);
});

test('remove static path', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', {});
  t.is(paths.lookupByString('a.b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookupByString('a.b.c').length, 0);
});

test('remove static path but not all', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', {});
  paths.add('a.b.c', 'raf', {});
  t.is(Object.keys(paths.lookupByString('a.b.c')[0].value).length, 2);
  paths.remove('ref');
  t.is(Object.keys(paths.lookupByString('a.b.c')[0].value).length, 1);
});

test('remove $ path', t => {
  const paths = new Paths();
  paths.add('a.$b.c', 'ref', {});
  t.is(paths.lookupByString('a.$b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookupByString('a.$b.c').length, 0);
});

test('remove $$ path', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', 'yes');
  t.is(paths.lookupByString('a.b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookupByString('a.b.c').length, 0);
});

test('until star', t => {
  const paths = new Paths();
  paths.add('a.b.*', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: {},
      value: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('until star with wildcard', t => {
  const paths = new Paths();
  paths.add('a.$b.*', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: { $b: 'b' },
      value: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('until recursive wildcard', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: {},
      value: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('recursive wildcard and wildcard', t => {
  const paths = new Paths();
  paths.add('a.*.**', 'ref', {});
  t.deepEqual(paths.lookupByString('a'), []);
  t.deepEqual(paths.lookupByString('a.b'), [
    {
      keys: {},
      path: 'a',
      value: { ref: {} },
      fullPath: 'a.b',
    },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c'), [
    {
      keys: {},
      path: 'a',
      value: { ref: {} },
      fullPath: 'a.b.c',
    },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c.d'), [
    {
      keys: {},
      path: 'a',
      value: { ref: {} },
      fullPath: 'a.b.c.d',
    },
  ]);
  t.deepEqual(paths.lookupByString('a.b.c.d.e'), [
    {
      keys: {},
      path: 'a',
      value: { ref: {} },
      fullPath: 'a.b.c.d.e',
    },
  ]);
});

test('Recursive wildcard and named wildcard combined', t => {
  const paths = new Paths();
  paths.add('test.**', 'a', {});
  paths.add('test.$id', 'b', {});
  t.deepEqual(paths.lookupByString('test.a'), [
    { keys: {}, path: 'test', value: { a: {} }, fullPath: 'test.a' },
    {
      keys: { $id: 'a' },
      path: 'test.a',
      value: { b: {} },
      fullPath: 'test.a',
    },
  ]);
});

test('Recursive wildcard plus static', t => {
  const paths = new Paths();
  paths.add('a.**', 'a', 'yes');
  paths.add('a.b', 'b', 'no');

  t.deepEqual(paths.lookupByString('a.b'), [
    { keys: {}, path: 'a', value: { a: 'yes' }, fullPath: 'a.b' },
    { keys: {}, path: 'a.b', value: { b: 'no' }, fullPath: 'a.b' },
  ]);
});
