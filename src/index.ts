import Listeners, { ImmediateListeners } from './listeners';
import createPathifier from './pathifier';
import { clean } from './paths';
import { Callback, Data, LooseObject, Pathifier, ToCall } from './types';
export * from './types';

function isProbablyPlainObject(obj: any) {
  return typeof obj === 'object' && obj !== null && obj.constructor === Object;
}

function get(input: LooseObject, path: string) {
  const paths = path.split('.');
  for (let i = 0; i < paths.length; i++) {
    input = input[paths[i]];
    if (typeof input === 'undefined') return;
  }
  return input;
}

function unset(input: LooseObject, path: string) {
  if (typeof get(input, path) === 'undefined') return;

  const paths = path.split('.');
  for (let i = 0; i < paths.length - 1; i++) {
    const current = paths[i];
    if (!isProbablyPlainObject(input[current])) {
      input[current] = {};
    }
    input = input[current];
  }
  delete input[paths[paths.length - 1]];
}

export default () => {
  const self = {} as Data;
  const setQueue: LooseObject = {};
  const _data: LooseObject = {};
  const _changeListeners = new Listeners('change');
  const _addListeners = new Listeners('add');
  const _removeListeners = new Listeners('remove');
  const _triggerListeners = new Listeners('trigger');

  function getListenerByFlag(flag: string) {
    switch (flag) {
      case '*':
        return _changeListeners;
      case '+':
        return _addListeners;
      case '-':
        return _removeListeners;
      case '=':
      default:
        return _triggerListeners;
    }
  }

  function setSet(path: string, value: any, byKey?: string, merge?: boolean) {
    if (setQueue[path]) {
      setQueue[path] = { qVal: value };
      return;
    }
    setQueue[path] = true;

    const parts = path.split('.');
    const parentsWithoutValue: string[] = [];
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

    const toCall: ToCall[] = [];
    set(toCall, path, parent, parts[parts.length - 1], value, byKey, merge);
    const refPaths = new Set<string>();
    const target = path;
    for (let { listeners, path, value } of toCall) {
      trigger(target, refPaths, listeners, path, value);
    }

    for (let path of parentsWithoutValue) {
      trigger(target, refPaths, _addListeners, path, value);
    }
    let { qVal } = setQueue[path] || {};
    delete setQueue[path];
    if (typeof qVal !== 'undefined') {
      setSet(path, qVal);
    }
  }

  function set(
    toCall: ToCall[],
    path: string,
    parent: LooseObject,
    key: string,
    value: any,
    byKey?: string,
    merge = false
  ) {
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
      let parentKeysMap: LooseObject = {};
      if (parentKeysMap && !merge) {
        const parentKeys = parentIsProbablyPlainObject
          ? Object.keys(parent[key])
          : [];
        parentKeysMap = parentKeys.reduce(
          (res, key) => (res[key] = true) && res,
          {} as LooseObject
        );
      }
      for (let childKey of childKeys) {
        if (!merge) {
          delete parentKeysMap[childKey];
        }
        set(
          toCall,
          path + '.' + childKey,
          parent[key],
          childKey,
          value[childKey]
        );
      }
      if (!merge) {
        for (let childKey of Object.keys(parentKeysMap)) {
          self.unset(path + '.' + childKey);
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

  function triggerImmediate(
    target: string,
    refPaths: Set<string>,
    listener: Function,
    parts: string[],
    index = 0,
    paths: string[] = []
  ) {
    for (index; index < parts.length; index++) {
      const part = parts[index];
      const data = get(_data, paths.join('.'));
      if (/(^\$|^\*$|^\*\*$)/.test(part)) {
        Object.keys(data || {}).forEach(key =>
          triggerImmediate(
            target,
            refPaths,
            listener,
            parts,
            index + 1,
            paths.concat(key)
          )
        );
        return;
      } else {
        paths.push(part);
      }
    }
    const path = paths.join('.');
    if (typeof get(_data, path) !== 'undefined') {
      const immediateListeners = new ImmediateListeners();
      immediateListeners.add(parts.join('.'), listener);
      trigger(target, refPaths, immediateListeners, path);
    }
  }

  self.merge = (path, value, byKey) => {
    return setSet(path, value, byKey, true);
  };

  self.set = (path, value, byKey) => {
    return setSet(path, value, byKey, false);
  };

  // TODO: Why doesn't this pick up all the "on"s?
  // @ts-ignore
  self.on = (flagsAndPath: string, listener?: Callback): Pathifier | string => {
    if (!flagsAndPath.includes(' ') && !listener) {
      return createPathifier(self, flagsAndPath);
    }

    const [flags, path] = flagsAndPath.split(' ').filter(p => p);
    if (!flags || !path) {
      throw new Error(
        `Missing flags or path. Usage: data.on('!+* players.$id.name', () => {})`
      );
    }

    const refs = flags
      .split('')
      .filter(p => p !== '!')
      .map(flag => getListenerByFlag(flag).add(path, listener!))
      .join(' ');

    if (flags.includes('!')) {
      const refPaths = new Set<string>();
      const target = clean(path);
      triggerImmediate(target, refPaths, listener!, path.split('.'));
    }

    return refs;
  };

  self.off = refs => {
    for (let ref of refs
      .split(' ')
      .map(ref => ref.trim())
      .filter(ref => ref)) {
      _changeListeners.remove(ref);
      _addListeners.remove(ref);
      _removeListeners.remove(ref);
      _triggerListeners.remove(ref);
    }
  };

  function trigger(
    target: string,
    refPaths: Set<string>,
    listeners: Listeners,
    path: string,
    value: any = null
  ) {
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
            ...(valIsObject
              ? {
                  values: Object.values(val as LooseObject),
                  keys: Object.keys(val as LooseObject),
                }
              : {}),
          });
        }
      }
    }
    return resultValue;
  }

  self.trigger = (path, value) => {
    return trigger(path, new Set(), _triggerListeners, path, value);
  };

  self.get = path => {
    if (!path) return _data;
    return get(_data, path);
  };

  self.unset = path => {
    const refPaths = new Set<string>();
    const target = path;
    const unsetRecursive = (parent: LooseObject, key: string, path: string) => {
      const data = get(parent, key) as LooseObject;
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
