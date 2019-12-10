import test from 'ava';
import d from '../src';

test('hello', t => {
  const data = d();
  data.on('= a', value => t.deepEqual('hello', value));
  data.trigger('a', 'hello');
  data.on('= a.b.c', value => t.deepEqual('hello', value));
  data.trigger('a.b.c.d', 'WRONG');
  data.trigger('a.b', 'WRONG');
  data.trigger('a.b.c', 'hello');
});

test('get set', t => {
  const data = d();
  data.set('test', 'ing');
  t.deepEqual('ing', data.get('test'));
});

test('change flag not trigger on existing', t => {
  const data = d();
  let value = null;
  data.set('a', 'hello');
  data.on('* a', val => value = val);
  t.deepEqual(null, value);
});

test('change flag not trigger on add', t => {
  const data = d();
  let value = null;
  data.on('* a', val => value = val);
  data.set('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag not trigger on trigger', t => {
  const data = d();
  let value = null;
  data.on('* a', val => value = val);
  data.trigger('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag trigger on change', t => {
  const data = d();
  let value = null;
  data.set('a', 'hello');
  data.on('* a', val => value = val);
  data.set('a', 'world');
  t.deepEqual('world', value);
});

test('add flag', t => {
  const data = d();
  let value = null;
  data.on('+ a', val => value = val);
  data.set('a', 'hello');
  data.set('a', 'world');
  t.deepEqual('hello', value);
});

test('immediate flag', t => {
  const data = d();
  let value = null;
  data.set('a', 'hello');
  data.on('! a', val => value = val);
  t.deepEqual('hello', value);
});

test('trigger flag', t => {
  const data = d();
  let value = null;
  data.on('= a', val => value = val);
  data.trigger('a', 'hello');
  t.deepEqual('hello', value);
});

test('remove flag', t => {
  const data = d();
  let value = null;
  data.set('a', 'hello');
  data.on('- a', () => value = 'removed');
  data.unset('a');
  t.deepEqual('removed', value);
});

test('combine flags', t => {
  const data = d();
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
  const data = d();
  data.on('+ test.ing', value => t.deepEqual({ hello: 'world' }, value));
  data.set('test.ing', { hello: 'world' });
});

test('special key paths', t => {
  const data = d();
  data.on('+ a.$b.c', (value, { $b }) => {
    t.deepEqual({ hello: 'world' }, value);
    t.deepEqual('hello', $b);
  });
  data.set('a.hello.c', { hello: 'world' });
});

test('remove listener', t => {
  const data = d();
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
  const data = d();
  t.plan(1);
  data.on('+ player.name', name => t.deepEqual('mini', name));
  data.set('player', { name: 'mini' });
});

test('remove data', t => {
  const data = d();
  data.set('a.b', 'hello');
  data.on('- a.b', () => t.pass());
  data.unset('a.b');
});

test('remove includes item', t => {
  const data = d();
  data.set('a.b', { hello: 'world' });
  let value;
  data.on('- a.b', val => value = val);
  data.unset('a.b');
  t.deepEqual({ hello: 'world' }, value);
});

test('instant callback upon adding listener to existing data', t => {
  const data = d();
  data.set('player.name', 'mini');
  t.plan(1);
  data.on('! player.name', val => t.deepEqual('mini', val));
});

test('bop paths', t => {
  const data = d();
  t.plan(2);
  data.on('+* quest.bops.$key', (bopData, { $key }) => {
    t.deepEqual('-LNRK0flHBSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flHBSZniioW6YS', { name: 'mini' });
});

test('bop paths 2', t => {
  const data = d();
  t.plan(2);
  data.on('+* quest.bops.$key', (bopData, { $key }) => {
    t.deepEqual('-LNRK0flH-BSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flH-BSZniioW6YS', { name: 'mini' });
});

test('previous data can be falsey', t => {
  const data = d();
  t.plan(1);
  data.set('a', 0);
  data.on('* a', value => t.deepEqual(1337, value));
  data.set('a', 1337)
});

test('trigger on object property change', t => {
  const data = d();
  t.plan(2);

  data.set('player', { x: 0 });
  data.on('* player.x', value => t.deepEqual(1337, value));
  data.on('* player', value => t.deepEqual({ x: 1337 }, value));
  data.set('player', { x: 1337 });
});

test('immediate listener with wildcard', t => {
  const data = d();
  t.plan(4);
  data.set('players.42.items.axe.power', 137);
  data.on('! players.$id.items.$item.power', (power, { $id, $item, path }) => {
    t.deepEqual(137, power);
    t.deepEqual('42', $id);
    t.deepEqual('axe', $item);
    t.deepEqual('players.42.items.axe.power', path);
  });
});

test('unset is recursive', t => {
  const data = d();
  data.set('a.b.c', 1);
  data.set('a.b.d', 2);

  t.plan(2);
  data.on('- a.b.$key', () => {
    t.pass();
  });

  data.unset('a');
});

test('methods support destructuring', t => {
  t.plan(1);
  const data = d();
  const { set, get } = data;
  set('ok.test', 137);

  t.deepEqual(137, get('ok.test'));
});

test('adding sub-child triggers add on parent if parent missing', t => {
  const { on, set } = d();
  t.plan(1);
  on('+ x.$key', val =>
    t.deepEqual('ok', val.a)
  );
  set('x.test.a', 'ok');
});

test('on/off on test', t => {
  const { on, off, set } = d();
  t.plan(2);
  set('test', 'a');
  const l = on('* test', val =>
    t.deepEqual('b', val)
  );

  set('test', 'b');

  on('* test', val =>
    t.deepEqual('c', val)
  );
  off(l);

  set('test', 'c');
});

test('set is recursive', t => {
  const data = d();
  t.plan(1);
  data.on('!+* players.$eh.name', () => t.pass());
  data.set('players', { eirik: { name: 'Eirik' } });
});

test('immediate with key', t => {
  const data = d();
  t.plan(1);
  data.set('players.ok', 'ok');
  data.on('! players.$eh', () => t.pass());
});

test('immediate with multiple', t => {
  const data = d();
  t.plan(2);
  data.set('players', {
    '20': 'twenty',
    '30': 'thirty'
  });
  data.on('! players.$eh', () => t.pass());
});

test('Wildcard immediate listeners never go wild', t => {
  const data = d();
  t.plan(2);
  data.set('test', {
    1: 'hello',
    2: 'world'
  });
  data.on('! test.$id', (test, { path }) => {
    t.notDeepEqual(path, 'test.1.2');
  });
});

test('Immediate false trigger', t => {
  const data = d();
  t.plan(1);
  data.set('test', false);
  data.on('! test', (test) => {
    t.deepEqual(false, test);
  });
});

test('Listeners trigger order', t => {
  const data = d();

  let counter = 0;
  data.on('+* a.b.c', c => {
    t.deepEqual('d', c);
    t.deepEqual(0, counter);
    counter++;
  });
  data.on('+* a.b', b => {
    t.deepEqual({ c: 'd' }, b);
    t.deepEqual(1, counter);
    counter++;
  });
  data.on('+* a', a => {
    if (a === false) return;

    t.deepEqual({ b: { c: 'd' } }, a);
    t.deepEqual(2, counter);
    counter++;
  });

  data.set('a', false);
  data.set('a', {
    b: {
      c: 'd'
    }
  });
});

test('Adding sub-thing trigger change on parent', t => {
  const data = d();
  data.set('users.1.name', 'Hello');
  t.plan(2);
  data.on('+ users.$id.*', (user, { $id }) => {
    t.deepEqual('1', $id);
    t.deepEqual('137', user.x);
  });
  data.set('users.1.x', '137');
});

test('Update bundle changes', t => {
  const data = d();
  data.set('users.1.name', 'Hello');
  t.plan(3);

  data.on('* users.$id', () => t.pass());
  data.on('+ users.$id.x', x => t.deepEqual(137, x));
  data.on('* users.$id.name', name => t.deepEqual('world', name));

  data.set('users.1', {
    name: 'world',
    x: 137
  });
});

test('Immediate only when has data', t => {
  const data = d();
  t.plan(1);
  data.on('! a', t.pass);
  data.set('a', true);
  data.on('! a', t.pass);
});

test('Listeners only called once', t => {
  const data = d();

  let counter = 0;
  data.on('!+* a', () => {
      counter++
    }
  );

  data.set('a', { 1: 'yes', 2: 'no' });
  t.deepEqual(1, counter);
});

test('Overwrite parent path should not clear data', t => {
  const data = d();
  data.set('a', { b: 'yes' });
  t.deepEqual({ b: 'yes' }, data.get('a'));
  data.set('a', { b: 'yes' });
  t.deepEqual({ b: 'yes' }, data.get('a'));
});

test('Setting value while listening', t => {
  const data = d();

  data.on('+* hello', i => {
    if (i < 2) {
      data.set('hello', 2)
    }
  });

  let i = 0;
  data.on('+* hello', hello => {
    t.deepEqual(++i, hello);
  });
  data.set('hello', 1);
  t.pass();
});

test('Only call on change', t => {
  const data = d();

  t.plan(1);
  data.on('!*+ a', t.pass);
  data.set('a', true);
  data.set('a', true);
  data.set('a', true);
});

test('Arrays', t => {
  const data = d();

  t.plan(4);
  data.on('!+* test.$id.a', t.pass);
  data.set('test', [{ a: 1 }, { a: 2 }]);
  data.set('test', [{ a: 1 }, { a: 2 }]);
});

test('Array with key', t => {
  const data = d();

  data.set('a', [{ a: 'a', name: 'ok' }, { a: 'b', name: 'yes' }], 'a');
  t.deepEqual(data.get(), {
    a: {
      a: {
        a: 'a', name: 'ok'
      },
      b: {
        a: 'b', name: 'yes'
      }
    }
  });
});

test('set replaces, but does not remove', t => {
  const data = d();

  t.plan(3);

  data.on('* a', t.pass);
  data.on('* a.b', t.pass);
  data.on('- a', t.pass);
  data.on('- a.b', t.pass);
  data.on('- a.c', t.pass);

  data.set('a', { b: 1, c: 2 });
  data.set('a', { b: 2 });
});

test('merge does not remove at all', t => {
  const data = d();

  t.plan(2);

  data.on('* a', t.pass);
  data.on('* a.b', t.pass);
  data.on('- a', t.pass);
  data.on('- a.b', t.pass);
  data.on('- a.c', t.pass);

  data.merge('a', { b: 1, c: 2 });
  data.merge('a', { b: 2 });
});

test('values is passed in the object', t => {
  const data = d();

  t.plan(2);
  data.on('+ stuff', (_, { keys, values }) => {
    t.deepEqual(keys, ['0']);
    t.deepEqual(values, [{ hello: 'world' }]);
  });

  data.set('stuff', [{ hello: 'world' }]);
});

test('values is passed in the object with byKey', t => {
  const data = d();

  t.plan(2);
  data.on('+ stuff', (_, { keys, values }) => {
    t.deepEqual(keys, ['a', 'b']);
    t.deepEqual(values, [{ name: 'a', hello: 'world' }, { name: 'b', hello: 'there' }]);
  });

  data.set('stuff',
    [{ name: 'a', hello: 'world' }, { name: 'b', hello: 'there' }],
    'name');
});

test('array without bykey must be cleared', t => {
  const data = d();

  t.plan(2);

  data.on('- a', t.pass);
  data.on('- a.*', t.pass);

  t.plan(2);
  data.on('+ stuff', (_, { keys, values }) => {
    t.deepEqual(keys, ['0']);
    t.deepEqual(values, [{ hello: 'world' }]);
  });

  data.set('stuff', [{ hello: 'world' }]);
});
