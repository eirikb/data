const listeners = require('./listeners');
const {get, set, unset, isPlainObject, clone, isEqual} = require('./common');

/***
 *    *   Value changed
 *    !   Immediate callback if value exists
 *    +   Value added
 *    -   Value removed
 *    =   Trigger only (no value set)
 *
 *    $   Named wildcard
 *
 *    {x,y,z} Ranged listener,
 *            triggers on any of the values when any of the values are set
 *
 */
module.exports = () => {
  const self = {};
  const _data = {};
  const _changeListeners = listeners('change');
  const _addListeners = listeners('add');
  const _immediateListeners = listeners('immediate');
  const _removeListeners = listeners('remove');
  const _triggerListeners = listeners('trigger');
  const _afterListeners = listeners('after');
  const _aliases = {};
  let pathsFired;

  function _set(path, value, data) {
    const hasData = typeof data !== 'undefined';

    const equal = isEqual(data, value);
    if (equal) {
      return;
    }

    // Trigger add on parents
    const paths = path.split('.');
    const parentPathsWithoutValue = [];
    for (let i = paths.length - 2; i >= 0; i--) {
      const parentPath = paths.slice(0, i + 1).join('.');
      const parentObject = get(_data, parentPath);
      if (!parentObject) {
        parentPathsWithoutValue.push(parentPath);
      } else {
        break;
      }
    }

    if (isPlainObject(value)) {
      for (let [key, val] of Object.entries(value)) {
        const subPath = path + '.' + key;
        if (!hasData) {
          set(_data, subPath, {});
        }
        _set(subPath, val, data && data[key]);
      }
    } else {
      set(_data, path, value);
    }

    if (!hasData) {
      _addListeners.trigger(path, value);
      pathsFired[path] = true;
    } else {
      _changeListeners.trigger(path, value);
      pathsFired[path] = true;
    }

    for (let parentPath of parentPathsWithoutValue) {
      _addListeners.trigger(parentPath, get(_data, parentPath));
      pathsFired[parentPath] = true;
    }

    return true;
  }

  function triggerAlias(path, cb) {
    const parts = path.split('.');
    for (let i = 0; i <= parts.length; i++) {
      const subPath = parts.slice(0, i).join('.');
      if (_aliases[subPath]) {
        const diff = parts.slice(i).join('.');
        for (let [key, value] of Object.entries(_aliases[subPath])) {
          const aliasPath = [key, diff].filter(p => p).join('.');
          cb(aliasPath, value.unaliasOnUnset);
        }
      }
    }
  }

  self.set = (path, value) => {
    triggerAlias(path, aliasPath => self.set(aliasPath, value));
    const data = get(_data, path);
    unset(_data, path);
    pathsFired = {};
    const res = _set(path, value, data);
    Object.keys(pathsFired).forEach(path =>
      _afterListeners.trigger(path)
    );
    return res;
  };

  self.update = (path, value) => {
    triggerAlias(path, aliasPath => self.update(aliasPath, value));
    if (!isPlainObject(value)) {
      return self.set(path, value);
    }

    for (let key of Object.keys(value)) {
      self.update(path + '.' + key, value[key]);
    }
    return true;
  };

  self.unset = (path) => {
    triggerAlias(path, (aliasPath, unaliasOnUnset) => {
      self.unset(aliasPath);
      if (unaliasOnUnset) self.unalias(aliasPath);
    });
    const unsetRecursive = (parent, key, path) => {
      const data = get(parent, key);
      if (isPlainObject(data)) {
        for (let key of Object.keys(data)) {
          unsetRecursive(data, key, path + '.' + key);
        }
      }
      _removeListeners.trigger(path, data);
    };

    unsetRecursive(_data, path, path);
    unset(_data, path);
  };

  self.on = (pathAndFlags, listener) => {
    const [flags, path] = pathAndFlags.split(' ').filter(p => p);
    if (!flags || !path) {
      throw new Error('Missing flags or path');
    }

    const paths = path.split('.');
    const lastPath = paths.pop();
    if (lastPath.indexOf('{') === 0) {
      const parts = lastPath.replace(/[{}]/g, '').split(',');

      let values = {};
      let prevValues = {};
      let prevB = {};
      const preTriggers = parts.reduce((res, part) => {
        const fullPath = paths.concat(part).join('.');
        return res + ' ' + self.on(`${flags} ${fullPath}`, (a, b) => {
          prevB = b;
          const path = b.path.split('.').slice(0, -1);
          values = parts.reduce((res, prop) => {
            res[prop] = get(_data, path.concat(prop).join('.'));
            return res;
          }, {});
        });
      }, '');
      const afterTriggers = parts.reduce((res, part) => {
        const fullPath = paths.concat(part).join('.');
        return res + ' ' + _afterListeners.add(fullPath, () => {
          if (!isEqual(values, prevValues)) {
            listener(values, prevB);
          }
          prevValues = clone(values);
        });
      }, '');
      // Immediate hack
      parts.forEach(part => {
        const fullPath = paths.concat(part).join('.');
        _afterListeners.trigger(fullPath);
      });
      return preTriggers + ' ' + afterTriggers;
    }

    const refs = flags.split('').reduce((refs, flag) =>
      refs + ' ' + self.getListenerByFlag(flag).add(path, listener)
      , '');

    function recursiveImmediateTrigger(parent, pathIndex, b) {
      const path = paths[pathIndex];
      if (!path) {
        b.path = b.path.join('.');
        _afterListeners.trigger(b.path);
        listener(parent, b);
        return;
      }

      if (path.charAt(0) === '$') {
        for (let key of Object.keys(parent)) {
          const c = clone(b);
          c[path] = key;
          c.path.push(key);
          recursiveImmediateTrigger(get(parent, key), pathIndex + 1, c);
        }
      } else {
        const value = get(parent, path);
        b.path.push(path);
        if (value) {
          recursiveImmediateTrigger(value, pathIndex + 1, b);
        }
      }
    }

    if (flags.match(/!/)) {
      // paths was changed (lastPath removed) in the ranged listener setup
      paths.push(lastPath);
      recursiveImmediateTrigger(_data, 0, {path: []});
    }

    return refs;
  };

  self.getListenerByFlag = (flag) => {
    switch (flag) {
      case '*':
        return _changeListeners;
      case '!':
        return _immediateListeners;
      case '+':
        return _addListeners;
      case '-':
        return _removeListeners;
      case '=':
        return _triggerListeners;
    }
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

  self.trigger = (path, value) => {
    triggerAlias(path, aliasPath => self.trigger(aliasPath, value));
    return _triggerListeners.trigger(path, value);
  };

  self.get = (path) => {
    if (!path) return _data;
    return get(_data, path);
  };

  self.alias = (to, from, unaliasOnUnset) => {
    if ((_aliases[to] || {}).from === from) {
      return;
    }
    self.unalias(to);
    _set(to, get(_data, from));
    _aliases[from] = _aliases[from] || {};
    _aliases[from][to] = {unaliasOnUnset};
  };

  self.unalias = (to) => {
    self.unset(to);
    const from = Object.entries(_aliases).find(([, t]) => t[to]);
    if (from) {
      delete _aliases[from[0]][to];
    }
  };

  return self;
};
