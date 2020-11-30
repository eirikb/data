import { isProbablyPlainObject } from './halp';
import { ChangeType } from './listeners';

type Eol = (path: string[]) => boolean;

export interface WalkRes {
  changeType: ChangeType;
  path: string[];
  newValue: any;
  oldValue: any;
}

type WalkCb = (walkRes: WalkRes) => void;

export function remove(eol: Eol, path: string[], oldValue: any, cb: WalkCb) {
  if (eol(path) || typeof oldValue === 'undefined') return;

  cb({
    changeType: ChangeType.Remove,
    newValue: undefined,
    oldValue,
    path,
  });
  recursiveRemove(eol, path, oldValue, cb);
}

function recursiveRemove(eol: Eol, path: string[], oldValue: any, cb: WalkCb) {
  if (isProbablyPlainObject(oldValue)) {
    for (const [key, value] of Object.entries(oldValue)) {
      remove(eol, path.concat(key), value, cb);
    }
  } else if (Array.isArray(oldValue)) {
    for (let i = 0; i < oldValue.length; i++) {
      remove(eol, path.concat(String(i)), oldValue[i], cb);
    }
  }
}

export function walk(
  eol: Eol,
  path: string[],
  newValue: any,
  oldValue: any,
  cb: WalkCb
): void {
  if (eol(path)) return;

  if (isProbablyPlainObject(newValue)) {
    if (isProbablyPlainObject(oldValue)) {
      const keys = new Set(Object.keys(oldValue));
      for (const [key, value] of Object.entries(newValue)) {
        keys.delete(key);
        walk(eol, path.concat(key), value, oldValue[key], cb);
      }
      for (const key of Array.from(keys)) {
        remove(eol, path.concat(key), oldValue[key], cb);
      }
      cb({
        changeType: ChangeType.Update,
        path,
        newValue,
        oldValue,
      });
    } else {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
      remove(eol, path, oldValue, cb);
      for (const [key, value] of Object.entries(newValue)) {
        walk(eol, path.concat(key), value, undefined, cb);
      }
    }
  } else if (Array.isArray(newValue)) {
    if (Array.isArray(oldValue)) {
      for (let i = 0; i < newValue.length; i++) {
        walk(eol, path.concat(String(i)), newValue[i], oldValue[i], cb);
      }
      for (let i = newValue.length; i < oldValue.length; i++) {
        remove(eol, path.concat(String(i)), oldValue[i], cb);
      }
    } else {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
      remove(eol, path, oldValue, cb);
    }
  } else {
    if (newValue && typeof oldValue === 'undefined') {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
    } else if (newValue === undefined && oldValue) {
      cb({
        changeType: ChangeType.Remove,
        path,
        newValue,
        oldValue,
      });
    } else if (newValue !== oldValue) {
      cb({
        changeType: ChangeType.Update,
        path,
        newValue,
        oldValue,
      });
      recursiveRemove(eol, path, oldValue, cb);
    }
    return newValue;
  }
}
