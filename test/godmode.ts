import test from 'ava';
import { ToArrayTransformer } from '../src/transformers';
import { GodMode } from '../src/godmode';
import { Pathifier } from '../src/pathifier';
import { Data } from '../src/data';

interface Stuff {
  test: string[];
}

interface Stuff2 {
  test: string[];
  tast: { [key: string]: string };
}

interface A {
  t: string;
}

test('flat 1', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff>(d, { test: [] });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => 'lol' + x)
  );

  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'lolb', 'lolc']);
});

test('flat 2', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => [x, g.don(`tast.${x}`)])
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Y']);
});

test('flat 3', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => [x, g.don(`tast.${x}`)])
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  g.data.tast.c = 'Z';
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Z']);
});

test('flat 5', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => g.don(`tast.${x}`))
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'X', 'Y']);
  g.data.tast.c = 'Z';
  t.deepEqual(array, ['a', 'X', 'Z']);
});

test('flat 6', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff>(d, { test: [] });

  f.put(
    1,
    d.don('test.$').map(l => l + 's')
  );
  t.deepEqual(array, []);

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);
  g.data.test = ['lol'];
  t.deepEqual(array, ['a', 'lols', 'd']);
});

test('flat 7', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{
    a: string[];
    b: { [key: string]: string };
  }>(d, { a: [], b: {} });

  f.put(
    1,
    g.don('a.$').map(l => g.don(`b.${l}`))
  );
  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  g.data.b.lol = 'yeah';
  g.data.a = ['lol'];
  t.deepEqual(array, ['a', 'yeah', 'd']);
});

test('flat 9', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a?: string }>(d, {});

  f.put(1, g.don('a'));

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  g.data.a = 'yes';
  t.deepEqual(array, ['a', 'yes', 'd']);
  g.data.a = undefined;
  t.deepEqual(array, ['a', 'd']);
});

test('flat 10', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a?: string[]; b: string[] }>(d, { a: [], b: [] });

  f.put(0, 'a');

  f.put(
    1,
    g.don('a.$').map(_ => g.don('b.$'))
  );

  f.put(2, 'd');

  g.data.b = ['X', 'Y'];
  g.data.a = ['A', 'whatever this will not be printed :P'];

  t.deepEqual(array, ['a', 'X', 'Y', 'X', 'Y', 'd']);
  g.data.a = undefined;
  t.deepEqual(array, ['a', 'd']);
});

test('it', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a: A[] }>(d, { a: [] });

  f.put(
    0,
    g
      .don(g.path().a.$)
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  g.data.a = [{ t: 'a' }, { t: 'b' }, { t: 'c' }];
  t.deepEqual(array, ['c', 'b']);
});

test('stop start', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a: A[] }>(d, { a: [] });

  f.put(
    0,
    g
      .don(g.path().a.$)
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  f.stop();
  g.data.a = [{ t: 'a' }, { t: 'b' }, { t: 'c' }];
  t.deepEqual(array, []);
  f.start();
  t.deepEqual(array, ['c', 'b']);
});
