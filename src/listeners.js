const {get, set, clone} = require('./common');

module.exports = (prefix) => {
  const self = {};
  let next = 1;
  let _listeners = {};
  const _listenersLookupTable = {};
  const _paths = {};

  self.setPath = (path) => {
    path = path.replace(/\$/g, '$.');
    const orig = get(_paths, path);
    if (!orig) {
      set(_paths, path, true);
    }
  };

  self.getPaths = (path) => {
    const parts = path.split('.');
    const paths = [];

    function children(res, parent, i) {
      if (i >= parts.length) return;

      const key = parts[i];

      if (res.wildKey) {
        res.key.push(key);
        children(res, {}, i + 1);
        return;
      }

      if (parent.$) {
        for (let wild of Object.keys(parent.$)) {
          const wildKey = '$' + wild;
          const branch = clone(res);
          branch.key.push(wildKey);
          paths.push(branch);
          branch.keys[wildKey] = key;
          children(branch, parent.$[wild], i + 1);
        }
      }

      if (parent['>']) {
        const branch = clone(res);
        branch.wildKey = branch.key.concat('>');
        paths.push(branch);
        children(branch, {}, i + 1);
      }

      res.key.push(key);

      const next = parent[key];
      if (next) {
        children(res, parent[key], i + 1);
      } else {
        res.dead = true;
      }
    }

    const first = {key: [], keys: {}};
    paths.push(first);
    children(first, _paths, 0);
    return paths.filter(res => {
      if (res.dead) return false;
      res.key = (res.wildKey || res.key).join('.');
      if (res.wildKey) {
        res.pathDiff = parts.slice(res.wildKey.length - 1).join('.');
      }
      res.path = path;
      return true;
    });
  };

  self.add = (path, listener) => {
    self.setPath(path);

    const listeners = _listeners[path] = _listeners[path] || [];
    const ref = [prefix, next].join('-');
    next++;
    const wrapper = {
      listener, ref
    };
    listeners.push(wrapper);
    _listenersLookupTable[ref] = path;
    return ref;
  };

  self.remove = (ref) => {
    const key = _listenersLookupTable[ref];
    delete _listenersLookupTable[ref];
    const listeners = _listeners[key];
    if (!listeners) return;

    if (listeners.length === 1) {
      delete _listeners[key];
      return;
    }
    const wrapperIndex = listeners.findIndex(wrapper => wrapper.ref === ref);
    if (wrapperIndex >= 0) {
      listeners.splice(wrapperIndex, 2);
    }
  };

  /**
   *
   * @param path
   * @param value
   * @returns {Array}
   */
  self.trigger = (path, value) => {
    const paths = self.getPaths(path);

    let result = [];

    for (let {key, keys, path, pathDiff} of paths) {
      for (let {listener} of (_listeners[key] || [])) {
        result.push(
          listener(value, Object.assign({path, pathDiff}, keys))
        );
      }
    }
    return result.length === 1 ? result[0] : result;
  };

  self.clear = () => {
    _listeners = {};
  };

  return self;
};