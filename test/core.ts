import test from 'ava';
import { ChangeListeners, ChangeType } from '../src';
import { Core } from '../src/core';

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
