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

test('then not called for outfiltered data', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier.filter(user => user.name === 'a');
  data.set('users.a.name', 'a');
  t.deepEqual(array, [{ name: 'a' }]);
  data.set('users.b.name', 'b');
  t.deepEqual(array, [{ name: 'a' }]);
});

test('then not called for outfiltered data 2', t => {
  const { array, pathifier, data } = stower2('users.$.*');

  pathifier.filter(user => user.name === 'a');

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
  const { array, pathifier, data } = stower2('users.$');

  pathifier.filter(u => u.name !== 'b');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ name: 'a' }, { name: 'c' }]);
});

// TODO: Fails when filter is applied after data exists... bug?
test.skip('to filter 2', t => {
  const { array, pathifier, data } = stower2('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  pathifier.filter(u => u.name !== 'b');

  t.deepEqual(array, [{ name: 'a' }]);
});

test('to map', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier.map(user => ({ wat: user.name }));

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

// TODO:
test.skip('to map 2', t => {
  const { array, pathifier, data } = stower2('users.$');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });

  pathifier.map(user => ({ wat: user.name }));

  data.set('users.c.name', 'c');

  t.deepEqual(array, [{ wat: 'a' }, { wat: 'b' }, { wat: 'c' }]);
});

test('to map and filter', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier.map(u => ({ wat: u.name })).filter(u => u.wat !== 'b');

  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ wat: 'a' }]);

  data.set('users.c.name', 'c');
  t.deepEqual(array, [{ wat: 'a' }, { wat: 'c' }]);
});

test('filterOn after', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier.filterOn('filter', (u, { onValue }) => u.name === onValue);
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
  const { array, pathifier, data } = stower2('users.$');

  pathifier.filterOn('filter', (value, { onValue }) => value.name === onValue);

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
  const { array, pathifier, data } = stower2('users.$');

  pathifier.sort((a, b) => b.name.localeCompare(a.name));

  t.deepEqual(array, []);
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(array, [{ name: 'b' }, { name: 'a' }]);
});

test('Update filterOn on update after data is set', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier.filterOn('test', (user, { onValue: filter }) =>
    new RegExp(filter, 'i').test(user)
  );

  data.set('test', '');
  data.set('users', { a: 'a', b: 'b' });
  t.deepEqual(array, ['a', 'b']);
  data.set('test', 'b');
  t.deepEqual(array, ['b']);
});

// TODO: WHY
test.skip('filterOn and back', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier
    .map(user => user.name)
    .filterOn('test', (user, { onValue: filter }) =>
      new RegExp(filter, 'i').test(user.name)
    );

  data.set('test', '');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
  t.deepEqual(array, ['One!', 'Two!']);
  data.set('test', 'two');
  t.deepEqual(array, ['Two!']);
  data.set('test', '');
  t.deepEqual(array, ['One!', 'Two!']);
});

test('on sortOn - custom order update', t => {
  const { array, pathifier, data } = stower2('users.$');

  pathifier
    .map(user => user.name)
    .sortOn('test', (a, b, { onValue }) =>
      onValue === 'yes' ? b.localeCompare(a) : a.localeCompare(b)
    );

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
  const { array, pathifier, data } = stower2('users.$');
  pathifier.map(p => p.name);

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('Pathifier sub-array', t => {
  const { array, pathifier, data } = stower2('users.$');
  pathifier.map(p => p.name);

  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(array, ['a', 'b']);
  data.set('users', [{ name: 'a', x: [1] }]);
  t.deepEqual(array, ['a']);
  data.set('users', [{ name: 'a' }]);
  t.deepEqual(array, ['a']);
});

test('map has path', t => {
  const { pathifier, data } = stower2('users.$');
  let res: any[] = [];
  pathifier.map((p, { opts: { path } }) => {
    res.push(path);
    return p.name;
  });
  data.set('users', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, ['users.0', 'users.1']);
});
