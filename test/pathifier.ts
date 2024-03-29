import test from 'ava';
import { Data } from '../src/data';
import { ToArrayTransformer } from '../src/transformers';
import { Pathifier } from '../src/pathifier';
import { GodMode } from '../src';

test('flat 1', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  f.put(
    1,
    data.don('test.$').map(x => 'lol' + x)
  );

  data.set('test', ['b', 'c']);
  t.deepEqual(array, ['a', 'lolb', 'lolc']);
});

test('flat 2', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  f.put(
    1,
    data.don('test.$').map(x => [x, data.don(`tast.${x}`)])
  );

  data.set('tast', { b: 'X', c: 'Y' });
  data.set('test', ['b', 'c']);
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Y']);
});

test('flat 3', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  f.put(
    1,
    data.don('test.$').map(x => [x, data.don(`tast.${x}`)])
  );

  data.set('tast', { b: 'X', c: 'Y' });
  data.set('test', ['b', 'c']);
  data.set('tast.c', 'Z');
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Z']);
});

test('flat 4', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);
  f.put(1, ['b', 'c']);
  t.deepEqual(array, ['a', 'b', 'c', 'd']);
});

test('flat 5', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  f.put(
    1,
    data.don('test.$').map(x => data.don(`tast.${x}`))
  );

  data.set('tast', { b: 'X', c: 'Y' });
  data.set('test', ['b', 'c']);
  t.deepEqual(array, ['a', 'X', 'Y']);
  data.set('tast.c', 'Z');
  t.deepEqual(array, ['a', 'X', 'Z']);
});

test('flat 6', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(
    1,
    data.don('a.$').map(l => l + 's')
  );
  t.deepEqual(array, []);

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);
  data.set('a', ['lol']);
  t.deepEqual(array, ['a', 'lols', 'd']);
});

test('flat 7', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(
    1,
    data.don('a.$').map(l => data.don(`b.${l}`))
  );
  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  data.set('b.lol', 'yeah');
  data.set('a', ['lol']);
  t.deepEqual(array, ['a', 'yeah', 'd']);
});

test('flat 8', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, ['a', ['b', 'c']]);
  t.deepEqual(array, ['a', 'b', 'c']);
});

test('flat 9', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(1, data.don('a'));

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  data.set('a', 'yes');
  t.deepEqual(array, ['a', 'yes', 'd']);
  data.set('a', undefined);
  t.deepEqual(array, ['a', 'd']);
});

test('flat 10', t => {
  const array: any[] = [];
  const data = new Data();

  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');

  f.put(
    1,
    data.don('a.$').map(_ => data.don('b.$'))
  );

  f.put(2, 'd');

  data.set('b', ['X', 'Y']);

  data.set('a', ['A', 'whatever this will not be printed :P']);

  t.deepEqual(array, ['a', 'X', 'Y', 'X', 'Y', 'd']);
  data.set('a', undefined);
  t.deepEqual(array, ['a', 'd']);
});

test('it', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(
    0,
    data
      .don('a.$')
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  data.set('a', [{ t: 'a' }, { t: 'b' }, { t: 'c' }]);
  t.deepEqual(array, ['c', 'b']);
});

test('stop start', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(
    0,
    data
      .don('a.$')
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  f.stop();
  data.set('a', [{ t: 'a' }, { t: 'b' }, { t: 'c' }]);
  t.deepEqual(array, []);
  f.start();
  t.deepEqual(array, ['c', 'b']);
});

test('Wildcard', async t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));
  f.put(0, data.don('x.*'));
  data.set('x', ['a']);
  t.deepEqual(array, ['a']);
  data.set('x', ['b']);
  t.deepEqual(array, ['b']);
});

test('Wildcard with godmode', async t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));
  const g = new GodMode(data, {});
  f.put(0, g.don('x.*'));
  data.set('x', ['a']);
  t.deepEqual(array, ['a']);
  data.set('x', ['b']);
  t.deepEqual(array, ['b']);
});
