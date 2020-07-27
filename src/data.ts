import { ListenerCallback, Listeners, ImmediateListeners } from './listeners';
import { Pathifier } from './pathifier';
import { clean } from './paths';
import { LooseObject, ToCall } from './types';
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

export class Data {
  setQueue: LooseObject = {};
  _data: LooseObject = {};
  _changeListeners = new Listeners('change');
  _addListeners = new Listeners('add');
  _removeListeners = new Listeners('remove');
  _triggerListeners = new Listeners('trigger');

  getListenerByFlag(flag: string) {
    switch (flag) {
      case '*':
        return this._changeListeners;
      case '+':
        return this._addListeners;
      case '-':
        return this._removeListeners;
      case '=':
      default:
        return this._triggerListeners;
    }
  }

  setSet(path: string, value: any, byKey?: string, merge?: boolean) {
    if (this.setQueue[path]) {
      this.setQueue[path] = { qVal: value };
      return;
    }
    this.setQueue[path] = true;

    const parts = path.split('.');
    const parentsWithoutValue: string[] = [];
    let parent = this._data;

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
    this._set(
      toCall,
      path,
      parent,
      parts[parts.length - 1],
      value,
      byKey,
      merge
    );
    const refPaths = new Set<string>();
    const target = path;
    for (let { listeners, path, value } of toCall) {
      this._trigger(target, refPaths, listeners, path, value);
    }

    for (let path of parentsWithoutValue) {
      this._trigger(target, refPaths, this._addListeners, path, value);
    }
    let { qVal } = this.setQueue[path] || {};
    delete this.setQueue[path];
    if (typeof qVal !== 'undefined') {
      this.setSet(path, qVal);
    }
  }

  _set(
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
        this.unset(path);
      }
      this._set(toCall, path, parent, key, toSet);
      return;
    }

    const hasValue = typeof parent[key] !== 'undefined';

    const call = () => {
      const trigger = { path, value };
      if (hasValue) {
        toCall.push({ listeners: this._changeListeners, ...trigger });
      } else {
        toCall.push({ listeners: this._addListeners, ...trigger });
      }
    };

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
        this._set(
          toCall,
          path + '.' + childKey,
          parent[key],
          childKey,
          value[childKey]
        );
      }
      if (!merge) {
        for (let childKey of Object.keys(parentKeysMap)) {
          this.unset(path + '.' + childKey);
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

  triggerImmediate(
    target: string,
    refPaths: Set<string>,
    listener: ListenerCallback,
    parts: string[],
    index = 0,
    paths: string[] = []
  ) {
    for (index; index < parts.length; index++) {
      const part = parts[index];
      const data = get(this._data, paths.join('.'));
      if (/(^\$|^\*$|^\*\*$)/.test(part)) {
        for (const key of Object.keys(data || {})) {
          this.triggerImmediate(
            target,
            refPaths,
            listener,
            parts,
            index + 1,
            paths.concat(key)
          );
        }
        return;
      } else {
        paths.push(part);
      }
    }
    const path = paths.join('.');
    if (typeof get(this._data, path) !== 'undefined') {
      const immediateListeners = new ImmediateListeners();
      immediateListeners.add(parts.join('.'), listener);
      this._trigger(target, refPaths, immediateListeners, path);
    }
  }

  merge(path: string, value: any, byKey?: string) {
    return this.setSet(path, value, byKey, true);
  }

  set(path: string, value: any, byKey?: string) {
    return this.setSet(path, value, byKey, false);
  }

  on(flagsAndPath: string): Pathifier;

  on(flagsAndPath: string, listener: ListenerCallback): string;

  on(flagsAndPath: string, listener?: ListenerCallback): Pathifier | string {
    if (!flagsAndPath.includes(' ') && !listener) {
      return new Pathifier(this, flagsAndPath);
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
      .map(flag => this.getListenerByFlag(flag).add(path, listener!))
      .join(' ');

    if (flags.includes('!')) {
      const refPaths = new Set<string>();
      const target = clean(path);
      this.triggerImmediate(target, refPaths, listener!, path.split('.'));
    }

    return refs;
  }

  off(refs: string) {
    for (let ref of refs
      .split(' ')
      .map(ref => ref.trim())
      .filter(ref => ref)) {
      this._changeListeners.remove(ref);
      this._addListeners.remove(ref);
      this._removeListeners.remove(ref);
      this._triggerListeners.remove(ref);
    }
  }

  _trigger(
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
          let val = get(this._data, res.path);
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

  trigger(path: string, value: any) {
    return this._trigger(path, new Set(), this._triggerListeners, path, value);
  }

  get(path?: string): any {
    if (!path) return this._data;
    return get(this._data, path);
  }

  unset(path: string) {
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
        this._trigger(target, refPaths, this._removeListeners, path, data);
      }
    };

    unsetRecursive(this._data, path, path);
    unset(this._data, path);
  }
}
