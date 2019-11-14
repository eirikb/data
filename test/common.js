import test from 'ava';
import { get, pathBrancher } from '../src/common';

test('no fuss', t => {
  const paths = pathBrancher('hello.world', part => part);
  t.deepEqual(paths, ['hello.world']);
});

test('by dollar', t => {
  const paths = pathBrancher('hello.$ok', part =>
    part.startsWith('$') ? ['one', 'two'] : part
  );
  t.deepEqual(paths, ['hello.one', 'hello.two']);
});

test('ranged', t => {
  const r = /[{}]/g;
  const paths = pathBrancher('a.{b,c}.d.{e,f}', part =>
    r.test(part) ? part.replace(r, '').split(',') : part
  );
  t.deepEqual(paths, ['a.b.d.e', 'a.b.d.f', 'a.c.d.e', 'a.c.d.f']);
});

test('by path', t => {

  const o = {
    a: {
      a1: {
        a1b1: 'one',
        a1b2: 'two'
      },
      a2: {
        a2b1: 'three',
        a2b2: 'four'
      }
    }
  };

  const paths = pathBrancher('a.$b.$c', (part, paths) =>
    part.startsWith('$')
      ? paths.map(path => Object.keys(get(o, path)))
      : part
  );

  t.deepEqual(paths, [
    'a.a1.a1b1',
    'a.a1.a1b2',
    'a.a1.a2b1',
    'a.a1.a2b2',
    'a.a2.a1b1',
    'a.a2.a1b2',
    'a.a2.a2b1',
    'a.a2.a2b2'
  ]);
});

test('one by dollar', t => {
  const paths = pathBrancher('players.$id', part =>
    part.startsWith('$') ? ['ok'] : part
  );
  t.deepEqual(paths, ['players.ok']);
});
