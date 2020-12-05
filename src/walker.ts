import { isProbablyPlainObject } from './halp';
import { ChangeType } from './listeners';

export interface WalkRes {
  changeType: ChangeType;
  path: string[];
  newValue: any;
  oldValue: any;
}

type WalkCb = (walkRes: WalkRes) => boolean;

export function remove(path: string[], oldValue: any, cb: WalkCb) {
  if (typeof oldValue === 'undefined') return;

  if (
    cb({
      changeType: ChangeType.Remove,
      newValue: undefined,
      oldValue,
      path,
    })
  ) {
    return;
  }
  recursiveRemove(path, oldValue, cb);
}

function recursiveRemove(path: string[], oldValue: any, cb: WalkCb) {
  if (isProbablyPlainObject(oldValue)) {
    for (const [key, value] of Object.entries(oldValue)) {
      remove(path.concat(key), value, cb);
    }
  } else if (Array.isArray(oldValue)) {
    for (let i = 0; i < oldValue.length; i++) {
      remove(path.concat(String(i)), oldValue[i], cb);
    }
  }
}

export function walk(
  path: string[],
  newValue: any,
  oldValue: any,
  cb: WalkCb
): void {
  if (isProbablyPlainObject(newValue)) {
    if (isProbablyPlainObject(oldValue)) {
      const keys = new Set(Object.keys(oldValue));
      for (const [key, value] of Object.entries(newValue)) {
        keys.delete(key);
        walk(path.concat(key), value, oldValue[key], cb);
      }
      for (const key of Array.from(keys)) {
        remove(path.concat(key), oldValue[key], cb);
      }
    } else {
      if (
        cb({
          changeType: ChangeType.Add,
          path,
          newValue,
          oldValue,
        })
      ) {
        return;
      }
      remove(path, oldValue, cb);
      for (const [key, value] of Object.entries(newValue)) {
        walk(path.concat(key), value, undefined, cb);
      }
    }
  } else if (Array.isArray(newValue)) {
    if (Array.isArray(oldValue)) {
      for (let i = 0; i < newValue.length; i++) {
        walk(path.concat(String(i)), newValue[i], oldValue[i], cb);
      }
      for (let i = newValue.length; i < oldValue.length; i++) {
        remove(path.concat(String(i)), oldValue[i], cb);
      }
    } else {
      if (
        cb({
          changeType: ChangeType.Add,
          path,
          newValue,
          oldValue,
        })
      ) {
        return;
      }
      for (let i = 0; i < newValue.length; i++) {
        walk(path.concat(String(i)), newValue[i], undefined, cb);
      }
      remove(path, oldValue, cb);
    }
  } else {
    if (newValue && typeof oldValue === 'undefined') {
      if (
        cb({
          changeType: ChangeType.Add,
          path,
          newValue,
          oldValue,
        })
      ) {
        return;
      }
    } else if (newValue === undefined && oldValue) {
      if (
        cb({
          changeType: ChangeType.Remove,
          path,
          newValue,
          oldValue,
        })
      ) {
        return;
      }
      remove(path, oldValue, cb);
    } else if (newValue !== oldValue) {
      if (
        cb({
          changeType: ChangeType.Update,
          path,
          newValue,
          oldValue,
        })
      ) {
        return;
      }
      recursiveRemove(path, oldValue, cb);
    }
    return newValue;
  }
}
