import test from 'ava';
import { Data, ToArrayTransformer } from '../src';
import { Pathifier } from '../src/pathifier';

test('flat 1', t => {
  const array: any[] = [];
  const data = new Data();
  const f = new Pathifier(data, new ToArrayTransformer(data, array));

  f.put(0, 'a');
  f.put(
    1,
    f.on('test.$').map(x => 'lol' + x)
  );

  data.set('test', ['b', 'c']);
  data.set('tast', { b: 'd', c: 'e' });
  console.log('array', array);
  t.pass();
});

// test('flat 2', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([0], 'a');
//   t.deepEqual(array, ['a']);
//   flatTransformer.addTo([2], 'd');
//   t.deepEqual(array, ['a', 'd']);
//   flatTransformer.addTo([1, 1], 'c');
//   t.deepEqual(array, ['a', 'c', 'd']);
//   flatTransformer.addTo([1, 0], 'b');
//   t.deepEqual(array, ['a', 'b', 'c', 'd']);
// });
//
// test('flat 3', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([1, 1], 'd');
//   t.deepEqual(array, ['d']);
//   flatTransformer.addTo([0, 1], 'c');
//   t.deepEqual(array, ['c', 'd']);
//   flatTransformer.addTo([0, 0], 'a');
//   t.deepEqual(array, ['a', 'c', 'd']);
//   flatTransformer.addTo([0, 1], 'b');
//   t.deepEqual(array, ['a', 'b', 'c', 'd']);
// });
//
// test('flat 4', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([2], 'c');
//   t.deepEqual(array, ['c']);
//   flatTransformer.addTo([1], 'b');
//   t.deepEqual(array, ['b', 'c']);
//   flatTransformer.addTo([3], 'd');
//   t.deepEqual(array, ['b', 'c', 'd']);
// });
//
// test('flat 5', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   const b = new DataTransformer(data, 'b');
//   const c = new DataTransformer(data, 'c');
//   b.init();
//   c.init();
//
//   flatTransformer.addTo([1, 0], b);
//   flatTransformer.addTo([1, 1], c);
//
//   flatTransformer.addTo([0], 'a');
//   t.deepEqual(array, ['a']);
//   flatTransformer.addTo([2], 'd');
//   t.deepEqual(array, ['a', 'd']);
//
//   data.set('b', 'b');
//   t.deepEqual(array, ['a', 'b', 'd']);
//   data.set('c', 'c');
//   t.deepEqual(array, ['a', 'b', 'c', 'd']);
// });
//
// function don(data: Data, path: string): BaseTransformer<any, any> {
//   const a = new DataTransformer(data, path);
//   a.root = a;
//   return a;
// }
//
// test('flat 6', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo(
//     [1],
//     don(data, 'a.$').map(l => l + 's')
//   );
//
//   flatTransformer.addTo([0], 'a');
//   t.deepEqual(array, ['a']);
//   flatTransformer.addTo([2], 'd');
//   t.deepEqual(array, ['a', 'd']);
//
//   data.set('a', ['lol']);
//   t.deepEqual(array, ['a', 'lols', 'd']);
// });
//
// test('flat 7', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo(
//     [1],
//     don(data, 'a.$').map(l => don(data, `b.${l}`))
//   );
//
//   flatTransformer.addTo([0], 'a');
//   t.deepEqual(array, ['a']);
//   flatTransformer.addTo([2], 'd');
//   t.deepEqual(array, ['a', 'd']);
//
//   data.set('b.lol', 'yeah');
//   data.set('a', ['lol']);
//   t.deepEqual(array, ['a', 'yeah', 'd']);
// });
//
// test('flat 8', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([0], ['a', ['b', 'c']]);
//   t.deepEqual(array, ['a', 'b', 'c']);
// });
//
// test('flat 9', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([1], don(data, 'a'));
//
//   flatTransformer.addTo([0], 'a');
//   t.deepEqual(array, ['a']);
//   flatTransformer.addTo([2], 'd');
//   t.deepEqual(array, ['a', 'd']);
//
//   data.set('a', 'yes');
//   t.deepEqual(array, ['a', 'yes', 'd']);
//   data.set('a', undefined);
//   t.deepEqual(array, ['a', 'd']);
// });
//
// test('flat 10', t => {
//   const array: any[] = [];
//   const data = new Data();
//
//   const flatTransformer = new FlatTransformer(data);
//   flatTransformer.toArray(array);
//
//   flatTransformer.addTo([0], 'a');
//
//   flatTransformer.addTo(
//     [1],
//     // don(data, 'a.$').map(l => [l, don(data, 'b.$')])
//     don(data, 'a.$').map(_ => don(data, 'b.$'))
//   );
//
//   flatTransformer.addTo([2], 'd');
//
//   console.log('  >HERE WE GO<');
//
//   // flatTransformer.init();
//
//   data.set('b', ['X', 'Y']);
//   // data.set('b.y', 'Y');
//
//   data.set('a', ['A', 'whatever this will not be printed :P']);
//
//   console.log('array', array);
//   // data.set('a', ['A', 'B']);
//
//   // Expect: a, A, X, Y, B, X, Y
//   // console.log(array);
//   // t.deepEqual(array, ['a', 'yeah', 'd']);
//
//   // data.set('a', undefined);
//   // t.deepEqual(array, ['a', 'd']);
//
//   flatTransformer.prant();
//
//   t.pass();
// });
//
// test('it', t => {
//   const data = new Data();
//   don(data, 'a.$')
//     .sort((a, b) => b.t.localeCompare(a.t))
//     .slice(0, 1)
//     .map(v => {
//       console.log('v', v);
//     })
//     .root?.init();
//   data.set('a', [{ t: 'a' }, { t: 'b' }, { t: 'c' }]);
//   t.pass();
// });
