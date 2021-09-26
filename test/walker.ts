import test from 'ava';
import { walk, remove } from '../src/walker';
import { ChangeType } from '../src/listeners';

test('add string', t => {
  walk([], 'hello', undefined, ({ changeType, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Add);
    t.is(newValue, 'hello');
    t.is(oldValue, undefined);
    return false;
  });
});

test('update string', t => {
  walk([], 'hello', 'world', ({ changeType, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Update);
    t.is(newValue, 'hello');
    t.is(oldValue, 'world');
    return false;
  });
});

test('remove string', t => {
  remove([], 'hello', ({ changeType, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.is(oldValue, 'hello');
    return false;
  });
});

test('remove object string', t => {
  remove(['a'], 'hello', ({ changeType, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.is(oldValue, 'hello');
    return false;
  });
});

test('object add', t => {
  walk([], {}, undefined, ({ changeType }) => {
    t.is(changeType, ChangeType.Add);
    return false;
  });
});

test('object exists', t => {
  t.plan(0);
  walk([], {}, {}, ({}) => {
    t.pass();
    return false;
  });
});

test('object add prop', t => {
  walk(
    [],
    {
      a: 'yes',
    },
    {},
    ({ changeType, path }) => {
      t.is(changeType, ChangeType.Add);
      t.deepEqual(path, ['a']);
      return false;
    }
  );
});

test('object recursive add', t => {
  const changes: [ChangeType, string[]][] = [];
  walk(
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
      return false;
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
      return false;
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
  walk([], {}, { a: 'yes' }, ({ changeType, path, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.deepEqual(path, ['a']);
    t.is(newValue, undefined);
    t.is(oldValue, 'yes');
    return false;
  });
});

test('array add', t => {
  walk([], [], undefined, ({ changeType }) => {
    t.is(changeType, ChangeType.Add);
    return false;
  });
});

test('array exists', t => {
  t.plan(0);
  walk([], [], [], ({}) => {
    t.pass();
    return false;
  });
});

test('array add item', t => {
  walk([], ['a'], [], ({ changeType, newValue, path }) => {
    t.is(changeType, ChangeType.Add);
    t.is(newValue, 'a');
    t.deepEqual(['0'], path);
    return false;
  });
});

test('array remove item', t => {
  walk([], [], ['a'], ({ changeType, path, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.is(newValue, undefined);
    t.is(oldValue, 'a');
    t.deepEqual(['0'], path);
    return false;
  });
});

test('array recursive remove', t => {
  const changes: [ChangeType, string[]][] = [];
  walk([], {}, [{ a: ['a'] }, ['b']], ({ changeType, path }) => {
    changes.push([changeType, path]);
    return false;
  });
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
