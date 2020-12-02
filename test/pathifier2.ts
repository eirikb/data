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

test('map add', t => {
  const { array, data, pathifier } = stower2('a.$y');
  console.log(typeof array, typeof data);

  pathifier.map(value => Number(value) + 1).map(value => Number(value) + 1);

  data.set('a.b', '1');
  console.log('array', array());
  t.pass();
});
