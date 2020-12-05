import test from 'ava';
import { Pathifier2 } from '../src/pathifier2';
import { Data, Stower, StowerTransformer } from '../src';

function stower2(path: string) {
  const data = new Data();
  const transformer = new StowerTransformer();
  const pathifier = new Pathifier2(data, path, transformer);
  pathifier.init();
  const array: any[] = [];
  transformer.stower = new (class implements Stower {
    add(value: any, _index: number, subIndex?: number, _path?: string): void {
      array.splice(subIndex!, 0, value);
    }

    or(_index: number, _or: any): void {}

    remove(
      _value: any,
      _index: number,
      subIndex?: number,
      _path?: string
    ): void {
      array.splice(subIndex!, 1);
    }
  })();
  return {
    data,
    array,
    pathifier,
  };
}

test('no', t => {
  const { array, data } = stower2('a.$y');

  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
});

test('map add', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a.b', '1');
  t.deepEqual(array, [3]);
});

test('map add 2', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, [3, 4]);
});

test('map update', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.set('a.b', '3');
  t.deepEqual(array, [5, 4]);
});

test('map remove', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.unset('a.b');
  t.deepEqual(array, [4]);
});

test('sort', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
});

test('sort update', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
  data.set('a.b', '3');
  t.deepEqual(array, ['3', '2']);
});

test('sort and map', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a)).map(v => Number(v) + 1);

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, [3, 2]);
});

test('map and sort', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(v => `${Number(v) + 1}`).sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['3', '2']);
});

test('map add remove update', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(v => v);

  data.set('a', {
    b: 'b1',
    c: 'c1',
    d: 'd1',
  });
  data.unset('a.c');
  data.set('a.c', 'c2');
  data.set('a.d', 'd2');
  t.deepEqual(array, ['b1', 'd2', 'c2']);
});

test('map add remove update 2', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => a.localeCompare(b)).map(v => v);

  data.set('a', {
    b: 'b1',
    c: 'c1',
    d: 'd1',
  });
  data.unset('a.c');
  data.set('a.c', 'c2');
  data.set('a.d', 'd2');
  t.deepEqual(array, ['b1', 'c2', 'd2']);
});

test('map add remove update 3', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(v => v);

  data.set('a', {
    b: 'b1',
    c: 'c1',
  });
  data.unset('a.b');
  data.set('a.c', 'c2');
  t.deepEqual(array, ['c2']);
});

test('slice', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.slice(0, 1);

  data.set('a', {
    b: 'b',
    c: 'c',
  });
  t.deepEqual(array, ['b']);
});

test('slice 2', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.slice(1, 3);

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['c', 'd']);
});

test('sort and slice', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a)).slice(1, 3);

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['d', 'c']);
});

test('mapOn', t => {
  const { array, data, pathifier } = stower2('a.$y');
  pathifier.mapOn('test', (value, { onValue }) => {
    if (onValue === 'ing') return 'ting';
    return value;
  });
  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
  data.set('test', 'ing');
  t.deepEqual(array, ['ting']);
});

test('sortOn', t => {
  const { array, data, pathifier } = stower2('a.$y');
  pathifier.sortOn('test', (a, b, { onValue }) => {
    if (onValue) {
      return b.localeCompare(a);
    }
    return a.localeCompare(b);
  });
  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['1', '2']);
  data.set('test', true);
  t.deepEqual(array, ['2', '1']);
  data.set('test', false);
  t.deepEqual(array, ['1', '2']);
});

test('sliceOn', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sliceOn('test.*', value => value);

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['b', 'c', 'd', 'e']);
  data.set('test', [1, 3]);
  t.deepEqual(array, ['c', 'd']);
  data.set('test', [0, 3]);
  t.deepEqual(array, ['b', 'c', 'd']);
  data.set('test', [1, 4]);
  t.deepEqual(array, ['c', 'd', 'e']);
});

test('filter', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.filter(value => value !== 'c');

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['b', 'd', 'e']);
});

test('filterOn', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.filterOn('test', (value, { onValue }) => value !== onValue);

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['b', 'c', 'd', 'e']);
  data.set('test', 'c');
  t.deepEqual(array, ['b', 'd', 'e']);
  data.set('test', 'e');
  t.deepEqual(array, ['b', 'c', 'd']);
});

test('no output no fail', t => {
  const { data } = stower2('a.$');
  data.set('users.a.name', 'no fail');
  t.pass();
});

test('then before', t => {
  const { array, data } = stower2('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
});

test('then unset', t => {
  const { array, data } = stower2('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
  data.unset('users.b');
  t.deepEqual(array, [{ name: 'a' }]);
});

// test('then not called for outfiltered data', t => {
//   t.plan(4);
//
//   const data = new Data();
//   data
//     .on('users')
//     .filter(user => user.name === 'a')
//     .then((users, { path, fullPath, subPath }) => {
//       t.is(path, 'users');
//       t.is(fullPath, 'users.a.name');
//       t.is(subPath, 'a.name');
//       t.deepEqual({ a: { name: 'a' } }, users);
//     });
//   data.set('users.a.name', 'a');
//   data.set('users.b.name', 'b');
// });
//
// test('to before ', t => {
//   const data = new Data();
//   data.on('users').to('yes');
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, data.get('yes'));
// });
//
// test('to after', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data.on('users').to('yes');
//   t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, data.get('yes'));
// });
//
// test('to sub-path', t => {
//   const data = new Data();
//   data.on('users').to('yes');
//   data.set('users.a.name', 'b');
//   t.deepEqual({ a: { name: 'b' } }, data.get('yes'));
// });
//
// test('to filter', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data
//     .on('users.*')
//     .filter(u => u.name !== 'b')
//     .to('yes');
//   data.set('users.c.name', 'c');
//   t.deepEqual({ a: { name: 'a' }, c: { name: 'c' } }, data.get('yes'));
// });
//
// test('to map', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data
//     .on('users.*')
//     .map(user => ({ wat: user.name }))
//     .to('yes');
//   data.set('users.c.name', 'c');
//   t.deepEqual(
//     { a: { wat: 'a' }, b: { wat: 'b' }, c: { wat: 'c' } },
//     data.get('yes')
//   );
// });
//
// test('to map called on parent of eh thingy', t => {
//   const data = new Data();
//   data
//     .on('users')
//     .map(user => ({ wat: user.name }))
//     .to('yes');
//   data.set('users.c.name', 'c');
//   t.deepEqual({ c: { wat: 'c' } }, data.get('yes'));
// });
//
// test('to map and filter', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data
//     .on('users.*')
//     .map(u => ({ wat: u.name }))
//     .filter(u => u.name !== 'b')
//     .to('yes');
//   data.set('users.c.name', 'c');
//   t.deepEqual({ a: { wat: 'a' }, c: { wat: 'c' } }, data.get('yes'));
// });
//
// test('filterOn after', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data
//     .on('users.*')
//     .filterOn('filter', (f, u) => u.name === f)
//     .to('yes');
//   data.set('users.c.name', 'c');
//   data.set('filter', 'b');
//   t.deepEqual({ b: { name: 'b' } }, data.get('yes'));
// });
//
// test('filterOn before', t => {
//   const data = new Data();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data.set('filter', 'b');
//   data
//     .on('users.*')
//     .filterOn('filter', (f, u) => u.name === f)
//     .to('yes');
//   data.set('users.c.name', 'c');
//   t.deepEqual({ b: { name: 'b' } }, data.get('yes'));
//   data.set('filter', 'a');
//   t.deepEqual({ a: { name: 'a' } }, data.get('yes'));
// });
//
// test('only one filter, unfortunately', t => {
//   const data = new Data();
//   t.throws(() =>
//     data
//       .on('users')
//       .filter(() => true)
//       .filterOn('', () => true)
//   );
//   t.throws(() =>
//     data
//       .on('users')
//       .filter(() => true)
//       .filter(() => true)
//   );
// });
//
// test('only one sort, unfortunately', t => {
//   const data = new Data();
//   t.throws(() =>
//     data
//       .on('users')
//       .sort(() => 0)
//       .sortOn('', () => 0)
//   );
//   t.throws(() =>
//     data
//       .on('users')
//       .sort(() => 0)
//       .sort(() => 0)
//   );
// });
//
// test('only one map, unfortunately', t => {
//   const data = new Data();
//   t.throws(() =>
//     data
//       .on('users')
//       .map(() => true)
//       .map(() => true)
//   );
// });
//
// test('only one to, unfortunately', t => {
//   const data = new Data();
//   t.throws(() =>
//     data
//       .on('users')
//       .to('a')
//       .to('a')
//   );
// });
//
// test('only one array, unfortunately', t => {
//   const data = new Data();
//   t.throws(() =>
//     data
//       .on('users')
//       .toArray({} as Stower)
//       .toArray({} as Stower)
//   );
// });
//
// test('toArray initial before', t => {
//   const data = new Data();
//   const { res, toArray } = stower();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data.on('users').toArray(toArray());
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 1, path: 'b' },
//   ]);
// });
//
// test('toArray initial after', t => {
//   const data = new Data();
//   const { res, toArray } = stower();
//   data.on('users').toArray(toArray());
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 1, path: 'b' },
//   ]);
// });
//
// test('toArray add', t => {
//   const data = new Data();
//   const { res, toArray, reset } = stower();
//   data.on('users.*').toArray(toArray());
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 1, path: 'b' },
//   ]);
//   reset();
//   data.set('users.c.name', 'c');
//   t.deepEqual(res, [{ t: 'add', index: 2, path: 'c' }]);
// });
//
// test('toArray remove', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower();
//   data.on('users.*').toArray(toArray());
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//     c: { name: 'c' },
//   });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 1, path: 'b' },
//     { t: 'add', index: 2, path: 'c' },
//   ]);
//   reset();
//   data.unset('users.b');
//   t.deepEqual(res, [{ t: 'remove', index: 1, path: 'b' }]);
// });
//
// test('sort', t => {
//   const data = new Data();
//   const { res, toArray } = stower();
//   data.set('users', {
//     a: { name: 'a' },
//     b: { name: 'b' },
//   });
//   data
//     .on('users')
//     .sort((a, b) => b.name.localeCompare(a.name))
//     .toArray(toArray());
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 0, path: 'b' },
//   ]);
// });
//
// test('Update filterOn on update after data is set', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower();
//   data
//     .on('users')
//     .map(user => user)
//     .filterOn('test', (filter, user) => new RegExp(filter, 'i').test(user))
//     .toArray(toArray());
//   data.set('test', '');
//   data.set('users', { a: 'a', b: 'b' });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'a' },
//     { t: 'add', index: 1, path: 'b' },
//   ]);
//   reset();
//   data.set('test', 'b');
//   t.deepEqual(res, [
//     { t: 'remove', index: 1, path: 'b' },
//     { t: 'add', index: 1, path: 'b' },
//     { t: 'remove', index: 0, path: 'a' },
//   ]);
// });
//
// test('filterOn and back', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower();
//   data
//     .on('users')
//     .map(user => user.name)
//     .filterOn('test', (filter, user) => new RegExp(filter, 'i').test(user.name))
//     .toArray(toArray());
//
//   data.set('test', '');
//   data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'one' },
//     { t: 'add', index: 1, path: 'two' },
//   ]);
//   reset();
//
//   data.set('test', 'two');
//   t.deepEqual(res, [
//     { t: 'remove', index: 1, path: 'two' },
//     { t: 'add', index: 1, path: 'two' },
//     { t: 'remove', index: 0, path: 'one' },
//   ]);
//   reset();
//
//   data.set('test', '');
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: 'one' },
//     { t: 'remove', index: 1, path: 'two' },
//     { t: 'add', index: 1, path: 'two' },
//   ]);
//   t.pass();
// });
//
// test('on sortOn - custom order update', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower();
//
//   data
//     .on('players.*')
//     .map(player => player.name)
//     .sortOn('test', (_, a, b) => b.name.localeCompare(a.name))
//     .toArray(toArray());
//
//   data.set('players.1', { name: '1' });
//   data.set('players.2', { name: '2' });
//   data.set('players.3', { name: '3' });
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: '1' },
//     { t: 'add', index: 0, path: '2' },
//     { t: 'add', index: 0, path: '3' },
//   ]);
//   reset();
//   data.set('test', 'yes');
//   reset();
//
//   data.unset('players.1');
//   t.deepEqual(res, [{ t: 'remove', index: 2, path: '1' }]);
//   reset();
//
//   data.set('players.1', { name: '7' });
//   t.deepEqual(res, [{ t: 'add', index: 0, path: '1' }]);
// });
//
// test('Pathifier no sub-array', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower('index', 'path');
//   data
//     .on('players.*')
//     .map(p => p.name)
//     .toArray(toArray());
//   data.set('players', [{ name: 'a' }, { name: 'b' }]);
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: '0' },
//     { t: 'add', index: 1, path: '1' },
//   ]);
//   reset();
//   data.set('players', [{ name: 'a' }]);
//   t.deepEqual(res, [
//     { t: 'remove', index: 0, path: '0' },
//     { t: 'add', index: 0, path: '0' },
//     { t: 'remove', index: 1, path: '1' },
//   ]);
// });
//
// test('Pathifier sub-array', t => {
//   const data = new Data();
//   const { res, reset, toArray } = stower('index', 'path');
//   data
//     .on('players.*')
//     .map(p => p.name)
//     .toArray(toArray());
//   data.set('players', [{ name: 'a' }, { name: 'b' }]);
//   t.deepEqual(res, [
//     { t: 'add', index: 0, path: '0' },
//     { t: 'add', index: 1, path: '1' },
//   ]);
//   reset();
//   data.set('players', [{ name: 'a', x: [1] }]);
//   t.deepEqual(res, [
//     { t: 'remove', index: 0, path: '0' },
//     { t: 'add', index: 0, path: '0' },
//     { t: 'remove', index: 1, path: '1' },
//   ]);
// });
//
// test('map has path', t => {
//   const data = new Data();
//   const { reset, toArray } = stower('index', 'path');
//   let res: any[] = [];
//   data
//     .on('players.*')
//     .map((p, { path }) => {
//       res.push(path);
//       return p.name;
//     })
//     .toArray(toArray());
//   data.set('players', [{ name: 'a' }, { name: 'b' }]);
//   t.deepEqual(res, ['players.0', 'players.1']);
//   reset();
//   res = [];
//   data.set('players', [{ name: 'a', x: [1] }]);
//   t.deepEqual(res, ['players.0']);
// });
