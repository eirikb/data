import test from 'ava';

import {isEqual} from '../src/common';

test('isEqual', t => {
  const a = {x: 1, y: 2, moving: undefined};
  const b = {x: 1, y: 2, moving: undefined};
  t.true(isEqual(a, b));
});
