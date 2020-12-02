import test from 'ava';
import { MapTransformer } from '../src/transformers';

test('map', t => {
  const mapTransformer = new MapTransformer(a => Number(a) + 1);
  mapTransformer.add(['a', '1']);
  t.pass();
});
