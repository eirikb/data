import { isProbablyPlainObject } from './halp';
import { ChangeType } from './listeners';

type WalkCb = (walkRes: {
  changeType: ChangeType;
  path: string[];
  newValue: any;
  oldValue: any;
}) => boolean;

function recursiveRemove(oldValue: any, cb: WalkCb) {
  cb({
    changeType: ChangeType.Remove,
    newValue: null,
    oldValue,
    path: [],
  });
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
        cb({
          changeType: ChangeType.Remove,
          path: path.concat(key),
          newValue: undefined,
          oldValue: oldValue[key],
        });
      }
    } else {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
    }
  } else if (Array.isArray(newValue)) {
    if (Array.isArray(oldValue)) {
      for (let i = 0; i < newValue.length; i++) {
        walk(path.concat(String(i)), newValue[i], oldValue[i], cb);
      }
      for (let i = newValue.length; i < oldValue.length; i++) {
        cb({
          changeType: ChangeType.Remove,
          path: path.concat(String(i)),
          newValue: undefined,
          oldValue: oldValue[i],
        });
      }
    } else {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
    }
  } else {
    if (newValue && !oldValue) {
      cb({
        changeType: ChangeType.Add,
        path,
        newValue,
        oldValue,
      });
    } else if (newValue !== oldValue) {
      cb({
        changeType: ChangeType.Update,
        path: [],
        newValue,
        oldValue,
      });
      if (isProbablyPlainObject(oldValue)) {
        recursiveRemove(oldValue, cb);
      }
    }
    return newValue;
  }
}
