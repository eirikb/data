import test from 'ava';
import Data from '../src/data';

test('hello', t => {
  const data = new Data();
  data.on('= a', value => t.deepEqual('hello', value));
  data.trigger('a', 'hello');
  data.on('= a.b.c', value => t.deepEqual('hello', value));
  data.trigger('a.b.c.d', 'WRONG');
  data.trigger('a.b', 'WRONG');
  data.trigger('a.b.c', 'hello');
});

test('get set', t => {
  const data = new Data();
  data.set('test', 'ing');
  t.deepEqual('ing', data.get('test'));
});

test('change flag not trigger on existing', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('* a', val => value = val);
  t.deepEqual(null, value);
});

test('change flag not trigger on add', t => {
  const data = new Data();
  let value = null;
  data.on('* a', val => value = val);
  data.set('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag not trigger on trigger', t => {
  const data = new Data();
  let value = null;
  data.on('* a', val => value = val);
  data.trigger('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag trigger on change', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('* a', val => value = val);
  data.set('a', 'world');
  t.deepEqual('world', value);
});

test('add flag', t => {
  const data = new Data();
  let value = null;
  data.on('+ a', val => value = val);
  data.set('a', 'hello');
  data.set('a', 'world');
  t.deepEqual('hello', value);
});

test('immediate flag', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('! a', val => value = val);
  t.deepEqual('hello', value);
});

test('trigger flag', t => {
  const data = new Data();
  let value = null;
  data.on('= a', val => value = val);
  data.trigger('a', 'hello');
  t.deepEqual('hello', value);
});

test('remove flag', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('- a', () => value = 'removed');
  data.unset('a');
  t.deepEqual('removed', value);
});

test('combine flags', t => {
  const data = new Data();
  let value = null;
  data.set('b', 'one');
  data.on('!*- b', val => value = val);
  t.deepEqual('one', value);
  data.set('b', 'two');
  t.deepEqual('two', value);
  data.unset('b');
  t.deepEqual('two', value);

  data.on('+* a', val => value = val);
  data.set('a', 'one');
  t.deepEqual('one', value);
  data.set('a', 'two');
  t.deepEqual('two', value);
});

test('listener', t => {
  const data = new Data();
  data.on('+ test.ing', value => t.deepEqual({hello: 'world'}, value));
  data.set('test.ing', {hello: 'world'});
});

test('special key paths', t => {
  const data = new Data();
  data.on('+ a.$b.c', (value, {$b}) => {
    t.deepEqual({hello: 'world'}, value);
    t.deepEqual('hello', $b);
  });
  data.set('a.hello.c', {hello: 'world'});
});

test('remove listener', t => {
  const data = new Data();
  let value;
  data.on('+* a', val => value = val);
  const ref = data.on('+* b', val => value = val);

  data.set('a', 'ok');
  t.deepEqual('ok', data.get('a'));
  data.off(ref);
  data.set('b', 'ignored');
  t.deepEqual('ok', data.get('a'));
});

test('on child data', t => {
  const data = new Data();
  t.plan(1);
  data.on('+ player.name', name => t.deepEqual('mini', name));
  data.set('player', {name: 'mini'});
});

test('remove data', t => {
  const data = new Data();
  data.set('a.b', 'hello');
  data.on('- a.b', () => t.pass());
  data.unset('a.b');
});

test('remove includes item', t => {
  const data = new Data();
  data.set('a.b', {hello: 'world'});
  let value;
  data.on('- a.b', val => value = val);
  data.unset('a.b');
  t.deepEqual({hello: 'world'}, value);
});

test('instant callback upon adding listener to existing data', t => {
  const data = new Data();
  data.set('player.name', 'mini');
  t.plan(1);
  data.on('! player.name', val => t.deepEqual('mini', val));
});

test('bop paths', t => {
  const data = new Data();
  t.plan(2);
  data.on('+* quest.bops.$key', (bopData, {$key}) => {
    t.deepEqual('-LNRK0flHBSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flHBSZniioW6YS', {name: 'mini'});
});

test('bop paths 2', t => {
  const data = new Data();
  t.plan(2);
  data.on('+* quest.bops.$key', (bopData, {$key}) => {
    t.deepEqual('-LNRK0flH-BSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flH-BSZniioW6YS', {name: 'mini'});
});

test('previous data can be falsey', t => {
  const data = new Data();
  t.plan(1);
  data.set('a', 0);
  data.on('* a', value => t.deepEqual(1337, value));
  data.set('a', 1337)
});

test('trigger on object property change', t => {
  const data = new Data();
  t.plan(2);

  data.set('player', {x: 0});
  data.on('* player.x', value => t.deepEqual(1337, value));
  data.on('* player', value => t.deepEqual({x: 1337}, value));
  data.set('player', {x: 1337});
});

test('ranged listeners', t => {
  const data = new Data();
  t.plan(4);
  data.on('+* players.$id.{x,y,moving}', ({x, y, moving}, {$id}) => {
    if (x && y && moving) {
      t.deepEqual(1, x);
      t.deepEqual(2, y);
      t.deepEqual(true, moving);
      t.deepEqual('42', $id);
    }
  });

  data.set('players.42', {x: 1});
  data.set('players.42.y', 2);
  data.set('players.42.moving', true);
});

test('ranged listeners change only', t => {
  const data = new Data();
  t.plan(4);
  data.on('* players.$id.{x,y,moving}', ({x, y, moving}, {$id}) => {
    if (x && y && moving) {
      t.deepEqual(3, x);
      t.deepEqual(2, y);
      t.deepEqual(true, moving);
      t.deepEqual('42', $id);
    }
  });

  data.set('players.42', {x: 1});
  data.set('players.42.y', 2);
  data.set('players.42.moving', true);
  data.set('players.42.x', 3);
});

test('immediate listener with wildcard', t => {
  const data = new Data();
  t.plan(4);
  data.set('players.42.items.axe.power', 137);
  data.on('! players.$id.items.$item.power', (power, {$id, $item, path}) => {
    t.deepEqual(137, power);
    t.deepEqual('42', $id);
    t.deepEqual('axe', $item);
    t.deepEqual('players.42.items.axe.power', path);
  });
});

test('ranged listeners immediate', t => {
  const data = new Data();
  // The immediate will be called once for each ranged value
  // This isn't a big deal, and nothing that will be fixed
  t.plan(12);

  data.set('players.42', {x: 3});
  data.set('players.42.y', 2);
  data.set('players.42.moving', true);

  data.on('!+* players.$id.{x,y,moving}', ({x, y, moving}, {$id}) => {
    t.deepEqual(3, x);
    t.deepEqual(2, y);
    t.deepEqual(true, moving);
    t.deepEqual('42', $id);
  });
});

test('unset is recursive', t => {
  const data = new Data();
  data.set('a.b.c', 1);
  data.set('a.b.d', 2);

  t.plan(2);
  data.on('- a.b.$key', () => {
    t.pass();
  });

  data.unset('a');
});

test('initially set values are actually set', t => {
  t.plan(1);
  const d = new Data(({set}) => {
    set('ok.test', 137)
  });
  t.deepEqual(137, d.get('ok.test'));
});

test('remove ranged listeners', t => {
  const data = new Data();
  t.plan(1);
  const ref = data.on('+* x.{a,b}', val =>
    t.deepEqual('ok', val.a)
  );

  data.set('x.a', 'ok');
  data.off(ref);
  data.set('x.a', 'ignored-a');
  data.set('x.b', 'ignored-b');
});
