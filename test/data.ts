import test from 'ava';
import { Data } from '../src/data';

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
  data.on('* a', val => (value = val));
  t.deepEqual(value, null);
});

test('change flag not trigger on add', t => {
  const data = new Data();
  let value = null;
  data.on('* a', val => (value = val));
  data.set('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag not trigger on trigger', t => {
  const data = new Data();
  let value = null;
  data.on('* a', val => (value = val));
  data.trigger('a', 'hello');
  t.deepEqual(null, value);
});

test('change flag trigger on change', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('* a', val => (value = val));
  data.set('a', 'world');
  t.deepEqual('world', value);
});

test('add flag', t => {
  const data = new Data();
  let value = null;
  data.on('+ a', val => (value = val));
  data.set('a', 'hello');
  data.set('a', 'world');
  t.deepEqual('hello', value);
});

test('immediate flag', t => {
  const data = new Data();
  let value = null;
  data.set('a', 'hello');
  data.on('! a', val => (value = val));
  t.deepEqual('hello', value);
});

test('trigger flag', t => {
  const data = new Data();
  let value = null;
  data.on('= a', val => (value = val));
  data.trigger('a', 'hello');
  t.deepEqual('hello', value);
});

test('remove flag', t => {
  const data = new Data();
  data.set('a', 'hello');
  data.on('- a', () => t.pass());
  data.unset('a');
});

test('combine flags', t => {
  const data = new Data();
  let value = null;
  data.set('b', 'one');
  data.on('!*- b', (val, { oldValue }) => {
    value = val || oldValue;
  });
  t.deepEqual('one', value);
  data.set('b', 'two');
  t.deepEqual('two', value);
  data.unset('b');
  t.deepEqual('two', value);

  data.on('+* a', val => (value = val));
  data.set('a', 'one');
  t.deepEqual('one', value);
  data.set('a', 'two');
  t.deepEqual('two', value);
});

test('listener', t => {
  const data = new Data();
  data.on('+ test.ing', value => t.deepEqual({ hello: 'world' }, value));
  data.set('test.ing', { hello: 'world' });
});

test('special key paths', t => {
  const data = new Data();
  data.on('+ a.$b.c', (value, { $b }) => {
    t.deepEqual({ hello: 'world' }, value);
    t.deepEqual('hello', $b);
  });
  data.set('a.hello.c', { hello: 'world' });
});

test('remove listener', t => {
  const data = new Data();
  let value;
  data.on('+* a', val => (value = val));
  const ref = data.on('+* b', val => (value = val));

  data.set('a', 'ok');
  t.deepEqual('ok', data.get('a'));
  t.deepEqual('ok', value);
  data.off(ref);
  data.set('b', 'ignored');
  t.deepEqual('ok', data.get('a'));
  t.deepEqual('ok', value);
});

test('on child data', t => {
  const data = new Data();
  t.plan(1);
  data.on('+ player.name', name => t.deepEqual('mini', name));
  data.set('player', { name: 'mini' });
});

test('remove data', t => {
  const data = new Data();
  data.set('a.b', 'hello');
  data.on('- a.b', () => t.pass());
  data.unset('a.b');
});

test('remove includes item', t => {
  const data = new Data();
  data.set('a.b', { hello: 'world' });
  let value;
  data.on('- a.b', (_, { oldValue }) => (value = oldValue));
  data.unset('a.b');
  t.deepEqual({ hello: 'world' }, value);
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
  data.on<any>('+* quest.bops.$key', (bopData, { $key }) => {
    t.deepEqual('-LNRK0flHBSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flHBSZniioW6YS', { name: 'mini' });
});

test('bop paths 2', t => {
  const data = new Data();
  t.plan(2);
  data.on<any>('+* quest.bops.$key', (bopData, { $key }) => {
    t.deepEqual('-LNRK0flH-BSZniioW6YS', $key);
    t.deepEqual('mini', bopData.name);
  });
  data.set('quest.bops.-LNRK0flH-BSZniioW6YS', { name: 'mini' });
});

test('previous data can be falsey', t => {
  const data = new Data();
  t.plan(1);
  data.set('a', 0);
  data.on<any>('* a', value => t.deepEqual(1337, value));
  data.set('a', 1337);
});

// Not how it works now
// test('trigger on object property change', t => {
//   const data = new Data();
//   t.plan(2);
//
//   data.set('player', { x: 0 });
//   data.on('* player.x', value => t.deepEqual(1337, value));
//   data.on('* player', value => t.deepEqual({ x: 1337 }, value));
//   data.set('player', { x: 1337 });
// });

test('immediate listener with wildcard', t => {
  const data = new Data();
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
  const data = new Data();
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
  const data = new Data();
  data.set('ok.test', 137);

  t.deepEqual(137, data.get('ok.test'));
});

test('adding sub-child triggers add on parent if parent missing', t => {
  const data = new Data();
  t.plan(1);
  data.on<any>('+ x.$key', val => t.deepEqual('ok', val.a));
  data.set('x.test.a', 'ok');
});

test('on/off on test', t => {
  const data = new Data();
  t.plan(2);
  data.set('test', 'a');
  const l = data.on('* test', val => t.deepEqual('b', val));

  data.set('test', 'b');

  data.on('* test', val => t.deepEqual('c', val));
  data.off(l);

  data.set('test', 'c');
});

test('set is recursive', t => {
  const data = new Data();
  t.plan(1);
  data.on('!+* players.$eh.name', () => t.pass());
  data.set('players', { eirik: { name: 'Eirik' } });
});

test('immediate with key', t => {
  const data = new Data();
  t.plan(1);
  data.set('players.ok', 'ok');
  data.on('! players.$eh', () => t.pass());
});

test('immediate with multiple', t => {
  const data = new Data();
  t.plan(2);
  data.set('players', {
    '20': 'twenty',
    '30': 'thirty',
  });
  data.on('! players.$eh', () => t.pass());
});

test('Wildcard immediate listeners never go wild', t => {
  const data = new Data();
  t.plan(2);
  data.set('test', {
    1: 'hello',
    2: 'world',
  });
  data.on('! test.$id', (_, { path }) => {
    t.notDeepEqual(path, 'test.1.2');
  });
});

test('Immediate false trigger', t => {
  const data = new Data();
  t.plan(1);
  data.set('test', false);
  data.on('! test', test => {
    t.deepEqual(false, test);
  });
});

// This is probably specific for previous walk behaviour
// test('Listeners trigger order', t => {
//   const data = new Data();
//
//   let counter = 0;
//   data.on('+* a.b.c', c => {
//     t.deepEqual('d', c);
//     t.deepEqual(0, counter);
//     counter++;
//   });
//   data.on('+* a.b', b => {
//     t.deepEqual({ c: 'd' }, b);
//     t.deepEqual(1, counter);
//     counter++;
//   });
//   data.on('+* a', a => {
//     if (a === false) return;
//
//     t.deepEqual({ b: { c: 'd' } }, a);
//     t.deepEqual(2, counter);
//     counter++;
//   });
//
//   data.set('a', false);
//   data.set('a', {
//     b: {
//       c: 'd',
//     },
//   });
// });

test('Adding sub-thing trigger change on parent', t => {
  const data = new Data();
  data.set('users.1.name', 'Hello');
  t.plan(2);
  data.on<any>('+ users.$id.*', (user, { $id }) => {
    t.deepEqual('1', $id);
    t.deepEqual('137', user.x);
  });
  data.set('users.1.x', '137');
});

test('Update bundle changes', t => {
  const data = new Data();
  data.set('users.1.name', 'Hello');
  t.plan(2);

  // Not how it works now
  // data.on('* users.$id', () => t.pass());
  data.on('+ users.$id.x', x => t.deepEqual(137, x));
  data.on('* users.$id.name', name => t.deepEqual('world', name));

  data.set('users.1', {
    name: 'world',
    x: 137,
  });
});

test('Immediate only when has data', t => {
  const data = new Data();
  t.plan(1);
  data.on('! a', t.pass);
  data.set('a', true);
  data.on('! a', t.pass);
});

test('Listeners only called once', t => {
  const data = new Data();

  let counter = 0;
  data.on('!+* a', () => {
    counter++;
  });

  data.set('a', { 1: 'yes', 2: 'no' });
  t.deepEqual(1, counter);
});

test('Overwrite parent path should not clear data', t => {
  const data = new Data();
  data.set('a', { b: 'yes' });
  t.deepEqual({ b: 'yes' }, data.get('a'));
  data.set('a', { b: 'yes' });
  t.deepEqual({ b: 'yes' }, data.get('a'));
});

test('Setting value while listening', t => {
  const data = new Data();

  data.on<any>('+* hello', i => {
    if (i < 2) {
      data.set('hello', 2);
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
  const data = new Data();

  t.plan(1);
  data.on('!*+ a', t.pass);
  data.set('a', true);
  data.set('a', true);
  data.set('a', true);
});

test('Arrays', t => {
  const data = new Data();

  t.plan(2);
  data.on('!+* test.$id.a', t.pass);
  data.set('test', [{ a: 1 }, { a: 2 }]);
});

test('Array without', t => {
  const data = new Data();

  data.set('a', [
    { a: 'a', name: 'ok' },
    { a: 'b', name: 'yes' },
  ]);
  t.deepEqual(data.get(), {
    a: [
      {
        a: 'a',
        name: 'ok',
      },
      {
        a: 'b',
        name: 'yes',
      },
    ],
  });
});

test('Array with key', t => {
  const data = new Data();

  data.set(
    'a',
    [
      { a: 'a', name: 'ok' },
      { a: 'b', name: 'yes' },
    ],
    'a'
  );
  t.deepEqual(data.get(), {
    a: {
      a: {
        a: 'a',
        name: 'ok',
      },
      b: {
        a: 'b',
        name: 'yes',
      },
    },
  });
});

test('set replaces, but does not remove', t => {
  const data = new Data();

  t.plan(2);

  data.on('* a', t.pass);
  data.on('* a.b', t.pass);
  data.on('- a', t.pass);
  data.on('- a.b', t.pass);
  data.on('- a.c', t.pass);

  data.set('a', { b: 1, c: 2 });
  data.set('a', { b: 2 });
});

// test('merge does not remove at all', t => {
//   const data = new Data();
//
//   t.plan(2);
//
//   data.on('* a', t.pass);
//   data.on('* a.b', t.pass);
//   data.on('- a', t.pass);
//   data.on('- a.b', t.pass);
//   data.on('- a.c', t.pass);
//
//   data.merge('a', { b: 1, c: 2 });
//   data.merge('a', { b: 2 });
// });

// test('values is passed in the object', t => {
//   const data = new Data();
//
//   t.plan(2);
//   data.on('+ stuff', (_, { keys, values }) => {
//     t.deepEqual(keys, ['0']);
//     t.deepEqual(values, [{ hello: 'world' }]);
//   });
//
//   data.set('stuff', [{ hello: 'world' }]);
// });

// test('values is passed in the object with byKey', t => {
//   const data = new Data();
//
//   t.plan(2);
//   data.on('+ stuff', (_, { keys, values }) => {
//     t.deepEqual(keys, ['a', 'b']);
//     t.deepEqual(values, [
//       { name: 'a', hello: 'world' },
//       { name: 'b', hello: 'there' },
//     ]);
//   });
//
//   data.set(
//     'stuff',
//     [
//       { name: 'a', hello: 'world' },
//       { name: 'b', hello: 'there' },
//     ],
//     'name'
//   );
// });

// test('array without bykey must be cleared', t => {
//   const data = new Data();
//
//   t.plan(2);
//
//   data.on('- a', t.pass);
//   data.on('- a.*', t.pass);
//
//   t.plan(2);
//   data.on('+ stuff', (_, { keys, values }) => {
//     t.deepEqual(keys, ['0']);
//     t.deepEqual(values, [{ hello: 'world' }]);
//   });
//
//   data.set('stuff', [{ hello: 'world' }]);
// });

test('trigger can return', async t => {
  const data = new Data();

  data.on('= myTrigger', async input => {
    return `Hello, ${input}`;
  });

  const res = await data.trigger('myTrigger', 'world!');
  t.deepEqual('Hello, world!', res);
});

test('Multiple instant listeners', t => {
  t.plan(3);

  const data = new Data();
  data.set('yes', 'yes');
  data.on('! yes', () => {
    t.pass();
    data.on('! yes', () => {
      t.pass();
      data.on('! yes', t.pass);
    });
  });
});

test('Wild-wildcard once for multiple including paths for singles', t => {
  t.plan(3);
  const data = new Data();

  let hack: (res: any) => void;
  data.on('!+* players.*', players => {
    hack(players);
  });

  hack = (res: any) =>
    t.deepEqual(res, {
      a: { name: 'a' },
      b: { name: 'b' },
      c: { name: 'c' },
    });
  data.set('players', {
    a: { name: 'a' },
    b: { name: 'b' },
    c: { name: 'c' },
  });

  hack = (res: any) =>
    t.deepEqual(res, {
      a: { name: 'a' },
      b: { name: 'b' },
      c: { name: 'c' },
      d: { name: 'd' },
    });
  data.set('players.d.name', 'd');

  hack = (res: any) =>
    t.deepEqual(res, {
      a: { name: 'a' },
      b: { name: 'b' },
      c: { name: 'c' },
      d: { name: 'd' },
      e: { name: 'e' },
    });
  data.set('players.e', { name: 'e' });
});

test('Wild-wildcard once for multiple including paths for singles on immediate', t => {
  t.plan(1);
  const data = new Data();
  data.set('players', {
    a: { name: 'a' },
    b: { name: 'b' },
    c: { name: 'c' },
  });
  data.on('!+* players.*', players => {
    t.deepEqual(players, {
      a: { name: 'a' },
      b: { name: 'b' },
      c: { name: 'c' },
    });
  });
});

// test('Generic get', t => {
//   const data = new Data();
//
//   interface Ok {
//     name: string;
//   }
//
//   const ok: Ok = {
//     name: 'Hello',
//   };
//
//   data.set('ok', ok);
//   t.is('Hello', data.get<Ok>('ok').name);
// });

test('Generic on', t => {
  const data = new Data();

  interface Ok {
    name: string;
  }

  const ok: Ok = {
    name: 'Hello',
  };

  data.on<Ok>('!+* ok', ok => {
    t.is(ok.name, 'Hello');
  });
  data.set('ok', ok);
});

// TODO:
// test('Generic pathifier', t => {
//   const data = new Data();
//
//   interface Ok {
//     name: string;
//   }
//
//   const ok: Ok = {
//     name: 'Hello',
//   };
//
//   data.on<Ok>('oks').then(res => {
//     t.is('Hello', res.a.name);
//   });
//   data.set('oks.a', ok);
// });

test('full path', t => {
  t.plan(3);

  const data = new Data();
  data.set('test.a', 'no');
  data.on('+* test.*', (_, { fullPath, path, subPath }) => {
    t.is(fullPath, 'test.a');
    t.is('test', path);
    t.is('a', subPath);
  });
  data.set('test.a', 'yes');
});

test('child path', t => {
  const data = new Data();

  data.on('!+* test.$', (_, { child }) => {
    t.is(child('yes'), 'test.a.yes');
  });

  data.set('test.a', ':)');
});

test('unset', async t => {
  const data = new Data();

  data.on('- test', t.pass);
  data.set('test', 'ing');
  data.set('test', '');
  data.unset('test');
});
