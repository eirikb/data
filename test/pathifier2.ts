import test from 'ava';
import { Pathifier2 } from '../src/pathifier2';
import { Data } from '../src';
import { Entry, MapTransformer } from '../src/transformers';

class Eh extends MapTransformer {}

function stower2(path: string) {
  const data = new Data();
  const pathifier = new Pathifier2(data, path);
  pathifier.init();
  const transformer = new Eh(v => v);
  pathifier.transformer = transformer;
  return {
    data,
    array() {
      return ((transformer as any).entries as Entry[]).map(e => e.value);
    },
    pathifier,
  };
}

test('no', t => {
  const { array, data } = stower2('a.$y');

  data.set('a.b', '1');
  t.deepEqual(array(), ['1']);
});

test('map add', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a.b', '1');
  t.deepEqual(array(), [3]);
});

test('map add 2', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array(), [3, 4]);
});

test('map update', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.set('a.b', '3');
  t.deepEqual(array(), [5, 4]);
});

test('map remove', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);
  data.set('a', {
    b: '1',
    c: '2',
  });
  data.unset('a.b');
  t.deepEqual(array(), [4]);
});

test('sort', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array(), ['2', '1']);
});

test('sort update', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array(), ['2', '1']);
  data.set('a.b', '3');
  t.deepEqual(array(), ['3', '2']);
});

test('sort and map', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.sort((a, b) => b.localeCompare(a)).map(v => Number(v) + 1);

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array(), ['3', '2']);
});

test('map and sort', t => {
  const { array, data, pathifier } = stower2('a.$y');

  pathifier.map(v => `${Number(v) + 1}`).sort((a, b) => b.localeCompare(a));

  data.set('a', {
    b: '1',
    c: '2',
  });
  t.deepEqual(array(), ['3', '2']);
});
