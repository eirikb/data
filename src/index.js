const listeners = require('./listeners');
const {get, set, unset, isPlainObject, isEqual} = require('./common');

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
  const _aliases = {};

  self.set = (path, value, ignoreEqualCheck) => {
    const data = get(_data, path);

    const equal = isEqual(data, value);
    if (!ignoreEqualCheck && equal) {
      return false;
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

    set(_data, path, value);

    if (!equal && isPlainObject(value)) {
      for (let [key, val] of Object.entries(value)) {
        const subPath = path + '.' + key;
        if (!data || typeof data[key] === 'undefined') {
          _addListeners.trigger(subPath, val);
        } else {
          _changeListeners.trigger(subPath, val);
        }
      }
    }

    if (typeof data === 'undefined') {
      _addListeners.trigger(path, value);
    } else {
      _changeListeners.trigger(path, value);
    }

    for (let parentPath of parentPathsWithoutValue) {
      _addListeners.trigger(parentPath, get(_data, parentPath));
    }

    return true;
  };

  self.update = (path, value, ignoreEqualCheck) => {
    if (!isPlainObject(value)) {
      return self.set(path, value, ignoreEqualCheck);
    }

    for (let key of Object.keys(value)) {
      self.update(path + '.' + key, value[key], ignoreEqualCheck);
    }
    return true;
  };

  self.unset = (path) => {
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

      return parts.reduce((res, part) => {
        const fullPath = paths.concat(part).join('.');
        return res + ' ' + self.on(`${flags} ${fullPath}`, (a, b) => {
          const triggeredPath = b.path.split('.').slice(0, -1);

          const ret = parts.reduce((res, part) => {
            res[part] = self.get(triggeredPath.concat(part).join('.'));
            return res;
          }, {});

          listener(ret, b);
        });
      }, '');
    }

    const refs = flags.split('').reduce((refs, flag) =>
      refs + ' ' + self.getListenerByFlag(flag).add(path, listener)
      , '');

    function recursiveImmediateTrigger(parent, pathIndex, b) {
      const path = paths[pathIndex];
      if (!path) {
        b.path = b.path.join('.');
        listener(parent, b);
        return;
      }

      if (path.charAt(0) === '$') {
        for (let key of Object.keys(parent)) {
          b[path] = key;
          b.path.push(key);
          recursiveImmediateTrigger(get(parent, key), pathIndex + 1, b);
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
    return _triggerListeners.trigger(path, value);
  };

  self.get = (path) => {
    return get(_data, path);
  };

  self.alias = (to, from) => {
    if ((_aliases[to] || {}).from === from) {
      return;
    }
    self.unalias(to);

    _aliases[to] = {
      from,
      refs: [
        self.on('!+* ' + from + '.>', (value, {path, pathDiff}) =>
          self.set(to + '.' + pathDiff, value, true)
        ),
        self.on('!+* ' + from, (value) =>
          self.set(to, value, true)
        ),
        self.on('- ' + from, value =>
          self.unset(to, value, true)
        ),
        self.on('= ' + from, (value) =>
          self.trigger(to, value, true)
        )
      ]
    };
  };

  self.unalias = (to) => {
    const refs = (_aliases[to] || {}).refs || [];
    if (refs.length === 0) return;

    self.unset(to);
    for (let ref of refs) {
      self.off(ref);
    }
    delete _aliases[to];
  };

  return self;
};