import test from 'ava';
import { ChangeListeners, ChangeType } from '../src';
import { Core, reverseLookup } from '../src/core';

test('add', t => {
  const changeListeners = new ChangeListeners();
  const l = () => true;
  changeListeners.add(ChangeType.Add, 'what.ever.a', l);

  const core = new Core(changeListeners, undefined, ['what', 'ever']);
  core.set({ a: 'one' }, undefined);
  t.pass();
});

test('ensure parent', t => {
  const changeListeners = new ChangeListeners();
  const l = () => true;
  changeListeners.add(ChangeType.Remove, 'hello', l);
  const core = new Core(changeListeners, { hello: 'b' }, ['hello', 'world']);
  core.ensureParentObject();
  t.pass();
});

test('reverse lookup', t => {
  const paths = reverseLookup(
    {
      a: {
        b: {
          c: 'hello',
        },
      },
    },
    ['a', 'b', 'c']
  );
  t.deepEqual(paths, [['a', 'b', 'c']]);
});

test('reverse lookup wildcard', t => {
  const paths = reverseLookup(
    {
      a: {
        b: {
          c: 'hello',
        },
        d: {
          c: 'ok',
        },
      },
    },
    ['a', '*', 'c']
  );
  t.deepEqual(paths, [
    ['a', 'b', 'c'],
    ['a', 'd', 'c'],
  ]);
});

test('reverse lookup wildcard end', t => {
  const paths = reverseLookup(
    {
      a: {
        b: 'b',
        d: 'd',
      },
    },
    ['a', '*']
  );
  t.deepEqual(paths, [['a'], ['a', 'b'], ['a', 'd']]);
});

test('reverse lookup named wildcard', t => {
  const paths = reverseLookup(
    {
      a: {
        b: {
          c: 'hello',
        },
        d: {
          c: 'ok',
        },
      },
    },
    ['a', '$a', 'c']
  );
  t.deepEqual(paths, [
    ['a', 'b', 'c'],
    ['a', 'd', 'c'],
  ]);
});

test('reverse lookup named wildcard end', t => {
  const paths = reverseLookup(
    {
      a: {
        b: 'b',
        d: 'd',
      },
    },
    ['a', '$a']
  );
  t.deepEqual(paths, [['a'], ['a', 'b'], ['a', 'd']]);
});

test('reverse lookup recursive wildcard', t => {
  const paths = reverseLookup(
    {
      a: {
        b: {
          c: 'hello',
        },
        d: {
          c: 'ok',
        },
        e: {
          f: {
            g: 'Huh',
          },
        },
      },
    },
    ['a', '**']
  );
  t.deepEqual(paths, [
    ['a'],
    ['a', 'b'],
    ['a', 'b', 'c'],
    ['a', 'd'],
    ['a', 'd', 'c'],
    ['a', 'e'],
    ['a', 'e', 'f'],
    ['a', 'e', 'f', 'g'],
  ]);
});

/// **** ARRAY ***

test('array reverse lookup', t => {
  const paths = reverseLookup(
    {
      a: [
        {
          c: 'hello',
        },
      ],
    },
    ['a', '0', 'c']
  );
  t.deepEqual(paths, [['a', '0', 'c']]);
});

test('array reverse lookup wildcard', t => {
  const paths = reverseLookup(
    {
      a: [
        {
          c: 'hello',
        },
        {
          c: 'ok',
        },
      ],
    },
    ['a', '*', 'c']
  );
  t.deepEqual(paths, [
    ['a', '0', 'c'],
    ['a', '1', 'c'],
  ]);
});

test('array reverse lookup wildcard end', t => {
  const paths = reverseLookup(
    {
      a: {
        b: 'b',
        d: 'd',
      },
    },
    ['a', '*']
  );
  t.deepEqual(paths, [['a'], ['a', 'b'], ['a', 'd']]);
});

test('array reverse lookup named wildcard', t => {
  const paths = reverseLookup(
    {
      a: [
        {
          c: 'hello',
        },
        {
          c: 'ok',
        },
      ],
    },
    ['a', '$a', 'c']
  );
  t.deepEqual(paths, [
    ['a', '0', 'c'],
    ['a', '1', 'c'],
  ]);
});

test('array reverse lookup named wildcard end', t => {
  const paths = reverseLookup(
    {
      a: ['b', 'd'],
    },
    ['a', '$a']
  );
  t.deepEqual(paths, [['a'], ['a', '0'], ['a', '1']]);
});

test('array reverse lookup recursive wildcard', t => {
  const paths = reverseLookup(
    {
      a: [
        {
          c: 'hello',
        },
        {
          c: 'ok',
        },
        {
          f: {
            g: 'Huh',
          },
        },
      ],
    },
    ['a', '**']
  );
  t.deepEqual(paths, [
    ['a'],
    ['a', '0'],
    ['a', '0', 'c'],
    ['a', '1'],
    ['a', '1', 'c'],
    ['a', '2'],
    ['a', '2', 'f'],
    ['a', '2', 'f', 'g'],
  ]);
});
