//mapping/aliasing can be done by convenience

import test from 'ava';
import Data from '../src';

test('setting and retrieving alias data', t => {
  const data = Data();
  data.set('bops.someid', {nick: 'mini'});
  data.alias('quest.user', 'bops.someid');
  t.deepEqual({nick: 'mini'}, data.get('quest.user'));
});

test('alias add listener', t => {
  const data = Data();
  t.plan(1);
  data.on('+ quest.user.nick', nick => t.deepEqual('mini', nick));
  data.alias('quest.user', 'bops.someid');
  data.set('bops.someid', {nick: 'mini'});
});

test('alias change listener', t => {
  const data = Data();
  t.plan(1);
  data.set('bops.someid', {nick: 'large'});
  data.on('* quest.user.nick', nick => t.deepEqual('mini', nick));
  data.alias('quest.user', 'bops.someid');
  data.set('bops.someid', {nick: 'mini'});
});

test('alias immediate listener', t => {
  const data = Data();
  t.plan(2);
  data.set('bops.someid', {nick: 'mini'});
  data.alias('quest.user', 'bops.someid');
  data.on('! quest.user.nick', nick => t.deepEqual('mini', nick));
  data.on('! quest.user', user => t.deepEqual({nick: 'mini'}, user));
});

test('alias trigger listener', t => {
  const data = Data();
  t.plan(1);
  data.alias('quest.user', 'bops.someid');
  data.on('= quest.user', user => t.deepEqual({nick: 'mini'}, user));
  data.trigger('bops.someid', {nick: 'mini'});
});

test('alias remove listener', t => {
  const data = Data();
  t.plan(1);
  data.set('bops.someid', {nick: 'mini'});
  data.alias('quest.user', 'bops.someid');
  data.on('- quest.user', user => t.deepEqual({nick: 'mini'}, user));
  data.unset('bops.someid');
});

test('re-aliasing should remove all listeners', t => {
  const data = Data();
  t.plan(1);
  data.set('bops.someid1', {nick: 'large1'});
  data.set('bops.someid2', {nick: 'large2'});
  data.on('* quest.user.nick', nick => t.deepEqual('mini2', nick));
  data.alias('quest.user', 'bops.someid1');
  data.alias('quest.user', 'bops.someid2');
  data.set('bops.someid1', {nick: 'mini1'});
  data.set('bops.someid2', {nick: 'mini2'});
});

test('alias is actual reference, to save memory', t => {
  const data = Data();
  t.plan(2);
  const user = {nick: 'mini'};
  data.set('bops.someid', user);
  user.hack = 'yes';
  data.alias('quest.user', 'bops.someid');
  data.on('! quest.user.nick', nick => t.deepEqual('mini', nick));
  data.on('! quest.user', user => t.deepEqual('yes', user.hack));
});

test('alias with wildcard support', t => {
  const data = Data();
  t.plan(3);
  data.set('bops.someid', {nick: 'large'});
  data.on('* quest.$wat.nick', (nick, {$wat, path}) => {
    t.deepEqual('mini', nick);
    t.deepEqual('user', $wat);
    t.deepEqual('quest.user.nick', path);
  });
  data.alias('quest.user', 'bops.someid');
  data.set('bops.someid', {nick: 'mini'});
});

test('alias does not delete original', t => {
  const data = Data();
  data.alias('quest.user', 'bops.someid');
  data.set('bops.someid', {nick: 'mini'});
  t.deepEqual('mini', data.get('bops.someid.nick'));
  t.deepEqual('mini', data.get('quest.user.nick'));
  data.alias('quest.user', 'bops.someid2');
  t.deepEqual({nick: 'mini'}, data.get('bops.someid'));
  t.deepEqual('mini', data.get('bops.someid.nick'));
  t.deepEqual(undefined, data.get('quest.user.nick'));
});

test('alias wildcard add listener', t => {
  const data = Data();
  t.plan(2);
  data.on('+ quest.map.$key.nick', (nick, {$key}) => {
    t.deepEqual('mini', nick);
    t.deepEqual('k1', $key);
  });
  data.alias('quest.map', 'quest.bops');
  data.set('quest.bops.k1', {nick: 'mini'});
});


test('alias wildcard change listener', t => {
  const data = Data();
  t.plan(2);
  data.set('quest.bops.k1', {nick: 'large'});
  data.on('* quest.map.$key.nick', (nick, {$key}) => {
    t.deepEqual('mini', nick);
    t.deepEqual('k1', $key);
  });
  data.alias('quest.map', 'quest.bops');
  data.set('quest.bops.k1', {nick: 'mini'});
});

test('alias wildcard immediate listener', t => {
  const data = Data();
  t.plan(4);
  data.set('quest.bops.k1', {nick: 'mini'});
  data.alias('quest.map', 'quest.bops');
  data.on('! quest.map.$key.nick', (nick, {$key}) => {
    t.deepEqual('mini', nick);
    t.deepEqual('k1', $key);
  });
  data.on('! quest.map.$key', (user, {$key}) => {
    t.deepEqual({nick: 'mini'}, user);
    t.deepEqual('k1', $key);
  });
});

test('re-aliasing same to and from should be ignored', t => {
  const data = Data();
  t.plan(1);
  data.set('bops.someid1', {nick: 'large1'});
  data.on('* quest.user.nick', nick => t.deepEqual('mini1', nick));
  data.alias('quest.user', 'bops.someid1');
  data.alias('quest.user', 'bops.someid1');
  data.set('bops.someid1', {nick: 'mini1'});
});
