import {clean} from './paths';

export default (data, from) => {
  if (from.includes('$')) {
    throw new Error('Sorry, no named wildcard support in pathifier');
  }
  const fromHacked = clean(from);
  const refs = [];

  const cache = {};
  const cacheNoMap = {};
  const cacheArray = [];

  let _to, _filter, _sort, _toArray, _map, _then, _on;

  _on = false;

  function sortedIndex(path) {
    const d = cacheNoMap;
    const paths = cacheArray;

    let low = 0;
    let high = paths.length;
    let sort = _sort;
    // Default sort if none is specified
    if (!sort) {
      sort = (_, __, aPath, bPath) => aPath.localeCompare(bPath);
    }

    while (low < high) {
      let mid = (low + high) >>> 1;
      if (sort(d[path], d[paths[mid]], path, paths[mid]) > 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  function setFilter(filter) {
    if (_filter) throw new Error('Sorry, only one filter');
    _filter = filter;
  }

  function setSort(sort) {
    if (_sort) throw new Error('Sorry, only one sort');
    _sort = sort;
  }

  const self = {
    from: fromHacked,
    filter(filter) {
      setFilter(filter);
      return self;
    },
    filterOn(path, filter) {
      setFilter((value) => filter(data.get(path), value));
      refs.push(
        data.on(`!+* ${path}`, () => {
          update();
        })
      );
      return self;
    },
    map(map) {
      if (_map) throw new Error('Sorry, only one map');
      _map = map;
      return self;
    },
    sort(sort) {
      setSort(sort);
      return self;
    },
    sortOn(path, sort) {
      setSort((a, b, aPath, bPath) => sort(data.get(path), a, b, aPath, bPath));
      refs.push(
        data.on(`!+* ${path}`, () => {
          update();
        })
      );
      return self;
    },
    to(path) {
      if (_to) throw new Error('Sorry, only one to');
      _to = path;
      if (!_on) self.on();
      return self;
    },
    then(then) {
      _then = then;
      if (!_on) self.on();
      return self;
    },
    toArray(toArray) {
      if (_toArray) throw new Error('Sorry, only one toArray');
      _toArray = toArray;
      if (!_on) self.on();
      return self;
    },
    on() {
      if (_on) return;
      _on = true;
      refs.push(
        data.on(`!+* ${from}`, (_, {path, target}) => {
          if (path === target) {
            update();
          } else {
            const subPath = target.slice(fromHacked.length + 1);
            const updated = set(subPath, data.get(target));
            if (updated && _then) _then(cache);
          }
        }),
        data.on(`- ${from}`, (_, {target}) => {
          const subPath = target.slice(fromHacked.length + 1);
          const updated = unset(subPath);
          if (updated && _then) _then(cache);
        })
      );
    },
    off() {
      for (let ref of refs) {
        data.off(ref);
      }
      _on = false;
    }
  };

  function update() {
    if (!_to && !_toArray && !_then) return;

    const fromData = data.get(fromHacked);
    if (!fromData) return;

    const a = new Set(Object.keys(fromData || {}));
    const b = new Set(Object.keys(cache || {}));
    let updated = false;
    for (let aa of Array.from(a)) {
      if (set(aa, data.get(keys(fromHacked, aa)))) {
        updated = true;
        b.delete(aa);
      }
    }
    for (let bb of Array.from(b)) {
      unset(bb);
    }
    if (updated && _then) {
      _then(cache);
    }
  }

  function keys(...args) {
    return args.filter(p => p).join('.');
  }

  function set(key, value) {
    const parts = key.split('.');
    const k = parts[0];
    if (_filter && !_filter(data.get(keys(fromHacked, k)))) {
      return false;
    }

    const exists = cache[k];
    const origValue = value;
    if (_map) {
      const path = keys(fromHacked, k);
      value = _map(data.get(path), path);
      key = k;
    }

    if (_to) data.set(keys(_to, key), value);
    setObject(cache, parts, value);
    setObject(cacheNoMap, parts, origValue);
    if (_toArray) {
      if (exists) {
        const oldIndex = cacheArray.indexOf(k);
        cacheArray.splice(oldIndex, 1);
        _toArray.remove(oldIndex, k, cache[k]);
        const index = sortedIndex(k);
        _toArray.add(index, k, cache[k]);
        cacheArray.splice(index, 0, k);
      } else {
        const index = sortedIndex(k);
        _toArray.add(index, k, cache[k]);
        cacheArray.splice(index, 0, k);
      }
    }
    return true;
  }

  function setObject(object, parts, value) {
    const parent = parts.slice(0, -1).reduce((parent, key) => {
      if (!parent[key]) parent[key] = {};
      return parent[key];
    }, object);
    parent[parts[parts.length - 1]] = value;
  }

  function unsetObject(object, parts) {
    const parent = parts.slice(0, -1).reduce((parent, key) => parent[key], object);
    delete parent[parts[parts.length - 1]];
  }

  function unset(path): boolean {
    if (!_to && !_toArray && !_then) return false;

    const parts = path.split('.');
    const k = parts[0];
    if (!cache[k]) return true;

    if (_toArray) {
      const index = cacheArray.indexOf(k);
      _toArray.remove(index, k, cache[k]);
      cacheArray.splice(index, 1);
    }
    unsetObject(cache, parts);
    unsetObject(cacheNoMap, parts);
    if (_to) data.unset(keys(_to, path));
    return true;
  }

  return self;
};
