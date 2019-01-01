import test from 'ava';
import Listeners from '../src/listeners';

test('one level', t => {
  const listeners = new Listeners();
  listeners.add('a', () => t.pass());
  listeners.trigger('a', 'hello');
});

test('two level', t => {
  const listeners = new Listeners();
  t.plan(1);
  listeners.add('a.b', (value) => t.deepEqual('hello', value));
  listeners.trigger('a.b', 'hello');
});

test('special key one level', t => {
  const listeners = new Listeners();
  listeners.add('a.$b', (value, {$b}) => {
    t.deepEqual('c', $b);
    t.deepEqual('hello', value);
  });
  listeners.trigger('a.c', 'hello');
});

test('special key two level', t => {
  const listeners = new Listeners();
  listeners.add('teams.$team.players.$player', (value, {$team, $player}) => {
    t.deepEqual('rbk', $team);
    t.deepEqual('mini', $player);
    t.deepEqual('hello', value);
  });
  listeners.trigger('teams.rbk.players.mini', 'hello');
});

test('special key two level + 1', t => {
  const listeners = new Listeners();
  listeners.add('teams.$team.players.$player.age', (value, {$team, $player}) => {
    t.deepEqual('rbk', $team);
    t.deepEqual('mini', $player);
    t.deepEqual(99, value);
  });
  listeners.trigger('teams.rbk.players.mini.age', 99);
});

test('special key two level + object', t => {
  const listeners = new Listeners();
  listeners.add('teams.$team.players.$player', (value, {$team, $player}) => {
    t.deepEqual('rbk', $team);
    t.deepEqual('mini', $player);
    t.deepEqual({hello: 'world'}, value);
  });
  listeners.trigger('teams.rbk.players.mini', {hello: 'world'});
});

test('pathing', t => {
  const listeners = new Listeners();
  let val;
  const paths = ['a', 'a.b', 'a.b.c', 'a.$b.c', 'a.$b.$c.d'];
  for (let path of paths) {
    listeners.add(path, () => val.push(path));
  }

  function run(trigger, exp) {
    val = [];
    listeners.trigger(trigger);
    t.deepEqual(exp, val);
  }

  run('', []);
  run('b', []);
  run('a', ['a']);
  run('a.hello', []);
  run('a.hello.c', ['a.$b.c']);
  run('a.b.c', ['a.b.c', 'a.$b.c']);
  run('a.b.c.d', ['a.$b.$c.d']);
  run('a.b.c.d.e', []);
});

test('trigger non-existing listener should not fail', t => {
  const listeners = new Listeners();
  listeners.trigger('derp');
  t.pass();
});

test('add and call listener', t => {
  const listeners = new Listeners();
  t.plan(1);
  listeners.add('hello', val => t.deepEqual('world', val));
  listeners.trigger('hello', 'world');
});

test('add and remove listener', t => {
  const listeners = new Listeners();
  t.plan(0);
  const ref = listeners.add('hello', () => t.pass());
  listeners.remove(ref);
  listeners.trigger('hello', 'world');
});

test('clear listeners', t => {
  const listeners = new Listeners();
  t.plan(0);
  listeners.add('hello', () => t.pass());
  listeners.clear();
  listeners.trigger('hello', 'world');
});

test('triggering includes path', t => {
  const listeners = new Listeners();
  listeners.add('a.$b.x', (value, {$b, path}) => {
    t.deepEqual('42', $b);
    t.deepEqual('hello', value);
    t.deepEqual('a.42.x', path);
  });
  listeners.trigger('a.42.x', 'hello');
});

test('setPath and getPaths simplest', t => {
  const listeners = new Listeners();
  listeners.setPath('hello.world');
  const paths = listeners.getPaths('hello.world');
  t.deepEqual([{key: 'hello.world', keys: {}, path: 'hello.world'}], paths);
});

test('setPath and getPaths', t => {
  const listeners = new Listeners();
  listeners.setPath('bops.$key.name');
  const paths = listeners.getPaths('bops.abc123.name');
  t.deepEqual([{key: 'bops.$key.name', keys: {$key: 'abc123'}, path: 'bops.abc123.name'}], paths);
});

// test('setPath and getPaths multiple', t => {
//   listeners.setPath('bops.$key.$any');
//   listeners.setPath('bops.$me.name');
//   const paths = listeners.getPaths('bops.abc123.name');
//   console.log(paths);
//   t.deepEqual([
//     {key: 'bops.$key.$any', keys: {$key: 'abc123', $any: 'name'}, path: 'bops.abc123.name'},
//     {key: 'bops.$me.name', keys: {$me: 'abc123'}, path: 'bops.abc123.name'},
//   ], paths);
// });

test('setPath and getPaths a.$b.c', t => {
  const listeners = new Listeners();
  ['a', 'a.b', 'a.b.c', 'a.$b.c', 'a.$b.$c.d'].forEach(path => {
    listeners.setPath(path);
  });
  const paths = listeners.getPaths('a.hello.c');
  t.deepEqual([
    {key: 'a.$b.c', keys: {$b: 'hello'}, path: 'a.hello.c'},
    {key: 'a.$b.$c', keys: {$b: 'hello', $c: 'c'}, path: 'a.hello.c'}
  ], paths);
});

test('wildcard sub-listener', t => {
  const listeners = new Listeners();
  t.plan(2);
  listeners.add('a.>', (val, {path}) => {
    t.deepEqual('a.b.c.d', path);
    t.deepEqual(137, val);
  });
  listeners.trigger('a.b.c.d', 137);
});

test('wildcard wildcard sub-listener', t => {
  const listeners = new Listeners();
  t.plan(3);
  listeners.add('a.$key.>', (val, {path, $key}) => {
    t.deepEqual('a.b.c.d', path);
    t.deepEqual('b', $key);
    t.deepEqual(137, val);
  });
  listeners.trigger('a.b.c.d', 137);
});

test('wildcard wildcard wildcard sub-listener', t => {
  const listeners = new Listeners();
  t.plan(11);
  listeners.add('a.$key.>', (val, {path, $key}) => {
    t.deepEqual('a.b.c.d.e', path);
    t.deepEqual('b', $key);
    t.deepEqual(137, val);
  });
  listeners.add('a.$x.$y.>', (val, {path, $x, $y}) => {
    t.deepEqual('a.b.c.d.e', path);
    t.deepEqual('b', $x);
    t.deepEqual('c', $y);
    t.deepEqual(137, val);
  });
  listeners.add('a.$x.$y.d.>', (val, {path, $x, $y}) => {
    t.deepEqual('a.b.c.d.e', path);
    t.deepEqual('b', $x);
    t.deepEqual('c', $y);
    t.deepEqual(137, val);
  });
  listeners.add('a.$x.$y.e.>', () => {
    t.pass();
  });
  listeners.trigger('a.b.c.d.e', 137);
});

test('wildcard key diff', t => {
  const listeners = new Listeners();
  t.plan(5);
  listeners.add('a.>', (val, {pathDiff}) => {
    t.deepEqual('b.c.d.e', pathDiff);
  });
  listeners.add('a.$b.>', (val, {pathDiff}) => {
    t.deepEqual('c.d.e', pathDiff);
  });
  listeners.add('a.$b.c.>', (val, {pathDiff}) => {
    t.deepEqual('d.e', pathDiff);
  });
  listeners.add('a.$b.>', (val, {pathDiff}) => {
    t.deepEqual('c.d.e', pathDiff);
  });
  listeners.add('a.$b.c.$d.>', (val, {pathDiff}) => {
    t.deepEqual('e', pathDiff);
  });
  listeners.trigger('a.b.c.d.e', 137);
});

test('sub-listeners no trigger on last child', t => {
  const listeners = new Listeners();
  t.plan(0);
  listeners.add('a.b.>', (val, {path}) => {
    t.pass();
    t.deepEqual('a.b.c.d', path);
    t.deepEqual(137, val);
  });
  listeners.trigger('a.b', 137);
  listeners.trigger('a', {b: 137});
});
