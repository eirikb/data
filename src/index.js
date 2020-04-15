const listeners = require('./listeners');
const Pathifier = require('./pathifier');
const { clean } = require('./paths');

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
 */

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

module.exports = () => {
  const self = {};
  const setQueue = {};
  const _data = {};
  const _changeListeners = listeners('change');
  const _addListeners = listeners('add');
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

  function set(toCall, path, parent, key, value, byKey, merge) {
    if (Array.isArray(value)) {
      const toSet = value.reduce((res, item, index) => {
        const nKey = byKey ? item[byKey] : index;
        res[nKey] = item;
        return res;
      }, {});
      if (!byKey) {
        self.unset(path);
      }
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
      const parentIsProbablyPlainObject = isProbablyPlainObject(parent[key]);
      if (!parentIsProbablyPlainObject) {
        parent[key] = {};
      }
      const childKeys = Object.keys(value);
      let parentKeysMap = {};
      if (parentKeysMap && !merge) {
        const parentKeys = parentIsProbablyPlainObject ? Object.keys(parent[key]) : [];
        parentKeysMap = parentKeys.reduce((res, key) => (res[key] = true) && res, {});
      }
      for (let childKey of childKeys) {
        if (!merge) {
          delete parentKeysMap[childKey];
        }
        set(toCall, path + '.' + childKey, parent[key], childKey, value[childKey])
      }
      if (!merge) {
        for (let childKey of Object.keys(parentKeysMap)) {
          self.unset(path + '.' + childKey)
        }
      }
      call();
    } else {
      if (parent[key] !== value) {
        parent[key] = value;
        call();
      }
    }
  }

  function triggerImmediate(target, refPaths, listener, parts, index = 0, path = []) {
    for (index; index < parts.length; index++) {
      const part = parts[index];
      const data = get(_data, path.join('.'));
      if (/(^\$|^\*$|^\*\*$)/.test(part)) {
        Object.keys(data || {}).forEach(key =>
          triggerImmediate(target, refPaths, listener, parts, index + 1, path.concat(key))
        );
        return;
      } else {
        path.push(part);
      }
    }
    path = path.join('.');
    if (typeof get(_data, path) !== 'undefined') {

      const immediateListeners = (() => {
        const _listener = listeners('immediate');
        let ref;
        return {
          add(path, listener) {
            ref = _listener.add(path, listener);
          },
          get(path) {
            const res = _listener.get(path);
            _listener.remove(ref);
            return res;
          }
        };
      })();

      immediateListeners.add(parts.join('.'), listener);
      trigger(target, refPaths, immediateListeners, path);
    }
  }

  self.merge = (path, value, byKey) => {
    return self.set(path, value, byKey, true);
  };

  self.set = (path, value, byKey, merge = false) => {
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
    set(toCall, path, parent, parts[parts.length - 1], value, byKey, merge);
    const refPaths = new Set();
    const target = path;
    for (let { listeners, path, value } of toCall) {
      trigger(target, refPaths, listeners, path, value);
    }

    for (let path of parentsWithoutValue) {
      trigger(target, refPaths, _addListeners, path, value);
    }
    let { qVal } = (setQueue[path] || {});
    delete setQueue[path];
    if (typeof qVal !== 'undefined') {
      self.set(path, qVal);
    }
  };

  self.on = (flagsAndPath, listener) => {
    if (!flagsAndPath.includes(' ') && !listener) {
      return Pathifier(self, flagsAndPath);
    }

    const [flags, path] = flagsAndPath.split(' ').filter(p => p);
    if (!flags || !path) {
      throw new Error(`Missing flags or path. Usage: data.on('!+* players.$id.name', () => {})`);
    }

    const refs = flags.split('').filter(p => p !== '!').map(flag =>
      getListenerByFlag(flag).add(path, listener)
    ).join(' ');

    if (flags.includes('!')) {
      const refPaths = new Set();
      const target = clean(path);
      triggerImmediate(target, refPaths, listener, path.split('.'));
    }

    return refs;
  };

  self.off = (refs) => {
    for (let ref of refs.split(' ').map(ref => ref.trim()).filter(ref => ref)) {
      _changeListeners.remove(ref);
      _addListeners.remove(ref);
      _removeListeners.remove(ref);
      _triggerListeners.remove(ref);
    }
  };

  function trigger(target, refPaths, listeners, path, value) {
    const results = listeners.get(path);
    let resultValue;
    for (let res of results) {
      const listeners = res._;
      res.value = value;
      for (let [ref, listener] of listeners) {
        const refPath = ref + res.path;
        if (listener && !refPaths.has(refPath)) {
          refPaths.add(refPath);
          let val = get(_data, res.path);
          if (typeof val === 'undefined') {
            val = value;
          }
          const valIsObject = isProbablyPlainObject(val);
          resultValue = listener(val, {
            target,
            path: res.path,
            ...res.keys,
            ...valIsObject ? {
              values: Object.values(val), keys: Object.keys(val)
            } : {}
          });
        }
      }
    }
    return resultValue;
  }

  self.trigger = (path, value) => {
    return trigger(path, new Set(), _triggerListeners, path, value);
  };

  self.get = (path) => {
    if (!path) return _data;
    return get(_data, path);
  };

  self.unset = (path) => {
    const refPaths = new Set();
    const target = path;
    const unsetRecursive = (parent, key, path) => {
      const data = get(parent, key);
      if (isProbablyPlainObject(data)) {
        for (let key of Object.keys(data)) {
          unsetRecursive(data, key, path + '.' + key);
        }
      }
      if (typeof data !== 'undefined') {
        trigger(target, refPaths, _removeListeners, path, data);
      }
    };

    unsetRecursive(_data, path, path);
    unset(_data, path);
  };

  return self;
};
