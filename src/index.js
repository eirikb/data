const listeners = require('./listeners');

function isProbablyPlainObject(obj) {
  return typeof obj === 'object' && obj !== null && obj.constructor === Object;
}

function get(input, path) {
  path = path.split('.');
  for (let i = 0; i < path.length; i++) {
    input = input[path[i]];
    if (typeof input === 'undefined') return;
  }
  return input;
}

function unset(input, path) {
  if (typeof get(input, path) === 'undefined') return;

  path = path.split('.');
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    if (!isProbablyPlainObject(input[current])) {
      input[current] = {};
    }
    input = input[current];
  }
  delete input[path[path.length - 1]];
}


/***
 *    Flags:
 *    *   Value changed
 *    !   Immediate callback if value exists
 *    +   Value added
 *    -   Value removed
 *    =   Trigger only (no value set)
 *
 *    Path:
 *    $x   Named wildcard
 *    *    Wildcard
 *    **   Recursive wildcard
 *
 *    Example:
 *    on('!+* teams.$teamId.players.$playerId.**', (player, { $teamId, $playerId }) => {
 *
 *    });
 *
 */
module.exports = () => {
  const self = {};
  const setQueue = {};
  const _data = {};
  const _changeListeners = listeners('change');
  const _addListeners = listeners('add');
  const _immediateListeners = listeners('immediate');
  const _removeListeners = listeners('remove');
  const _triggerListeners = listeners('trigger');

  function getListenerByFlag(flag) {
    switch (flag) {
      case '*':
        return _changeListeners;
      case '+':
        return _addListeners;
      case '-':
        return _removeListeners;
      case '=':
        return _triggerListeners;
    }
  }

  function set(toCall, path, parent, key, value, byKey) {
    if (Array.isArray(value)) {
      const toSet = value.reduce((res, item, index) => {
        const nKey = byKey ? item[byKey] : index;
        res[nKey] = item;
        return res;
      }, {});
      set(toCall, path, parent, key, toSet);
      return;
    }

    const hasValue = typeof parent[key] !== 'undefined';

    function call() {
      const trigger = { path, value };
      if (hasValue) {
        toCall.push({ listeners: _changeListeners, ...trigger });
      } else {
        toCall.push({ listeners: _addListeners, ...trigger });
      }
    }

    if (isProbablyPlainObject(value)) {
      if (!isProbablyPlainObject(parent[key])) {
        parent[key] = {};
      }
      for (let childKey of Object.keys(value)) {
        set(toCall, path + '.' + childKey, parent[key], childKey, value[childKey])
      }
      call();
    } else {
      if (parent[key] !== value) {
        parent[key] = value;
        call();
      }
    }
  }

  function triggerImmediate(parts, index = 0, path = []) {
    for (index; index < parts.length; index++) {
      const part = parts[index];
      const data = get(_data, path.join('.'));
      if (/(^\$|^\*$|^\*\*$)/.test(part)) {
        Object.keys(data || {}).forEach(key =>
          triggerImmediate(parts, index + 1, path.concat(key))
        );
        return;
      } else {
        path.push(part);
      }
    }
    path = path.join('.');
    if (typeof get(_data, path) !== 'undefined') {
      trigger(_immediateListeners, path);
    }
  }

  self.set = (path, value, byKey) => {
    if (setQueue[path]) {
      setQueue[path] = { qVal: value };
      return;
    }
    setQueue[path] = true;

    const parts = path.split('.');
    const parentsWithoutValue = [];
    let parent = _data;

    for (let i = 0; i < parts.length - 1; i++) {
      const subPath = parts.slice(0, i + 1).join('.');
      const p = parts[i];
      if (!parent[p]) {
        parentsWithoutValue.push(subPath);
        parent[p] = {};
      }
      parent = parent[p];
    }

    const toCall = [];
    set(toCall, path, parent, parts[parts.length - 1], value, byKey);
    for (let { listeners, path, value } of toCall) {
      trigger(listeners, path, value);
    }

    for (let path of parentsWithoutValue) {
      trigger(_addListeners, path, value);
    }
    let { qVal } = (setQueue[path] || {});
    delete setQueue[path];
    if (typeof qVal !== 'undefined') {
      self.set(path, qVal);
    }
  };

  self.on = (flagsAndPath, listener) => {
    const [flags, path] = flagsAndPath.split(' ').filter(p => p);
    if (!flags || !path) {
      throw new Error(`Missing flags or path. Usage: data.on('!+* players.$id.name', () => {})`);
    }

    const refs = flags.split('').filter(p => p !== '!').map(flag =>
      getListenerByFlag(flag).add(path, listener)
    ).join(' ');

    if (flags.includes('!')) {
      const ref = _immediateListeners.add(path, listener);
      triggerImmediate(path.split('.'));
      _immediateListeners.remove(ref);
    }

    return refs;
  };

  self.off = (refs) => {
    for (let ref of refs.split(' ').map(ref => ref.trim()).filter(ref => ref)) {
      _changeListeners.remove(ref);
      _immediateListeners.remove(ref);
      _addListeners.remove(ref);
      _removeListeners.remove(ref);
      _triggerListeners.remove(ref);
    }
  };

  function trigger(listeners, path, value) {
    const results = listeners.get(path);
    for (let res of results) {
      const listeners = res._;
      res.value = value;
      for (let listener of listeners) {
        if (listener) {
          let val = get(_data, res.path);
          if (typeof val === 'undefined') {
            val = value;
          }
          listener(val, { ...res.keys, path: res.path });
        }
      }
    }
  }

  self.trigger = (path, value) => {
    trigger(_triggerListeners, path, value);
  };

  self.get = (path) => {
    if (!path) return _data;
    return get(_data, path);
  };

  self.unset = (path) => {
    const unsetRecursive = (parent, key, path) => {
      const data = get(parent, key);
      if (isProbablyPlainObject(data)) {
        for (let key of Object.keys(data)) {
          unsetRecursive(data, key, path + '.' + key);
        }
      }
      trigger(_removeListeners, path, data);
    };

    unsetRecursive(_data, path, path);
    unset(_data, path);
  };

  return self;
};
