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
  pathifier.mapOn('test', (onValue, _opts, value) => {
    if (onValue === 'ing') return 'ting';
    return value;
  });
  data.set('a.b', '1');
  t.deepEqual(array, ['1']);
  data.set('test', 'ing');
  t.deepEqual(array, ['ting']);
});
