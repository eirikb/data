import { Change } from './types';
import { remove, walk, WalkRes } from './walker';
import { ChangeListeners, ChangeType } from './listeners';
import { isProbablyPlainObject } from './halp';

export class Core {
  parent: any;
  changes: Change[] = [];
  private readonly _changeListeners: ChangeListeners;
  private readonly _path: string[];
  private _eol: boolean = false;
  private _refsAdded: { [ref: string]: boolean } = {};

  constructor(changeListeners: ChangeListeners, parent: any, path: string[]) {
    this._changeListeners = changeListeners;
    this.parent = parent;
    this._path = path;
  }

  oldValue() {
    let parent = this.parent;
    if (parent === undefined) {
      return parent;
    }

    for (let path of this._path) {
      parent = parent[path];
      if (parent === undefined) {
        return undefined;
      }
    }
    return parent;
  }

  private _ensureParent(path: string[], parent: any): any {
    if (!isProbablyPlainObject(parent)) {
      if (typeof parent !== 'undefined') {
        remove(() => false, [], parent, this._callCb);
      }
      const newParent = {};
      this._callCb({
        changeType: ChangeType.Add,
        path,
        newValue: newParent,
        oldValue: parent,
      });
      return newParent;
    }
    return parent;
  }

  ensureParentObject() {
    if (this._path.length === 0) return;
    this.parent = this._ensureParent([], this.parent);
    let res;
    let parent = (res = this.parent);
    for (let i = 0; i < this._path.length - 1; i++) {
      const key = this._path[i];
      res = parent[key] = this._ensureParent(
        this._path.slice(0, i + 1),
        parent[key]
      );
      parent = res;
    }
    return res;
  }

  private _isEol = () => this._eol;

  private _callCb = ({ changeType, path, newValue, oldValue }: WalkRes) => {
    const lookups = this._changeListeners.get(changeType, path);
    for (let { keys, value, fullPath, path } of lookups.lookups) {
      for (const [ref, listenerCallback] of Object.entries(value)) {
        if (!this._refsAdded[ref]) {
          this._refsAdded[ref] = true;
          this.changes.push({
            listenerCallback,
            listenerCallbackOptions: {
              newValue,
              oldValue,
              fullPath,
              path,
              subPath: fullPath.slice(path.length + 1),
              ...keys,
            },
          });
        }
      }
    }
    if (lookups.isEol) {
      this._eol = true;
    }
  };

  set(newValue: any, oldValue: any) {
    walk(this._isEol, this._path, newValue, oldValue, this._callCb);
  }
}

function reverseLookupRecursive(
  parent: any,
  path: string[],
  index: number,
  newPath: (string | null)[],
  paths: (string | null)[][]
) {
  if (!isProbablyPlainObject(parent)) return;

  for (let i = index; i < path.length; i++) {
    const key = path[i];
    if (key === '*' || key.startsWith('$')) {
      if (key !== '*' || i < path.length - 1) {
        for (const [key, value] of Object.entries(parent)) {
          const newNewPath = newPath.slice().concat(key);
          paths.push(newNewPath);
          reverseLookupRecursive(value, path, i + 1, newNewPath, paths);
        }
      }
      if (i < path.length - 1) {
        newPath.push(null);
      }
    } else if (key === '**') {
      for (const [key, value] of Object.entries(parent)) {
        const newNewPath = newPath.slice().concat(key);
        paths.push(newNewPath);
        reverseLookupRecursive(
          value,
          path.concat('**'),
          i + 1,
          newNewPath,
          paths
        );
      }
    } else {
      if (parent !== undefined && parent[key] !== undefined) {
        parent = parent[key];
        newPath.push(key);
      }
    }
  }
}

export function reverseLookup(parent: any, path: string[]): string[][] {
  const paths: (string | null)[][] = [];
  const newPath: (string | null)[] = [];
  paths.push(newPath);
  reverseLookupRecursive(parent, path, 0, newPath, paths);
  return paths
    .filter(path => path.every(p => p !== null))
    .map(p => p as string[]);
}
