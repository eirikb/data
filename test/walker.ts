import test from 'ava';
import { walk } from '../src/walker';
import { ChangeType } from '../src';

test('add string', t => {
  walk([], 'hello', null, ({ changeType, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Add);
    t.is(newValue, 'hello');
    t.is(oldValue, null);
    return true;
  });
});

test('update string', t => {
  walk([], 'hello', 'world', ({ changeType, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Update);
    t.is(newValue, 'hello');
    t.is(oldValue, 'world');
    return true;
  });
});

test('object add', t => {
  walk([], {}, null, ({ changeType }) => {
    t.is(changeType, ChangeType.Add);
    return true;
  });
});

test('object exists', t => {
  t.plan(0);
  walk([], {}, {}, ({}) => {
    t.pass();
    return true;
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
      return true;
    }
  );
});

test('object remove prop', t => {
  walk([], {}, { a: 'yes' }, ({ changeType, path, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.deepEqual(path, ['a']);
    t.is(newValue, undefined);
    t.is(oldValue, 'yes');
    return true;
  });
});

test('array add', t => {
  walk([], [], {}, ({ changeType }) => {
    t.is(changeType, ChangeType.Add);
    return true;
  });
});

test('array exists', t => {
  t.plan(0);
  walk([], [], [], ({}) => {
    t.pass();
    return true;
  });
});

test('array add item', t => {
  walk([], ['a'], [], ({ changeType, newValue, path }) => {
    t.is(changeType, ChangeType.Add);
    t.is(newValue, 'a');
    t.deepEqual(['0'], path);
    return true;
  });
});

test('array remove item', t => {
  walk([], [], ['a'], ({ changeType, path, newValue, oldValue }) => {
    t.is(changeType, ChangeType.Remove);
    t.is(newValue, undefined);
    t.is(oldValue, 'a');
    t.deepEqual(['0'], path);
    return true;
  });
});
