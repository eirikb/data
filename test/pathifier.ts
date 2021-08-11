import test from 'ava';
import {
  BaseTransformer,
  Data,
  DataTransformer,
  FlatTransformer,
} from '../src';

function setup<T>(path: string) {
  const data = new Data();
  const transformer = new DataTransformer<T>(data, path);
  const array: any[] = [];
  return { data, transformer, array };
}

function dataAndTransformer<T = any>(path: string) {
  const { data, transformer, array } = setup<T>(path);
  return { data, transformer: transformer, array };
}

test('no', t => {
  const { data, transformer, array } = setup('a.$y');
  transformer.toArray(array);
  transformer.init();

  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
});

test('map add', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');
  transformer
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  transformer.init();
  data.set('a.b', '1');
  t.deepEqual(array, [3]);
});

test('map add 2', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  transformer.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, [3, 4]);
});

test('map add 3', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  data.set('a', {
    b: '1',
    c: '2',
  });
  transformer.init();
  t.deepEqual(array, [3, 4]);
});

test('map update', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  transformer.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.set('a.b', '3');
  t.deepEqual(array, [5, 4]);
});

test('map remove', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .map(value => Number(value) + 1)
    .map(value => Number(value) + 1)
    .toArray(array);
  transformer.init();
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.unset('a.b');
  t.deepEqual(array, [4]);
});

test('unset', t => {
  const { array, data, transformer } = dataAndTransformer('a.$');
  transformer.toArray(array);
  transformer.init();

  data.set('a.b', 'ok');
  t.deepEqual(array, ['ok']);
  data.unset('a.b');
  t.deepEqual(array, []);
});

test('sort', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.sort((a, b) => b.localeCompare(a)).toArray(array);
  transformer.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
});

test('sort update', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.sort((a, b) => b.localeCompare(a)).toArray(array);
  transformer.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['2', '1']);
  data.set('a.b', '3');
  t.deepEqual(array, ['3', '2']);
});

test('sort and map', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .sort((a, b) => b.localeCompare(a))
    .map(v => Number(v) + 1)
    .toArray(array);
  transformer.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, [3, 2]);
});

test('map and sort', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .map(v => `${Number(v) + 1}`)
    .sort((a, b) => b.localeCompare(a))
    .toArray(array);
  transformer.init();

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array, ['3', '2']);
});

test('map add remove update', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.map(v => v).toArray(array);
  transformer.init();

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
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .sort((a, b) => a.localeCompare(b))
    .map(v => v)
    .toArray(array);
  transformer.init();

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
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.map(v => v).toArray(array);
  transformer.init();

  data.set('a', {
    b: 'b1',
    c: 'c1',
  });
  data.unset('a.b');
  data.set('a.c', 'c2');
  t.deepEqual(array, ['c2']);
});

test('slice', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.slice(0, 1).toArray(array);
  transformer.init();

  data.set('a', {
    b: 'b',
    c: 'c',
  });
  t.deepEqual(array, ['b']);
});

test('slice 2', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.slice(1, 3).toArray(array);
  transformer.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['c', 'd']);
});

test('sort and slice', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .sort((a, b) => b.localeCompare(a))
    .slice(1, 3)
    .toArray(array);
  transformer.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['d', 'c']);
});

test('mapOn', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');
  transformer
    .mapOn('test', (value, { onValue }) => {
      if (onValue === 'ing') return 'ting';
      return value;
    })
    .toArray(array);
  transformer.init();
  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
  data.set('test', 'ing');
  t.deepEqual(array, ['ting']);
});

test('sortOn', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');
  transformer
    .sortOn('test', (a, b, { onValue }) => {
      if (onValue) {
        return b.localeCompare(a);
      }
      return a.localeCompare(b);
    })
    .toArray(array);
  transformer.init();
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
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.sliceOn('test.*', value => value).toArray(array);
  transformer.init();

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
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer.filter(value => value !== 'c').toArray(array);
  transformer.init();

  data.set('a', {
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
  });
  t.deepEqual(array, ['b', 'd', 'e']);
});

test('filterOn', t => {
  const { array, data, transformer } = dataAndTransformer('a.$y');

  transformer
    .filterOn('test', (value, { onValue }) => value !== onValue)
    .toArray(array);
  transformer.init();

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
  const { data } = dataAndTransformer('a.$');
  data.set('users.a.name', 'no fail');
  t.pass();
});

test('then before', t => {
  const { array, data, transformer } = dataAndTransformer('users.$');
  transformer.toArray(array);
  transformer.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
});

test('then unset', t => {
  const { array, data, transformer } = dataAndTransformer('users.$');
  transformer.toArray(array);
  transformer.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'a' }, { name: 'b' }]);
  data.unset('users.b');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('then not called for outfiltered data', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer.filter(user => user.name === 'a').toArray(array);
  transformer.init();
  data.set('users.a.name', 'a');
  t.deepEqual(array, [{ name: 'a' }]);
  data.set('users.b.name', 'b');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('then not called for outfiltered data 2', t => {
  const { array, transformer, data } = dataAndTransformer('users.$.*');

  transformer.filter(user => user.name === 'a').toArray(array);
  transformer.init();

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
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer.filter(u => u.name !== 'b').toArray(array);
  transformer.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ name: 'a' }, { name: 'c' }]);
});

test('to filter 2', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  transformer.filter(u => u.name !== 'b').toArray(array);
  transformer.init();

  t.deepEqual(array, [{ name: 'a' }]);
});

test('to map', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer.map(user => ({ wat: user.name })).toArray(array);
  transformer.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

test('to map 2', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  transformer.map(user => ({ wat: user.name })).toArray(array);
  transformer.init();

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

test('to map and filter', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .map(u => ({ wat: u.name }))
    .filter(u => u.wat !== 'b')
    .toArray(array);
  transformer.init();

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ wat: 'a' }]);

  data.set('users.c.name', 'c');
  t.deepEqual(array, [{ wat: 'a' }, { wat: 'c' }]);
});

test('filterOn after', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .filterOn('filter', (u, { onValue }) => u.name === onValue)
    .toArray(array);
  transformer.init();
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
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .filterOn('filter', (value, { onValue }) => value.name === onValue)
    .toArray(array);
  transformer.init();

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
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer.sort((a, b) => b.name.localeCompare(a.name)).toArray(array);
  transformer.init();

  t.deepEqual(array, []);
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'b' }, { name: 'a' }]);
});

test('Update filterOn on update after data is set', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .filterOn('test', (user, { onValue: filter }) =>
      new RegExp(filter, 'i').test(user)
    )
    .toArray(array);
  transformer.init();

  data.set('test', '');
  data.set('users', { a: 'a', b: 'b' });
  t.deepEqual(array, ['a', 'b']);
  data.set('test', 'b');
  t.deepEqual(array, ['b']);
});

test('filterOn and back', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .map(user => user.name)
    .filterOn('test', (name, { onValue: filter }) =>
      new RegExp(filter, 'i').test(name)
    )
    .toArray(array);
  transformer.init();

  data.set('test', '');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
  t.deepEqual(array, ['One!', 'Two!']);
  data.set('test', 'two');
  t.deepEqual(array, ['Two!']);
  data.set('test', '');
  t.deepEqual(array, ['One!', 'Two!']);
});

test('on sortOn - custom order update', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');

  transformer
    .map(user => user.name)
    .sortOn('test', (a, b, { onValue }) =>
      onValue === 'yes' ? b.localeCompare(a) : a.localeCompare(b)
    )
    .toArray(array);
  transformer.init();

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

test('Transformer no sub-array', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');
  transformer.map(p => p.name).toArray(array);
  transformer.init();

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('Transformer sub-array', t => {
  const { array, transformer, data } = dataAndTransformer('users.$');
  transformer.map(p => p.name).toArray(array);
  transformer.init();

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a', x: [1] }]);
  t.deepEqual(array, ['a']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('map has path', t => {
  const { transformer, data } = dataAndTransformer('users.$');
  let res: any[] = [];
  transformer.map((p, { path }) => {
    res.push(path);
    return p.name;
  });
  transformer.init();
  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, ['users.0', 'users.1']);
});

test('child', t => {
  const { transformer, data } = dataAndTransformer('test.$');

  transformer.map((_, { child }) => {
    t.is(child('ok'), 'test.a.ok');
  });
  transformer.init();

  data.set('test.a.ok', 'yes!');
});

test('or', t => {
  const { transformer, array } = dataAndTransformer('test.$');

  transformer.or(1).toArray(array);
  transformer.init();

  t.deepEqual(array, [1]);
});

test('or2', t => {
  const { data, array, transformer } = dataAndTransformer('test.$');

  transformer.or('well').toArray(array);
  transformer.init();

  t.deepEqual(array, ['well']);
  data.set('test.a', 'ok');
  t.deepEqual(array, ['ok']);
  data.unset('test.a');
  t.deepEqual(array, ['well']);
});

test('or3', t => {
  const data = new Data();
  const array: any[] = [];
  const transformer = new DataTransformer(data, 'test.$');
  transformer.or('well').toArray(array);
  transformer.init();

  t.deepEqual(array, ['well']);
  data.set('test.a', 'ok');
  t.deepEqual(array, ['ok']);
  data.unset('test.a');
  t.deepEqual(array, ['well']);
});

test('unset2', async t => {
  const { data, array, transformer } = dataAndTransformer('test');
  transformer.toArray(array);
  transformer.init();

  data.set('test', 'ing');
  t.deepEqual(array, ['ing']);
  data.set('test', '');
  t.deepEqual(array, ['']);
  data.unset('test');
  t.deepEqual(array, []);
});

test('When + filterOn 2', async t => {
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

test('filterOn 3', async t => {
  const data = new Data();
  data.set('test', 'two');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });

  const array: any[] = [];
  const transformer = new DataTransformer<any>(data, 'users.$');
  transformer
    .filterOn('test', (user, { onValue }) =>
      new RegExp(onValue, 'i').test(user.name)
    )
    .map(user => user.name)
    .toArray(array);
  transformer.init();

  t.deepEqual(array, ['Two!']);
  data.set('test', '');
  t.deepEqual(array, ['One!', 'Two!']);
});

test('lists', t => {
  const { array, data, transformer } = dataAndTransformer('users.$');
  transformer.toArray(array);
  transformer.init();
  data.set('users', [{ name: 'eirik' }, { name: 'steffen' }]);
  t.deepEqual(array, [{ name: 'eirik' }, { name: 'steffen' }]);
  data.set('users.1.name', 'wut');
  t.deepEqual(array, [{ name: 'eirik' }, { name: 'wut' }]);
});

test('aggregate', t => {
  const data = new Data();
  data.set('users', ['a', 'b', 'c', 'd']);
  data.set('f', ['a', 'b', 'c', 'd']);

  const array: any[] = [];
  const transformer = new DataTransformer(data, 'users.$');
  transformer
    .aggregate(entrires => {
      data.set('total', entrires.length);
    })
    .filterOn('f', (v, { onValue }) => (onValue || []).includes(v))
    .aggregate(entries => {
      data.set('count', entries.length);
    })
    .slice(0, 2)
    .aggregate(entries => {
      data.set('now', entries.length);
    })
    .toArray(array);

  transformer.init();

  t.deepEqual(array, ['a', 'b']);
  t.is(data.get('total'), 4);
  t.is(data.get('count'), 4);
  t.is(data.get('now'), 2);
  data.unset('f');
  data.set('f', ['a', 'b', 'c']);
  t.deepEqual(array, ['a', 'b']);
  t.is(data.get('total'), 4);
  t.is(data.get('count'), 3);
  t.is(data.get('now'), 2);
});

test('aggregate delayed', async t => {
  const tick = () => new Promise(r => setTimeout(r, 0));

  const data = new Data();
  data.set('users', ['a', 'b', 'c', 'd']);
  data.set('f', ['a', 'b', 'c', 'd']);

  const array: any[] = [];
  const transformer = new DataTransformer(data, 'users.$');
  let count = 0;
  transformer
    .aggregate(entrires => {
      data.set('total', entrires.length);
    }, true)
    .filterOn('f', (v, { onValue }) => (onValue || []).includes(v))
    .aggregate(entries => {
      data.set('count', entries.length);
    }, true)
    .slice(0, 2)
    .aggregate(entries => {
      data.set('now', entries.length);
      count++;
    }, true)
    .toArray(array);

  transformer.init();

  t.deepEqual(array, ['a', 'b']);
  await tick();
  t.is(data.get('total'), 4);
  t.is(data.get('count'), 4);
  t.is(data.get('now'), 2);
  t.is(count, 1);
  data.unset('f');
  data.set('f', ['a', 'b', 'c']);
  t.deepEqual(array, ['a', 'b']);
  t.is(data.get('total'), 4);
  t.is(data.get('count'), 4);
  t.is(data.get('now'), 2);
  t.is(count, 1);
  await tick();
  t.is(data.get('total'), 4);
  t.is(data.get('count'), 3);
  t.is(data.get('now'), 2);
  t.is(count, 1);
});

test('sortOn filterOn', t => {
  const { array, data, transformer } = dataAndTransformer('test.$');

  transformer
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue).test(value.name)
    )
    .map(x => x.name)
    .toArray(array);
  transformer.init();

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
  const { array, data, transformer } = dataAndTransformer('test.$');

  transformer
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue).test(value.name)
    )
    .filter(() => true)
    .map(v => v.name)
    .toArray(array);
  transformer.init();

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

test('sortOn + filter', t => {
  const { array, data, transformer } = dataAndTransformer('test.$');

  transformer
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue, 'i').test(value.name)
    )
    .map(x => x.name)
    .toArray(array);
  transformer.init();

  data.set('test', [
    { name: 'a', x: 5, y: 1 },
    { name: 'b', x: 0, y: 2 },
    { name: 'c', x: 1, y: 3 },
  ]);
  t.deepEqual(array, ['c', 'b', 'a']);
  data.set('sort', 'x');
  t.deepEqual(array, ['a', 'c', 'b']);
  data.set('sort', 'y');
  t.deepEqual(array, ['c', 'b', 'a']);
  data.set('filter', '[ab]');
  t.deepEqual(array, ['b', 'a']);
  data.set('filter', '[bc]');
  t.deepEqual(array, ['c', 'b']);
  data.set('filter', '[abc]');
  t.deepEqual(array, ['c', 'b', 'a']);
});

test('sortOn filterOn slice', t => {
  const { array, data, transformer } = dataAndTransformer('test.$');

  transformer
    .sortOn('sort', (a, b, { onValue }) => b[onValue] - a[onValue])
    .filterOn('filter', (value, { onValue }) =>
      new RegExp(onValue).test(value.name)
    )
    .map(x => x.name)
    .slice(0, 3)
    .toArray(array);
  transformer.init();

  data.set('test', {
    a: { name: 'a', x: 5, y: 1 },
    b: { name: 'b', x: 0, y: 2 },
    c: { name: 'c', x: 0, y: 3 },
    d: { name: 'd', x: 200, y: 4 },
    e: { name: 'e', x: 3, y: 5 },
  });
  t.deepEqual(array, ['e', 'd', 'c']);
  data.set('sort', 'x');
  t.deepEqual(array, ['d', 'a', 'e']);
  data.set('sort', 'y');
  t.deepEqual(array, ['e', 'd', 'c']);
  data.set('filter', '[abcd]');
  t.deepEqual(array, ['d', 'c', 'b']);
  t.pass();
});

test('flat 1', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addTo([0], 'a');
  t.deepEqual(array, ['a']);
  flatTransformer.addTo([2], 'd');
  t.deepEqual(array, ['a', 'd']);
  flatTransformer.addTo([1, 1], 'c');
  t.deepEqual(array, ['a', 'c', 'd']);
  flatTransformer.addTo([1, 0, 0], 'b');
  t.deepEqual(array, ['a', 'b', 'c', 'd']);
});

test('flat 2', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addTo([0], 'a');
  t.deepEqual(array, ['a']);
  flatTransformer.addTo([2], 'd');
  t.deepEqual(array, ['a', 'd']);
  flatTransformer.addTo([1, 1], 'c');
  t.deepEqual(array, ['a', 'c', 'd']);
  flatTransformer.addTo([1, 0], 'b');
  t.deepEqual(array, ['a', 'b', 'c', 'd']);
});

test('flat 3', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addTo([1, 1], 'd');
  t.deepEqual(array, ['d']);
  flatTransformer.addTo([0, 1], 'c');
  t.deepEqual(array, ['c', 'd']);
  flatTransformer.addTo([0, 0], 'a');
  t.deepEqual(array, ['a', 'c', 'd']);
  flatTransformer.addTo([0, 1], 'b');
  t.deepEqual(array, ['a', 'b', 'c', 'd']);
});

test('flat 4', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addTo([2], 'c');
  t.deepEqual(array, ['c']);
  flatTransformer.addTo([1], 'b');
  t.deepEqual(array, ['b', 'c']);
  flatTransformer.addTo([3], 'd');
  t.deepEqual(array, ['b', 'c', 'd']);
});

test('flat 5', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  const b = new DataTransformer(data, 'b');
  const c = new DataTransformer(data, 'c');
  b.init();
  c.init();

  flatTransformer.addToTransformer([1, 0], b);
  flatTransformer.addToTransformer([1, 1], c);

  flatTransformer.addTo([0], 'a');
  t.deepEqual(array, ['a']);
  flatTransformer.addTo([2], 'd');
  t.deepEqual(array, ['a', 'd']);

  data.set('b', 'b');
  t.deepEqual(array, ['a', 'b', 'd']);
  data.set('c', 'c');
  t.deepEqual(array, ['a', 'b', 'c', 'd']);
});

function don(data: Data, path: string): BaseTransformer<any, any> {
  const a = new DataTransformer(data, path);
  a.root = a;
  return a;
}

test('flat 6', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addToTransformer(
    [1],
    don(data, 'a.$').map(l => l + 's')
  );

  flatTransformer.addTo([0], 'a');
  t.deepEqual(array, ['a']);
  flatTransformer.addTo([2], 'd');
  t.deepEqual(array, ['a', 'd']);

  data.set('a', ['lol']);
  t.deepEqual(array, ['a', 'lols', 'd']);
});

test('flat 7', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addToTransformer(
    [1],
    don(data, 'a.$').map(l => don(data, `b.${l}`))
  );

  flatTransformer.addTo([0], 'a');
  t.deepEqual(array, ['a']);
  flatTransformer.addTo([2], 'd');
  t.deepEqual(array, ['a', 'd']);

  data.set('b.lol', 'yeah');
  data.set('a', ['lol']);
  t.deepEqual(array, ['a', 'yeah', 'd']);
});

test('flat 8', t => {
  const array: any[] = [];
  const data = new Data();

  const flatTransformer = new FlatTransformer(data);
  flatTransformer.toArray(array);

  flatTransformer.addTo([0], ['a', ['b', 'c']]);
  t.deepEqual(array, ['a', 'b', 'c']);
});
