import test from 'ava';
import Listeners from '../src/listeners';

test('static listener', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a', listener);
  listeners.add('a.b.c', listener);
  t.deepEqual(listeners.get('a'), [{
    keys: {}, path: 'a', _: [['ref-1', listener]], fullPath: 'a'
  }]);
  t.deepEqual(listeners.get('a.b'), []);
  t.deepEqual(listeners.get('a.b.c'), [{
    keys: {}, path: 'a.b.c', _: [['ref-2', listener]], fullPath: 'a.b.c'
  }]);
  t.deepEqual(listeners.get('a.b.c.d'), []);
  t.deepEqual(listeners.get('a.c.c'), []);
});

test('dynamic listener', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.$b', listener);
  listeners.add('a.$b.$c.d', listener);
  t.deepEqual(listeners.get('a.c'), [{
    path: 'a.c', _: [['ref-1', listener]], keys: {$b: 'c'}, fullPath: 'a.c'
  }]);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b.c'), []);
  t.deepEqual(listeners.get('a.b.c.d'), [{
    path: 'a.b.c.d', _: [['ref-2', listener]], keys: {$b: 'b', $c: 'c'}, fullPath: 'a.b.c.d'
  }]);
});

test('add and remove listener', t => {
  const listeners = Listeners();
  const ref = listeners.add('hello', () => t.pass());
  listeners.remove(ref);
  t.deepEqual(0, listeners.get('hello').length);
});

test('add and remove dynamic listener', t => {
  const listeners = Listeners();
  const ref = listeners.add('hello.$x', () => t.pass());
  listeners.remove(ref);
  t.deepEqual(0, listeners.get('hello.world').length);
});

test('wildcard key middle', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.*.b.*.c', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), []);
  t.deepEqual(listeners.get('a.b.c'), []);
  t.deepEqual(listeners.get('a.b.c.d'), []);
  t.deepEqual(listeners.get('a.x.b.y.c'), [{
    keys: {}, path: 'a.x.b.y.c', _: [['ref-1', listener]], fullPath: 'a.x.b.y.c'
  }]);
  t.deepEqual(listeners.get('a.x.b.y.c.d'), []);
});

test('wildcard key end', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.b.*', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), []);
  t.deepEqual(listeners.get('a.b.c'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b.c'
  }]);
});


test('multiple wildcard key end', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('*.b.*.*', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), []);
  t.deepEqual(listeners.get('a.b.c'), []);
  t.deepEqual(listeners.get('a.b.c.d'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b.c.d'
  }]);
});

test('recursive wildcard', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.b.**', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b'
  }]);
  t.deepEqual(listeners.get('a.b.c'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b.c'
  }]);
  t.deepEqual(listeners.get('a.b.c.d'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b.c.d'
  }]);
  t.deepEqual(listeners.get('a.b.c.d.e'), [{
    keys: {}, path: 'a.b', _: [['ref-1', listener]], fullPath: 'a.b.c.d.e'
  }]);
});

test('recursive wildcard and wildcard', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.*.**', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), [{
    keys: {}, path: 'a', _: [['ref-1', listener]], fullPath: 'a.b'
  }]);
  t.deepEqual(listeners.get('a.b.c'), [{
    keys: {}, path: 'a', _: [['ref-1', listener]], fullPath: 'a.b.c'
  }]);
  t.deepEqual(listeners.get('a.b.c.d'), [{
    keys: {}, path: 'a', _: [['ref-1', listener]], fullPath: 'a.b.c.d'
  }]);
  t.deepEqual(listeners.get('a.b.c.d.e'), [{
    keys: {}, path: 'a', _: [['ref-1', listener]], fullPath: 'a.b.c.d.e'
  }]);
});

test('recursive wildcard and wildcard 2', t => {
  const listeners = Listeners();
  const listener = () => true;
  listeners.add('a.*.c.**', listener);
  t.deepEqual(listeners.get('a'), []);
  t.deepEqual(listeners.get('a.b'), []);
  t.deepEqual(listeners.get('a.b.c'), [{
    keys: {}, path: 'a.b.c', _: [['ref-1', listener]], fullPath: 'a.b.c'
  }]);
  t.deepEqual(listeners.get('a.b.c.d'), [{
    keys: {}, path: 'a.b.c', _: [['ref-1', listener]], fullPath: 'a.b.c.d'
  }]);
  t.deepEqual(listeners.get('a.b.c.d.e'), [{
    keys: {}, path: 'a.b.c', _: [['ref-1', listener]], fullPath: 'a.b.c.d.e'
  }]);
});

test('off on non-existing listener', t => {
  const listeners = Listeners();
  listeners.remove('unknown');
  t.pass();
});

test('wildcard plus key', t => {
  const listeners = Listeners();
  const ll1 = () => true;
  const ll2 = () => true;
  listeners.add('users.$id.x', ll1);
  listeners.add('users.$id.name', ll2);

  t.deepEqual(listeners.get('users.1.x'),
    [{
      keys: {$id: '1'}, path: 'users.1.x', _: [['ref-1', ll1]], fullPath: 'users.1.x'
    }]);
  t.deepEqual(listeners.get('users.1.name'),
    [{
      keys: {$id: '1'}, path: 'users.1.name', _: [['ref-2', ll2]], fullPath: 'users.1.name'
    }]);
});