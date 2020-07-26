import test from 'ava';
import { Data } from '../src/data';
import { LooseObject, Stower } from '../src/types';

function stower(...props: string[]) {
  if (props.length === 0) props = ['index', 'path'];
  const res: any[] = [];
  return {
    res,
    reset() {
      res.splice(0, res.length);
    },
    toArray(): Stower {
      function eh(t: string) {
        return function(value: any, index: number, _: number, path: string) {
          const input = { index, path, value };
          const o: LooseObject = {};
          props.forEach(p => (o[p] = (input as any)[p]));
          res.push({ t, ...o });
        };
      }

      return {
        add: eh('add'),
        remove: eh('remove'),
      } as Stower;
    },
  };
}

test('no output no fail', t => {
  const data = new Data();
  data.on('users');
  data.set('users.a.name', 'no fail');
  t.pass();
});

test('then before', t => {
  t.plan(1);

  const data = new Data();
  data.on('users').then(users => {
    t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, users);
  });
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
});

test('then after', t => {
  t.plan(1);

  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.on('users').then(users => {
    t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, users);
  });
});

test('then unset', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  let users;
  data.on('users.*').then(u => {
    users = u;
  });
  t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, users);
  data.unset('users.b');
  t.deepEqual({ a: { name: 'a' } }, users);
});

test('then unset sub-path', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a', age: 12 },
    b: { name: 'b', age: 42 },
  });
  let users;
  data.on('users').then(u => (users = u));
  t.deepEqual({ a: { name: 'a', age: 12 }, b: { name: 'b', age: 42 } }, users);
  data.unset('users.b.age');
  t.deepEqual({ a: { name: 'a', age: 12 }, b: { name: 'b' } }, users);
});

test('to unset', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.on('users.*').to('yes');
  data.unset('users.b');
  t.deepEqual({ a: { name: 'a' } }, data.get('yes'));
});

test('to unset sub-path', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a', age: 12 },
    b: { name: 'b', age: 42 },
  });
  data.on('users.*.*').to('yes');
  t.deepEqual(
    { a: { name: 'a', age: 12 }, b: { name: 'b', age: 42 } },
    data.get('yes')
  );
  data.unset('users.b.age');
  t.deepEqual({ a: { name: 'a', age: 12 }, b: { name: 'b' } }, data.get('yes'));
});

test('then not called for outfiltered data', t => {
  t.plan(1);

  const data = new Data();
  data
    .on('users')
    .filter(user => user.name === 'a')
    .then(users => {
      t.deepEqual({ a: { name: 'a' } }, users);
    });
  data.set('users.a.name', 'a');
  data.set('users.b.name', 'b');
});

test('to before ', t => {
  const data = new Data();
  data.on('users').to('yes');
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, data.get('yes'));
});

test('to after', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.on('users').to('yes');
  t.deepEqual({ a: { name: 'a' }, b: { name: 'b' } }, data.get('yes'));
});

test('to sub-path', t => {
  const data = new Data();
  data.on('users').to('yes');
  data.set('users.a.name', 'b');
  t.deepEqual({ a: { name: 'b' } }, data.get('yes'));
});

test('to filter', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data
    .on('users.*')
    .filter(u => u.name !== 'b')
    .to('yes');
  data.set('users.c.name', 'c');
  t.deepEqual({ a: { name: 'a' }, c: { name: 'c' } }, data.get('yes'));
});

test('to map', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data
    .on('users.*')
    .map(user => ({ wat: user.name }))
    .to('yes');
  data.set('users.c.name', 'c');
  t.deepEqual(
    { a: { wat: 'a' }, b: { wat: 'b' }, c: { wat: 'c' } },
    data.get('yes')
  );
});

test('to map called on parent of eh thingy', t => {
  const data = new Data();
  data
    .on('users')
    .map(user => ({ wat: user.name }))
    .to('yes');
  data.set('users.c.name', 'c');
  t.deepEqual({ c: { wat: 'c' } }, data.get('yes'));
});

test('to map and filter', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data
    .on('users.*')
    .map(u => ({ wat: u.name }))
    .filter(u => u.name !== 'b')
    .to('yes');
  data.set('users.c.name', 'c');
  t.deepEqual({ a: { wat: 'a' }, c: { wat: 'c' } }, data.get('yes'));
});

test('filterOn after', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data
    .on('users.*')
    .filterOn('filter', (f, u) => u.name === f)
    .to('yes');
  data.set('users.c.name', 'c');
  data.set('filter', 'b');
  t.deepEqual({ b: { name: 'b' } }, data.get('yes'));
});

test('filterOn before', t => {
  const data = new Data();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.set('filter', 'b');
  data
    .on('users.*')
    .filterOn('filter', (f, u) => u.name === f)
    .to('yes');
  data.set('users.c.name', 'c');
  t.deepEqual({ b: { name: 'b' } }, data.get('yes'));
  data.set('filter', 'a');
  t.deepEqual({ a: { name: 'a' } }, data.get('yes'));
});

test('only one filter, unfortunately', t => {
  const data = new Data();
  t.throws(() =>
    data
      .on('users')
      .filter(() => true)
      .filterOn('', () => true)
  );
  t.throws(() =>
    data
      .on('users')
      .filter(() => true)
      .filter(() => true)
  );
});

test('only one sort, unfortunately', t => {
  const data = new Data();
  t.throws(() =>
    data
      .on('users')
      .sort(() => 0)
      .sortOn('', () => 0)
  );
  t.throws(() =>
    data
      .on('users')
      .sort(() => 0)
      .sort(() => 0)
  );
});

test('only one map, unfortunately', t => {
  const data = new Data();
  t.throws(() =>
    data
      .on('users')
      .map(() => true)
      .map(() => true)
  );
});

test('only one to, unfortunately', t => {
  const data = new Data();
  t.throws(() =>
    data
      .on('users')
      .to('a')
      .to('a')
  );
});

test('only one array, unfortunately', t => {
  const data = new Data();
  t.throws(() =>
    data
      .on('users')
      .toArray({} as Stower)
      .toArray({} as Stower)
  );
});

test('toArray initial before', t => {
  const data = new Data();
  const { res, toArray } = stower();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data.on('users').toArray(toArray());
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 1, path: 'b' },
  ]);
});

test('toArray initial after', t => {
  const data = new Data();
  const { res, toArray } = stower();
  data.on('users').toArray(toArray());
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 1, path: 'b' },
  ]);
});

test('toArray add', t => {
  const data = new Data();
  const { res, toArray, reset } = stower();
  data.on('users.*').toArray(toArray());
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 1, path: 'b' },
  ]);
  reset();
  data.set('users.c.name', 'c');
  t.deepEqual(res, [{ t: 'add', index: 2, path: 'c' }]);
});

test('toArray remove', t => {
  const data = new Data();
  const { res, reset, toArray } = stower();
  data.on('users.*').toArray(toArray());
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
    c: { name: 'c' },
  });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 1, path: 'b' },
    { t: 'add', index: 2, path: 'c' },
  ]);
  reset();
  data.unset('users.b');
  t.deepEqual(res, [{ t: 'remove', index: 1, path: 'b' }]);
});

test('sort', t => {
  const data = new Data();
  const { res, toArray } = stower();
  data.set('users', {
    a: { name: 'a' },
    b: { name: 'b' },
  });
  data
    .on('users')
    .sort((a, b) => b.name.localeCompare(a.name))
    .toArray(toArray());
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 0, path: 'b' },
  ]);
});

test('Update filterOn on update after data is set', t => {
  const data = new Data();
  const { res, reset, toArray } = stower();
  data
    .on('users')
    .map(user => user)
    .filterOn('test', (filter, user) => new RegExp(filter, 'i').test(user))
    .toArray(toArray());
  data.set('test', '');
  data.set('users', { a: 'a', b: 'b' });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'a' },
    { t: 'add', index: 1, path: 'b' },
  ]);
  reset();
  data.set('test', 'b');
  t.deepEqual(res, [
    { t: 'remove', index: 1, path: 'b' },
    { t: 'add', index: 1, path: 'b' },
    { t: 'remove', index: 0, path: 'a' },
  ]);
});

test('filterOn and back', t => {
  const data = new Data();
  const { res, reset, toArray } = stower();
  data
    .on('users')
    .map(user => user.name)
    .filterOn('test', (filter, user) => new RegExp(filter, 'i').test(user.name))
    .toArray(toArray());

  data.set('test', '');
  data.set('users', { one: { name: 'One!' }, two: { name: 'Two!' } });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'one' },
    { t: 'add', index: 1, path: 'two' },
  ]);
  reset();

  data.set('test', 'two');
  t.deepEqual(res, [
    { t: 'remove', index: 1, path: 'two' },
    { t: 'add', index: 1, path: 'two' },
    { t: 'remove', index: 0, path: 'one' },
  ]);
  reset();

  data.set('test', '');
  t.deepEqual(res, [
    { t: 'add', index: 0, path: 'one' },
    { t: 'remove', index: 1, path: 'two' },
    { t: 'add', index: 1, path: 'two' },
  ]);
  t.pass();
});

test('on sortOn - custom order update', t => {
  const data = new Data();
  const { res, reset, toArray } = stower();

  data
    .on('players.*')
    .map(player => player.name)
    .sortOn('test', (_, a, b) => b.name.localeCompare(a.name))
    .toArray(toArray());

  data.set('players.1', { name: '1' });
  data.set('players.2', { name: '2' });
  data.set('players.3', { name: '3' });
  t.deepEqual(res, [
    { t: 'add', index: 0, path: '1' },
    { t: 'add', index: 0, path: '2' },
    { t: 'add', index: 0, path: '3' },
  ]);
  reset();
  data.set('test', 'yes');
  reset();

  data.unset('players.1');
  t.deepEqual(res, [{ t: 'remove', index: 2, path: '1' }]);
  reset();

  data.set('players.1', { name: '7' });
  t.deepEqual(res, [{ t: 'add', index: 0, path: '1' }]);
});

test('Pathifier no sub-array', t => {
  const data = new Data();
  const { res, reset, toArray } = stower('index', 'path');
  data
    .on('players.*')
    .map(p => p.name)
    .toArray(toArray());
  data.set('players', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, [
    { t: 'add', index: 0, path: '0' },
    { t: 'add', index: 1, path: '1' },
  ]);
  reset();
  data.set('players', [{ name: 'a' }]);
  t.deepEqual(res, [
    { t: 'remove', index: 0, path: '0' },
    { t: 'add', index: 0, path: '0' },
    { t: 'remove', index: 1, path: '1' },
  ]);
});

test('Pathifier sub-array', t => {
  const data = new Data();
  const { res, reset, toArray } = stower('index', 'path');
  data
    .on('players.*')
    .map(p => p.name)
    .toArray(toArray());
  data.set('players', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, [
    { t: 'add', index: 0, path: '0' },
    { t: 'add', index: 1, path: '1' },
  ]);
  reset();
  data.set('players', [{ name: 'a', x: [1] }]);
  t.deepEqual(res, [
    { t: 'remove', index: 0, path: '0' },
    { t: 'add', index: 0, path: '0' },
    { t: 'remove', index: 1, path: '1' },
  ]);
});

test('map has path', t => {
  const data = new Data();
  const { reset, toArray } = stower('index', 'path');
  let res: any[] = [];
  data
    .on('players.*')
    .map((p, path) => {
      res.push(path);
      return p.name;
    })
    .toArray(toArray());
  data.set('players', [{ name: 'a' }, { name: 'b' }]);
  t.deepEqual(res, ['players.0', 'players.1']);
  reset();
  res = [];
  data.set('players', [{ name: 'a', x: [1] }]);
  t.deepEqual(res, ['players.0']);
});
