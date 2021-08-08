import test from 'ava';
// import { Pathifier } from '../src/pathifier';
import { Data, DataTransformer } from '../src';

// function createTransformer(array: any[] = []) {
// return new (class implements Transformer {
//   entries: Entries = new Entries();
//
//   add(index: number, entry: Entry): void {
//     array.splice(index, 0, entry.value);
//   }
//
//   on(_: any, __: ListenerCallbackOptions): void {}
//
//   remove(index: number, _: Entry): void {
//     array.splice(index, 1);
//   }
//
//   update(oldIndex: number, index: number, entry: Entry): void {
//     this.remove(oldIndex, entry);
//     this.add(index, entry);
//   }
// })();
// const plain = new PlainTransformer();
// plain.toArray(array);
// return plain;
// }

// function createPathifier(data: Data, path: string, array: any[] = []) {
// const pathifier = new Pathifier(data, path);
// pathifier.transformer = createTransformer(array);
// return { array, pathifier };
// }

// function dataAndPathifier() {
//   // const data = new Data();
//   // const { array, pathifier } = createPathifier(data, path);
//   // return {
//   //   data,
//   //   array,
//   //   pathifier,
//   // };
//   const array: any[] = [];
//   const pathifier = new PlainTransformer();
//   const data = new Data();
//   return { array, data, pathifier };
// }

function setup<T>(path: string) {
  const data = new Data();
  const transformer = new DataTransformer<T>(data, path);
  const array: any[] = [];
  return { data, transformer, array };
}

function dataAndPathifier<T = any>(path: string) {
  const { data, transformer, array } = setup<T>(path);
  return { data, pathifier: transformer, array };
}

test('no', t => {
  const { data, transformer, array } = setup('a.$y');
  transformer.toArray(array);
  transformer.init();

  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
});

test('map add', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');
  pathifier
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  pathifier.init();
  data.set('a.b', '1');
  t.deepEqual(array, [3]);
});

test('map add 2', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  pathifier.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  console.log(array);
  t.deepEqual(array, [3, 4]);
});

test('map add 3', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  data.set('a', {
    b: '1',
    c: '2',
  });
  pathifier.init();
  t.deepEqual(array, [3, 4]);
});

test('map update', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  pathifier.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.set('a.b', '3');
  t.deepEqual(array, [5, 4]);
});

test('map remove', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  pathifier.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.unset('a.b');
  t.deepEqual(array, [4]);
});

test('unset', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$');
  pathifier.toArray(array);
  pathifier.init();

  data.set('a.b', 'ok');
  t.deepEqual(array, ['ok']);
  data.unset('a.b');
  t.deepEqual(array, []);
});

test('sort', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a)).toArray(array);
  pathifier.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
});

test('sort update', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a)).toArray(array);
  pathifier.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
  data.set('a.b', '3');
  t.deepEqual(array, ['3', '2']);
});

test('sort and map', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .sort((a, b) => b.localeCompare(a))
    .map(v => Number(v) + 1)
    .toArray(array);
  pathifier.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, [3, 2]);
});

test('map and sort', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .map(v => `${Number(v) + 1}`)
    .sort((a, b) => b.localeCompare(a))
    .toArray(array);
  pathifier.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['3', '2']);
});

test('map add remove update', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.map(v => v).toArray(array);
  pathifier.init();

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
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .sort((a, b) => a.localeCompare(b))
    .map(v => v)
    .toArray(array);
  pathifier.init();

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
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.map(v => v).toArray(array);
  pathifier.init();

  data.set('a', {
    b: 'b1',
    c: 'c1',
  });
  data.unset('a.b');
  data.set('a.c', 'c2');
  t.deepEqual(array, ['c2']);
});

test('slice', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.slice(0, 1).toArray(array);
  pathifier.init();

  data.set('a', {
    b: 'b',
    c: 'c',
  });
  t.deepEqual(array, ['b']);
});

test('slice 2', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.slice(1, 3).toArray(array);
  pathifier.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['c', 'd']);
});

test('sort and slice', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .sort((a, b) => b.localeCompare(a))
    .slice(1, 3)
    .toArray(array);
  pathifier.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['d', 'c']);
});

test('mapOn', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');
  pathifier
    .mapOn('test', (value, { onValue }) => {
      if (onValue === 'ing') return 'ting';
      return value;
    })
    .toArray(array);
  pathifier.init();
  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
  data.set('test', 'ing');
  t.deepEqual(array, ['ting']);
});

test('sortOn', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');
  pathifier
    .sortOn('test', (a, b, { onValue }) => {
      if (onValue) {
        return b.localeCompare(a);
      }
      return a.localeCompare(b);
    })
    .toArray(array);
  pathifier.init();
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
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.sliceOn('test.*', value => value).toArray(array);
  pathifier.init();

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
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier.filter(value => value !== 'c').toArray(array);
  pathifier.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['b', 'd', 'e']);
});

test('filterOn', t => {
  const { array, data, pathifier } = dataAndPathifier('a.$y');

  pathifier
    .filterOn('test', (value, { onValue }) => {
      console.log('vaæue', value, 'onValue', onValue);
      return value !== onValue;
    })
    .toArray(array);
  pathifier.init();

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
  const { data } = dataAndPathifier('a.$');
  data.set('users.a.name', 'no fail');
  t.pass();
});

test('then before', t => {
  const { array, data, pathifier } = dataAndPathifier('users.$');
  pathifier.toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
});

test('then unset', t => {
  const { array, data, pathifier } = dataAndPathifier('users.$');
  pathifier.toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
  data.unset('users.b');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('then not called for outfiltered data', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier.filter(user => user.name === 'a').toArray(array);
  pathifier.init();
  data.set('users.a.name', 'a');
  t.deepEqual(array, [{ name: 'a' }]);
  data.set('users.b.name', 'b');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('then not called for outfiltered data 2', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$.*');

  pathifier.filter(user => user.name === 'a').toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a', k: 1 },
    b: { name: 'b', k: 2 },
  });
  t.deepEqual(array, [{ name: 'a', k: 1 }]);
  data.set('users.b.name', 'a');
  t.deepEqual(array, [
    { name: 'a', k: 1 },
    { name: 'a', k: 2 },
  ]);
});

test('to filter', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier.filter(u => u.name !== 'b').toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ name: 'a' }, { name: 'c' }]);
});

test('to filter 2', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  pathifier.filter(u => u.name !== 'b').toArray(array);
  pathifier.init();

  t.deepEqual(array, [{ name: 'a' }]);
});

test('to map', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier.map(user => ({ wat: user.name })).toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

test('to map 2', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  pathifier.map(user => ({ wat: user.name })).toArray(array);
  pathifier.init();

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

test('to map and filter', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .map(u => ({ wat: u.name }))
    .filter(u => u.wat !== 'b')
    .toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ wat: 'a' }]);

  data.set('users.c.name', 'c');
  t.deepEqual(array, [{ wat: 'a' }, { wat: 'c' }]);
});

test('filterOn after', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .filterOn('filter', (u, { onValue }) => u.name === onValue)
    .toArray(array);
  pathifier.init();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, []);
  data.set('users.c.name', 'c');
  t.deepEqual(array, []);
  data.set('filter', 'b');
  t.deepEqual(array, [{ name: 'b' }]);
});

test('filterOn before', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .filterOn('filter', (value, { onValue }) => value.name === onValue)
    .toArray(array);
  pathifier.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.set('filter', 'b');

  data.set('users.c.name', 'c');
  t.deepEqual(array, [{ name: 'b' }]);
  data.set('filter', 'a');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('sort 2', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier.sort((a, b) => b.name.localeCompare(a.name)).toArray(array);
  pathifier.init();

  t.deepEqual(array, []);
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'b' }, { name: 'a' }]);
});

test('Update filterOn on update after data is set', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .filterOn('test', (user, { onValue: filter }) =>
      new RegExp(filter, 'i').test(user)
    )
    .toArray(array);
  pathifier.init();

  data.set('test', '');
  data.set('users', { a: 'a', b: 'b' });
  t.deepEqual(array, ['a', 'b']);
  data.set('test', 'b');
  t.deepEqual(array, ['b']);
});

test('filterOn and back', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .map(user => user.name)
    .filterOn('test', (name, { onValue: filter }) =>
      new RegExp(filter, 'i').test(name)
    )
    .toArray(array);
  pathifier.init();

  data.set('test', '');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
  t.deepEqual(array, ['One!', 'Two!']);
  data.set('test', 'two');
  t.deepEqual(array, ['Two!']);
  data.set('test', '');
  t.deepEqual(array, ['One!', 'Two!']);
});

test('on sortOn - custom order update', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');

  pathifier
    .map(user => user.name)
    .sortOn('test', (a, b, { onValue }) =>
      onValue === 'yes' ? b.localeCompare(a) : a.localeCompare(b)
    )
    .toArray(array);
  pathifier.init();

  data.set('users.1', { name: '1' });
  data.set('users.2', { name: '2' });
  data.set('users.3', { name: '3' });
  t.deepEqual(array, ['1', '2', '3']);
  data.set('test', 'yes');
  t.deepEqual(array, ['3', '2', '1']);
  data.unset('users.1');
  t.deepEqual(array, ['3', '2']);
  data.set('users.1', { name: '7' });
  t.deepEqual(array, ['7', '3', '2']);
});

test('Pathifier no sub-array', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');
  pathifier.map(p => p.name).toArray(array);
  pathifier.init();

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('Pathifier sub-array', t => {
  const { array, pathifier, data } = dataAndPathifier('users.$');
  pathifier.map(p => p.name).toArray(array);
  pathifier.init();

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a', x: [1] }]);
  t.deepEqual(array, ['a']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('map has path', t => {
  const { pathifier, data } = dataAndPathifier('users.$');
  let res: any[] = [];
  pathifier.map((p, { path }) => {
    res.push(path);
    return p.name;
  });
  pathifier.init();
  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, ['users.0', 'users.1']);
});

test('child', t => {
  const { pathifier, data } = dataAndPathifier('test.$');

  pathifier.map((_, { child }) => {
    t.is(child('ok'), 'test.a.ok');
  });
  pathifier.init();

  data.set('test.a.ok', 'yes!');
});

test('or', t => {
  const { pathifier, array } = dataAndPathifier('test.$');

  pathifier.or(1).toArray(array);
  pathifier.init();

  t.deepEqual(array, [1]);
});

test('or2', t => {
  const { data, array, pathifier } = dataAndPathifier('test.$');

  pathifier.or('well').toArray(array);
  pathifier.init();

  t.deepEqual(array, ['well']);
  data.set('test.a', 'ok');
  t.deepEqual(array, ['ok']);
  data.unset('test.a');
  t.deepEqual(array, ['well']);
});
//
// // Won't happen
// test.skip('or3', t => {
//   const data = new Data();
//   const array: any[] = [];
//   const pathifier = new Pathifier(data, 'test.$');
//   pathifier.or('well');
//   pathifier.init();
//
//   pathifier.transformer = createTransformer(array);
//
//   t.deepEqual(array, ['well']);
//   data.set('test.a', 'ok');
//   t.deepEqual(array, ['ok']);
//   data.unset('test.a');
//   t.deepEqual(array, ['well']);
// });

test('unset2', async t => {
  const { data, array, pathifier } = dataAndPathifier('test');
  pathifier.toArray(array);
  pathifier.init();

  data.set('test', 'ing');
  t.deepEqual(array, ['ing']);
  data.set('test', '');
  t.deepEqual(array, ['']);
  data.unset('test');
  t.deepEqual(array, []);
});

test('When + filterOn 2', async t => {
  // const { data, array, pathifier } = dataAndPathifier('test');
  // const data = new Data();
  // const a = createPathifier(data, 'yes');

  const data = new Data();
  const a = new DataTransformer(data, 'yes');
  const array: any[] = [];

  a.map(tt => {
    switch (tt) {
      case true:
        const arr: any[] = [];
        const b = new DataTransformer<any>(data, 'users.$');
        b.filterOn('test', (user, { onValue }) =>
          new RegExp(onValue, 'i').test(user.name)
        )
          .map(user => user.name)
          .toArray(arr);
        b.init();
        return arr;
      default:
        return [];
    }
  }).toArray(array);
  a.init();
  data.set('yes', true);
  data.set('test', 'two');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
  t.deepEqual(array, [['Two!']]);
  data.set('yes', false);
  t.deepEqual(array, [[]]);
  data.set('yes', true);
  t.deepEqual(array, [['Two!']]);
  data.set('test', '');
  t.deepEqual(array, [['One!', 'Two!']]);
});

// test('filterOn 3', async t => {
//   const data = new Data();
//   data.set('test', 'two');
//   data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
//
//   const { array, pathifier } = createPathifier(data, 'users.$');
//   pathifier
//     .filterOn('test', (user, { onValue }) => {
//       const o = new RegExp(onValue, 'i').test(user.name);
//       return o;
//     })
//     .map(user => user.name);
//   pathifier.init();
//
//   t.deepEqual(array, ['Two!']);
//   data.set('test', '');
//   t.deepEqual(array, ['One!', 'Two!']);
// });

test('lists', t => {
  const { array, data, pathifier } = dataAndPathifier('users.$');
  pathifier.toArray(array);
  pathifier.init();
  data.set('users', [{ name: 'eirik' }, { name: 'steffen' }]);
  t.deepEqual(array, [{ name: 'eirik' }, { name: 'steffen' }]);
  data.set('users.1.name', 'wut');
  t.deepEqual(array, [{ name: 'eirik' }, { name: 'wut' }]);
});

// test('aggregate', t => {
//   const data = new Data();
//   data.set('users', ['a', 'b', 'c', 'd']);
//   data.set('f', ['a', 'b', 'c', 'd']);
//
//   const { array, pathifier } = createPathifier(data, 'users.$');
//   pathifier
//     .aggregate(entrires => {
//       data.set('total', entrires.length);
//     })
//     .filterOn('f', (v, { onValue }) => (onValue || []).includes(v))
//     .aggregate(entries => {
//       data.set('count', entries.length);
//     })
//     .slice(0, 2)
//     .aggregate(entries => {
//       data.set('now', entries.length);
//     });
//
//   pathifier.init();
//
//   t.deepEqual(array, ['a', 'b']);
//   t.is(data.get('total'), 4);
//   t.is(data.get('count'), 4);
//   t.is(data.get('now'), 2);
//   data.unset('f');
//   data.set('f', ['a', 'b', 'c']);
//   t.deepEqual(array, ['a', 'b']);
//   t.is(data.get('total'), 4);
//   t.is(data.get('count'), 3);
//   t.is(data.get('now'), 2);
// });

// test('aggregate delayed', async t => {
//   const tick = () => new Promise(r => setTimeout(r, 0));
//
//   const data = new Data();
//   data.set('users', ['a', 'b', 'c', 'd']);
//   data.set('f', ['a', 'b', 'c', 'd']);
//
//   const { array, pathifier } = createPathifier(data, 'users.$');
//   let count = 0;
//   pathifier
//     .aggregate(entrires => {
//       data.set('total', entrires.length);
//     }, true)
//     .filterOn('f', (v, { onValue }) => (onValue || []).includes(v))
//     .aggregate(entries => {
//       data.set('count', entries.length);
//     }, true)
//     .slice(0, 2)
//     .aggregate(entries => {
//       data.set('now', entries.length);
//       count++;
//     }, true);
//
//   pathifier.init();
//
//   t.deepEqual(array, ['a', 'b']);
//   await tick();
//   t.is(data.get('total'), 4);
//   t.is(data.get('count'), 4);
//   t.is(data.get('now'), 2);
//   t.is(count, 1);
//   data.unset('f');
//   data.set('f', ['a', 'b', 'c']);
//   t.deepEqual(array, ['a', 'b']);
//   t.is(data.get('total'), 4);
//   t.is(data.get('count'), 4);
//   t.is(data.get('now'), 2);
//   t.is(count, 1);
//   await tick();
//   t.is(data.get('total'), 4);
//   t.is(data.get('count'), 3);
//   t.is(data.get('now'), 2);
//   t.is(count, 1);
// });

test('sortOn filterOn', t => {
  const { array, data, pathifier } = dataAndPathifier('test.$');

  pathifier
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue).test(value.name)
    )
    .map(x => x.name)
    .toArray(array);
  pathifier.init();

  data.set('test', {
    a: { name: 'a', x: 5, y: 1 },
    b: { name: 'b', x: 0, y: 2 },
    c: { name: 'c', x: 0, y: 3 },
    d: { name: 'd', x: 200, y: 4 },
    e: { name: 'e', x: 3, y: 5 },
  });
  t.deepEqual(array, ['e', 'd', 'c', 'b', 'a']);
  data.set('sort', 'x');
  t.deepEqual(array, ['d', 'a', 'e', 'b', 'c']);
  data.set('sort', 'y');
  t.deepEqual(array, ['e', 'd', 'c', 'b', 'a']);
  data.set('filter', '[abcd]');
  t.deepEqual(array, ['d', 'c', 'b', 'a']);
});

test('sortOn filterOn 2', t => {
  const { array, data, pathifier } = dataAndPathifier('test.$');

  pathifier
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue).test(value.name)
    )
    .filter(() => true)
    .map(v => v.name)
    .toArray(array);
  pathifier.init();

  data.set('test', [
    { name: 'a', x: 5, y: 1 },
    { name: 'b', x: 0, y: 2 },
    { name: 'c', x: 0, y: 3 },
  ]);
  t.deepEqual(array, ['c', 'b', 'a']);
  data.set('sort', 'x');
  t.deepEqual(array, ['a', 'b', 'c']);
  data.set('sort', 'y');
  t.deepEqual(array, ['c', 'b', 'a']);
});

// test('sortOn + filter', t => {
//   const { array, data, pathifier } = dataAndPathifier('test.$');
//
//   pathifier
//     .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
//     .filterOn('filter', (value, { onValue }) =>
//       new RegExp(onValue, 'i').test(value.name)
//     )
//     .map(x => x.name)
//     .toArray(array);
//   pathifier.init();
//
//   data.set('test', [
//     { name: 'a', x: 5, y: 1 },
//     { name: 'b', x: 0, y: 2 },
//     { name: 'c', x: 1, y: 3 },
//   ]);
//   t.deepEqual(array, ['c', 'b', 'a']);
//   data.set('sort', 'x');
//   t.deepEqual(array, ['a', 'c', 'b']);
//   data.set('sort', 'y');
//   t.deepEqual(array, ['c', 'b', 'a']);
//   data.set('filter', '[ab]');
//   t.deepEqual(array, ['b', 'a']);
//   data.set('filter', '[bc]');
//   t.deepEqual(array, ['c', 'b']);
//   data.set('filter', '[abc]');
//   t.deepEqual(array, ['c', 'b', 'a']);
// });

// test('sortOn filterOn slice', t => {
//   const { array, data, pathifier } = dataAndPathifier('test.$');
//
//   pathifier
//     .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
//     .filterOn('filter', (value, { onValue }) =>
//       new RegExp(onValue).test(value.name)
//     )
//     .map(x => x.name)
//     .slice(0, 3)
//     .toArray(array);
//   pathifier.init();
//
//   data.set('test', {
//     a: { name: 'a', x: 5, y: 1 },
//     b: { name: 'b', x: 0, y: 2 },
//     c: { name: 'c', x: 0, y: 3 },
//     d: { name: 'd', x: 200, y: 4 },
//     e: { name: 'e', x: 3, y: 5 },
//   });
//   t.deepEqual(array, ['e', 'd', 'c']);
//   data.set('sort', 'x');
//   t.deepEqual(array, ['d', 'a', 'e']);
//   data.set('sort', 'y');
//   t.deepEqual(array, ['e', 'd', 'c']);
//   data.set('filter', '[abcd]');
//   t.deepEqual(array, ['d', 'c', 'b']);
//   t.pass();
// });
