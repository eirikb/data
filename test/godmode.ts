import test from 'ava';
import { ToArrayTransformer } from '../src/transformers';
import { GodMode } from '../src/godmode';
import { Pathifier } from '../src/pathifier';
import { Data } from '../src/data';

interface Stuff {
  test: string[];
}

interface Stuff2 {
  test: string[];
  tast: { [key: string]: string };
}

interface A {
  t: string;
}

interface Hello {
  hello: string[];
}

function initHello(): [string[], GodMode<Hello>] {
  const ha: string[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, ha));
  const hg = new GodMode<Hello>(d, { hello: ['hello', 'world'] });
  f.put(0, hg.don('hello.*'));
  return [ha, hg];
}

test('get hello', t => {
  const d = new Data();
  const g = new GodMode<{ hello: string }>(d, { hello: 'world' });
  t.is(g.data.hello, 'world');
});

test('set hello', t => {
  const d = new Data();
  const g = new GodMode<{ hello: string }>(d, { hello: 'world' });
  g.data.hello = ':D';
  t.is(g.data.hello, ':D');
});

test('hello array', t => {
  const [, hg] = initHello();
  t.deepEqual(hg.data.hello, ['hello', 'world']);
  t.is(hg.data.hello[0], 'hello');
  t.is(hg.data.hello[1], 'world');
});

test('push array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.push(':D');
  t.deepEqual(hg.data.hello, ['hello', 'world', ':D']);
  t.deepEqual(ha, ['hello', 'world', ':D']);
  hg.data.hello.push(':O');
  t.deepEqual(hg.data.hello, ['hello', 'world', ':D', ':O']);
  t.deepEqual(ha, ['hello', 'world', ':D', ':O']);
});

test('reverse array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.reverse();
  t.deepEqual(hg.data.hello, ['world', 'hello']);
  t.deepEqual(ha, ['world', 'hello']);
});

test('pop array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.pop();
  t.deepEqual(hg.data.hello, ['hello']);
  t.deepEqual(ha, ['hello']);
});

test('shift array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.shift();
  t.deepEqual(hg.data.hello, ['world']);
  t.deepEqual(ha, ['world']);
});

test('splice array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.splice(0, 1);
  t.deepEqual(hg.data.hello, ['world']);
  t.deepEqual(ha, ['world']);
});

test('unshift array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.unshift(':D');
  t.deepEqual(hg.data.hello, [':D', 'hello', 'world']);
  t.deepEqual(ha, [':D', 'hello', 'world']);
});

test('sort array', t => {
  const [ha, hg] = initHello();
  hg.data.hello.push('A');
  hg.data.hello.sort();
  t.deepEqual(hg.data.hello, ['A', 'hello', 'world']);
  t.deepEqual(ha, ['A', 'hello', 'world']);
});

test('set X array', t => {
  const d = new Data();
  const g = new GodMode<{ hello: string[] }>(d, {
    hello: ['yes', 'hello', 'world'],
  });
  g.data.hello[1] = ':O';
  t.deepEqual(g.data.hello, ['yes', ':O', 'world']);
});

test('flat 1', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff>(d, { test: [] });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => 'lol' + x)
  );

  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'lolb', 'lolc']);
});

test('flat 2', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => [x, g.don(`tast.${x}`)])
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Y']);
});

test('flat 3', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => [x, g.don(`tast.${x}`)])
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  g.data.tast.c = 'Z';
  t.deepEqual(array, ['a', 'b', 'X', 'c', 'Z']);
});

test('flat 5', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff2>(d, { test: [], tast: {} });

  f.put(0, 'a');
  f.put(
    1,
    g.don('test.$').map(x => g.don(`tast.${x}`))
  );

  g.data.tast = { b: 'X', c: 'Y' };
  g.data.test = ['b', 'c'];
  t.deepEqual(array, ['a', 'X', 'Y']);
  g.data.tast.c = 'Z';
  t.deepEqual(array, ['a', 'X', 'Z']);
});

test('flat 6', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Stuff>(d, { test: [] });

  f.put(
    1,
    d.don('test.$').map(l => l + 's')
  );
  t.deepEqual(array, []);

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);
  g.data.test = ['lol'];
  t.deepEqual(array, ['a', 'lols', 'd']);
});

test('flat 7', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{
    a: string[];
    b: { [key: string]: string };
  }>(d, { a: [], b: {} });

  f.put(
    1,
    g.don('a.$').map(l => g.don(`b.${l}`))
  );
  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  g.data.b.lol = 'yeah';
  g.data.a = ['lol'];
  t.deepEqual(array, ['a', 'yeah', 'd']);
});

test('flat 9', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a?: string }>(d, {});

  f.put(1, g.don('a'));

  f.put(0, 'a');
  t.deepEqual(array, ['a']);
  f.put(2, 'd');
  t.deepEqual(array, ['a', 'd']);

  g.data.a = 'yes';
  t.deepEqual(array, ['a', 'yes', 'd']);
  g.data.a = undefined;
  t.deepEqual(array, ['a', 'd']);
});

test('flat 10', t => {
  const array: any[] = [];
  const d = new Data();

  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a?: string[]; b: string[] }>(d, { a: [], b: [] });

  f.put(0, 'a');

  f.put(
    1,
    g.don('a.$').map(_ => g.don('b.$'))
  );

  f.put(2, 'd');

  g.data.b = ['X', 'Y'];
  g.data.a = ['A', 'whatever this will not be printed :P'];

  t.deepEqual(array, ['a', 'X', 'Y', 'X', 'Y', 'd']);
  g.data.a = undefined;
  t.deepEqual(array, ['a', 'd']);
});

test('it', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a: A[] }>(d, { a: [] });

  f.put(
    0,
    g
      .don(g.path().a.$)
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  g.data.a = [{ t: 'a' }, { t: 'b' }, { t: 'c' }];
  t.deepEqual(array, ['c', 'b']);
});

test('stop start', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a: A[] }>(d, { a: [] });

  f.put(
    0,
    g
      .don(g.path().a.$)
      .sort((a, b) => b.t.localeCompare(a.t))
      .slice(0, 2)
      .map(v => v.t)
  );
  f.stop();
  g.data.a = [{ t: 'a' }, { t: 'b' }, { t: 'c' }];
  t.deepEqual(array, []);
  f.start();
  t.deepEqual(array, ['c', 'b']);
});

test('No callstack please', async t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ a: A[] }>(d, { a: [] });
  f.put(0, g.don('test'));
  g.on('!+*', 'test', val => {
    t.deepEqual(val, { hello: 'world' });
  });
  g.set('test', {
    hello: 'world',
  });
  g.on('!+*', 'test', val => {
    t.deepEqual(val, { hello: 'world' });
  });
  t.deepEqual(array, [{ hello: 'world' }]);
});

test('Proxy', async t => {
  t.plan(1);

  const d = new Data();
  const g = new GodMode<{ input: { hello: string } }>(d, {
    input: { hello: 'world' },
  });

  g.on('+!*', 'input', v => {
    t.deepEqual(v, { hello: 'world' });
  });
});

test('godMode 3', async t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<any>(d, {});
  f.put(
    0,
    d.don('users.$.*').map(u => u.name)
  );

  g.data.users = [{ name: 'hello' }, { name: 'world' }];
  g.data.users[0].name = 'wut';
  g.set('users.0.name', 'wut');
  t.deepEqual(array, ['wut', 'world']);
  g.data.users[1] = { name: 'wat' };
  t.deepEqual(array, ['wut', 'wat']);
  g.data.users.push({ name: ':)' });
  t.deepEqual(array, ['wut', 'wat', ':)']);
});

test('array is hacked for now', async t => {
  interface User {
    name: string;
  }

  interface Data {
    users: User[];
  }

  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Data>(d, { users: [] });
  f.put(
    0,
    d.don('users.$id').map(u => u.name)
  );

  g.data.users = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'B', 'C']);
  g.data.users = [{ name: 'A' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'C']);
  g.data.users = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'B', 'C']);
  g.data.users.splice(1, 1);
  t.deepEqual(array, ['A', 'C']);
});

test('array is hacked for reverse', async t => {
  interface User {
    name: string;
  }

  interface Data {
    users: User[];
  }

  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<Data>(d, { users: [] });
  f.put(
    0,
    d.don('users.$id').map(u => u.name)
  );

  g.data.users = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'B', 'C']);
  g.data.users = [{ name: 'A' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'C']);
  g.data.users = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
  t.deepEqual(array, ['A', 'B', 'C']);
  g.data.users.reverse();
  t.deepEqual(array, ['C', 'B', 'A']);
});

test('twice the slice', t => {
  const array: any[] = [];
  const d = new Data();
  const f = new Pathifier(d, new ToArrayTransformer(d, array));
  const g = new GodMode<{ stuff: string[] }>(d, { stuff: [] });
  f.put(0, d.don('stuff.$'));

  g.data.stuff = ['A', 'B', 'C'];
  t.deepEqual(array, ['A', 'B', 'C']);
  g.data.stuff.splice(0, 1);
  t.deepEqual(array, ['B', 'C']);
  g.data.stuff.splice(0, 1);
  t.deepEqual(array, ['C']);
  g.data.stuff.splice(0, 1);
  t.deepEqual(array, []);
});
