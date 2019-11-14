module.exports = () => {
  const self = {};
  const map = {};
  const refs = {};

  self.add = (path, ref, input) => {
    refs[ref] = path;
    const parts = path.split('.');
    let parent = map;
    for (let part of parts) {
      if (part === '*' || part.startsWith('$')) {
        parent = parent.$ = parent.$ || {};
      } else if (part === '**') {
        parent = parent.$$ = parent.$$ || {};
        break;
      } else {
        parent = parent._ = parent._ || {};
      }
      parent = parent[part] = parent[part] || {};
    }
    parent.h = parent.h || {};
    parent.h[ref] = input;
  };

  function lookup(result, parent, parts, index = 0, keys = [], until = -1) {
    for (; index < parts.length; index++) {
      if (!parent) {
        return;
      }
      const part = parts[index];
      if (parent.$) {
        for (let key of Object.keys(parent.$)) {
          const newKeys = keys.slice();
          if (key !== '*' && key !== '**') {
            until = index;
            newKeys[index] = key;
          }
          lookup(result, parent.$[key], parts, index + 1, newKeys, until);
        }
      }
      if (parent.$$) {
        if (parent.$$.h) {
          break;
        }
      }
      if (parent._) {
        until = index;
        parent = parent._[part];
      } else {
        return;
      }
    }

    if (parent && !parent.h && parent.$$) {
      parent = parent.$$;
    }

    if (parent && parent.h) {
      const keysMap = keys.reduce((res, val, index) => {
        if (val) res[val] = parts[index];
        return res;
      }, {});

      const res = {
        keys: keysMap, _: parent.h,
        path: (until >= 0 ? parts.slice(0, until + 1) : parts).join('.')
      };
      result.push(res);
    }
  }

  self.lookup = path => {
    const parts = path.split('.');
    const result = [];
    lookup(result, map, parts);
    return result;
  };

  self.remove = ref => {
    const path = refs[ref];
    if (!path) return;

    const parts = path.split('.');
    let parent = map;
    for (let part of parts) {
      if (part.startsWith('$')) {
        parent = parent.$[part];
      } else if (part === '**') {
        parent = parent.$$;
        break;
      } else {
        parent = parent._[part];
      }
    }
    delete parent.h[ref];
    if (Object.keys(parent.h).length === 0) {
      delete parent.h;
    }
  };

  return self;
};
