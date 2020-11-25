import test from 'ava';
import { walk } from '../src/walker';
import { ChangeType } from '../src';

test('add string', t => {
  walk(
    () => false,
    [],
    'hello',
    undefined,
    ({ changeType, newValue, oldValue }) => {
      t.is(changeType, ChangeType.Add);
      t.is(newValue, 'hello');
      t.is(oldValue, undefined);
    }
  );
});

test('update string', t => {
  walk(
    () => false,
    [],
    'hello',
    'world',
    ({ changeType, newValue, oldValue }) => {
      t.is(changeType, ChangeType.Update);
      t.is(newValue, 'hello');
      t.is(oldValue, 'world');
    }
  );
});

test('object add', t => {
  walk(
    () => false,
    [],
    {},
    undefined,
    ({ changeType }) => {
      t.is(changeType, ChangeType.Add);
    }
  );
});

test('object exists', t => {
  t.plan(0);
  walk(
    () => false,
    [],
    {},
    {},
    ({}) => {
      t.pass();
    }
  );
});

test('object add prop', t => {
  walk(
    () => false,
    [],
    {
      a: 'yes',
    },
    {},
    ({ changeType, path }) => {
      t.is(changeType, ChangeType.Add);
      t.deepEqual(path, ['a']);
    }
  );
});

test('object recursive add', t => {
  const changes: [ChangeType, string[]][] = [];
  walk(
    () => false,
    [],
    {
      a: {
        b: {
          c: 'yes',
          d: 'ok',
        },
        f: 'no',
      },
    },
    {
      a: {
        f: 'well',
      },
    },
    ({ changeType, path }) => {
      changes.push([changeType, path]);
    }
  );
  t.deepEqual(changes, [
    [ChangeType.Add, ['a', 'b']],
    [ChangeType.Add, ['a', 'b', 'c']],
    [ChangeType.Add, ['a', 'b', 'd']],
    [ChangeType.Update, ['a', 'f']],
  ]);
});

test('object recursive remove', t => {
  const changes: [ChangeType, string[]][] = [];
  walk(
    () => false,
    [],
    {},
    {
      a: {
        b: {
          c: 'shred me',
          d: 'me sa well',
        },
      },
    },
    ({ changeType, path }) => {
      changes.push([changeType, path]);
    }
  );
  t.deepEqual(changes, [
    [ChangeType.Remove, ['a']],
    [ChangeType.Remove, ['a', 'b']],
    [ChangeType.Remove, ['a', 'b', 'c']],
    [ChangeType.Remove, ['a', 'b', 'd']],
  ]);
});

test('object remove prop', t => {
  walk(
    () => false,
    [],
    {},
    { a: 'yes' },
    ({ changeType, path, newValue, oldValue }) => {
      t.is(changeType, ChangeType.Remove);
      t.deepEqual(path, ['a']);
      t.is(newValue, undefined);
      t.is(oldValue, 'yes');
    }
  );
});

test('array add', t => {
  walk(
    () => false,
    [],
    [],
    undefined,
    ({ changeType }) => {
      t.is(changeType, ChangeType.Add);
    }
  );
});

test('array exists', t => {
  t.plan(0);
  walk(
    () => false,
    [],
    [],
    [],
    ({}) => {
      t.pass();
    }
  );
});

test('array add item', t => {
  walk(
    () => false,
    [],
    ['a'],
    [],
    ({ changeType, newValue, path }) => {
      t.is(changeType, ChangeType.Add);
      t.is(newValue, 'a');
      t.deepEqual(['0'], path);
    }
  );
});

test('array remove item', t => {
  walk(
    () => false,
    [],
    [],
    ['a'],
    ({ changeType, path, newValue, oldValue }) => {
      t.is(changeType, ChangeType.Remove);
      t.is(newValue, undefined);
      t.is(oldValue, 'a');
      t.deepEqual(['0'], path);
    }
  );
});

test('array recursive remove', t => {
  const changes: [ChangeType, string[]][] = [];
  walk(
    () => false,
    [],
    {},
    [{ a: ['a'] }, ['b']],
    ({ changeType, path }) => {
      changes.push([changeType, path]);
    }
  );
  t.deepEqual(changes, [
    [ChangeType.Add, []],
    [ChangeType.Remove, []],
    [ChangeType.Remove, ['0']],
    [ChangeType.Remove, ['0', 'a']],
    [ChangeType.Remove, ['0', 'a', '0']],
    [ChangeType.Remove, ['1']],
    [ChangeType.Remove, ['1', '0']],
  ]);
});
