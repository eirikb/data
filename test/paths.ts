import test from 'ava';
import Paths from '../src/paths';

test('add static path', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: {},
      _: { ref: { ok: 1 } },
      path: 'a.b.c',
      fullPath: 'a.b.c',
    },
  ]);
});

test('add dynamic path', t => {
  const paths = new Paths();
  paths.add('a.$b.c', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: { $b: 'b' },
      _: { ref: { ok: 1 } },
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
  const res = paths.lookup('a.b.c');
  t.is(a, res[0]._.ref);
  t.is(b, res[1]._.ref);
  t.is(2, res.length);
});

test('dynamic paths exact match', t => {
  const paths = new Paths();
  paths.add('a.$x', 'ref', {});
  t.is(0, paths.lookup('a.b.c').length);
  t.is(0, paths.lookup('a').length);
  t.is(1, paths.lookup('a.b').length);
});

test('dynamic paths exact match 2', t => {
  const paths = new Paths();
  paths.add('a.$x.$y.b', 'ref', {});
  t.is(0, paths.lookup('a.b.c').length);
  t.is(0, paths.lookup('a').length);
  t.is(0, paths.lookup('a.b').length);
  t.is(0, paths.lookup('a.b.c').length);
  t.is(0, paths.lookup('a.b.c.d').length);
  t.is(0, paths.lookup('a.b.c.d.e').length);
  t.is(1, paths.lookup('a.b.c.b').length);
});

test('dynamic paths exact match 3', t => {
  const paths = new Paths();
  paths.add('a.$x.b.$y', 'ref', {});
  t.is(0, paths.lookup('a.b.c').length);
  t.is(0, paths.lookup('a').length);
  t.is(0, paths.lookup('a.b').length);
  t.is(0, paths.lookup('a.b.c').length);
  t.is(0, paths.lookup('a.b.c.d').length);
  t.is(0, paths.lookup('a.b.c.d.e').length);
  t.is(1, paths.lookup('a.b.b.e').length);
});

test('keys', t => {
  const paths = new Paths();
  paths.add('a.$x.y', 'ref', { ok: 1 });
  paths.add('a.$x.$y', 'ref', { ok: 2 });
  t.deepEqual(paths.lookup('a.b.y'), [
    {
      _: { ref: { ok: 2 } },
      keys: { $x: 'b', $y: 'y' },
      path: 'a.b.y',
      fullPath: 'a.b.y',
    },
    {
      _: { ref: { ok: 1 } },
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
  t.deepEqual(paths.lookup('a'), []);
  t.deepEqual(paths.lookup('a.b'), []);
  t.deepEqual(paths.lookup('a.b.c'), []);
  t.deepEqual(paths.lookup('a.b.c.d'), [
    {
      keys: {},
      _: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c.d',
    },
  ]);
});

test('recursive wildcard', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a'), []);
  t.deepEqual(paths.lookup('a.b'), [
    { keys: {}, _: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b' },
  ]);
  t.deepEqual(paths.lookup('a.b.c'), [
    { keys: {}, _: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c' },
  ]);
  t.deepEqual(paths.lookup('a.b.c.d'), [
    { keys: {}, _: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c.d' },
  ]);
  t.deepEqual(paths.lookup('a.b.c.d.e'), [
    { keys: {}, _: { ref: { ok: 1 } }, path: 'a.b', fullPath: 'a.b.c.d.e' },
  ]);
});

test('recursive with named', t => {
  const paths = new Paths();
  paths.add('a.b.$c.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a'), []);
  t.deepEqual(paths.lookup('a.b'), []);
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: { $c: 'c' },
      _: { ref: { ok: 1 } },
      path: 'a.b.c',
      fullPath: 'a.b.c',
    },
  ]);
  t.deepEqual(paths.lookup('a.b.x.d'), [
    {
      keys: { $c: 'x' },
      _: { ref: { ok: 1 } },
      path: 'a.b.x',
      fullPath: 'a.b.x.d',
    },
  ]);
  t.deepEqual(paths.lookup('a.b.y.d.e'), [
    {
      keys: { $c: 'y' },
      _: { ref: { ok: 1 } },
      path: 'a.b.y',
      fullPath: 'a.b.y.d.e',
    },
  ]);
});

test('remove static path', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', {});
  t.is(paths.lookup('a.b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookup('a.b.c').length, 0);
});

test('remove static path but not all', t => {
  const paths = new Paths();
  paths.add('a.b.c', 'ref', {});
  paths.add('a.b.c', 'raf', {});
  t.is(Object.keys(paths.lookup('a.b.c')[0]._).length, 2);
  paths.remove('ref');
  t.is(Object.keys(paths.lookup('a.b.c')[0]._).length, 1);
});

test('remove $ path', t => {
  const paths = new Paths();
  paths.add('a.$b.c', 'ref', {});
  t.is(paths.lookup('a.$b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookup('a.$b.c').length, 0);
});

test('remove $$ path', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', {});
  t.is(paths.lookup('a.b.c').length, 1);
  paths.remove('ref');
  t.is(paths.lookup('a.b.c').length, 0);
});

test('until star', t => {
  const paths = new Paths();
  paths.add('a.b.*', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: {},
      _: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('until star with wildcard', t => {
  const paths = new Paths();
  paths.add('a.$b.*', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: { $b: 'b' },
      _: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('until recursive wildcard', t => {
  const paths = new Paths();
  paths.add('a.b.**', 'ref', { ok: 1 });
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: {},
      _: { ref: { ok: 1 } },
      path: 'a.b',
      fullPath: 'a.b.c',
    },
  ]);
});

test('recursive wildcard and wildcard', t => {
  const paths = new Paths();
  paths.add('a.*.**', 'ref', {});
  t.deepEqual(paths.lookup('a'), []);
  t.deepEqual(paths.lookup('a.b'), [
    {
      keys: {},
      path: 'a',
      _: { ref: {} },
      fullPath: 'a.b',
    },
  ]);
  t.deepEqual(paths.lookup('a.b.c'), [
    {
      keys: {},
      path: 'a',
      _: { ref: {} },
      fullPath: 'a.b.c',
    },
  ]);
  t.deepEqual(paths.lookup('a.b.c.d'), [
    {
      keys: {},
      path: 'a',
      _: { ref: {} },
      fullPath: 'a.b.c.d',
    },
  ]);
  t.deepEqual(paths.lookup('a.b.c.d.e'), [
    {
      keys: {},
      path: 'a',
      _: { ref: {} },
      fullPath: 'a.b.c.d.e',
    },
  ]);
});

test('Recursive wildcard and named wildcard combined', t => {
  const paths = new Paths();
  paths.add('test.**', 'a', {});
  paths.add('test.$id', 'b', {});
  t.deepEqual(paths.lookup('test.a'), [
    { keys: { $id: 'a' }, path: 'test.a', _: { b: {} }, fullPath: 'test.a' },
    { keys: {}, path: 'test', _: { a: {} }, fullPath: 'test.a' },
  ]);
});
