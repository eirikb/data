import { Pathifier } from './pathifier';
// import { clean } from './paths';
import { ListenerCallbackWithType } from './types';
import { Core } from './core';
import { ChangeListeners, ChangeType, Listeners } from './listeners';

export * from './types';

// function get(input: LooseObject, path: string) {
//   const paths = path.split('.');
//   for (let i = 0; i < paths.length; i++) {
//     input = input[paths[i]];
//     if (typeof input === 'undefined') return;
//   }
//   return input;
// }

// function unset(input: LooseObject, path: string) {
//   if (typeof get(input, path) === 'undefined') return;
//
//   const paths = path.split('.');
//   for (let i = 0; i < paths.length - 1; i++) {
//     const current = paths[i];
//     if (!isProbablyPlainObject(input[current])) {
//       input[current] = {};
//     }
//     input = input[current];
//   }
//   delete input[paths[paths.length - 1]];
// }

export class Data {
  private _data: any = {};
  private readonly _changeListeners = new ChangeListeners();
  private readonly _triggerListeners = new Listeners('trigger');

  set(path: string, value: any, byKey?: string) {
    if (byKey) {
      console.log('byKey?!', byKey);
    }
    const parts = path.split('.');
    const core = new Core(this._changeListeners, this._data, parts);
    const oldValue = core.oldValue();
    const parent = core.ensureParentObject();
    core.set(value, oldValue);
    this._data = core.parent;
    parent[parts[parts.length - 1]] = value;

    for (const change of core.changes) {
      change.listenerCallback(
        change.listenerCallbackOptions.newValue,
        change.listenerCallbackOptions
      );
    }
  }

  on<T = unknown>(flagsAndPath: string): Pathifier;

  on<T = unknown>(
    flagsAndPath: string,
    listener: ListenerCallbackWithType<T>
  ): string;

  on<T = unknown>(
    flagsAndPath: string,
    listener?: ListenerCallbackWithType<T>
  ): Pathifier | string {
    if (!flagsAndPath.includes(' ') && !listener) {
      return new Pathifier(this, flagsAndPath);
    }

    const [flags, path] = flagsAndPath.split(' ').filter(p => p);
    if (!flags || !path) {
      throw new Error(
        `Missing flags or path. Usage: data.on('!+* players.$id.name', () => {})`
      );
    }

    if (listener) {
      for (const flag of flags) {
        if (flag === '*') {
          this._changeListeners.add(ChangeType.Update, path, listener);
        } else if (flag === '+') {
          this._changeListeners.add(ChangeType.Add, path, listener);
        } else if (flag === '-') {
          this._changeListeners.add(ChangeType.Remove, path, listener);
        } else if (flag === '=') {
          this._triggerListeners.add(path, listener);
        } else if (flag === '!') {
        }
      }
    }

    return '';

    // const refs = flags
    //   .split('')
    //   .filter(p => p !== '!')
    //
    //   .map(flag =>
    //     this.getListenerByFlag(flag).add(path, (value, props) =>
    //       listener!((value as any) as T, props)
    //     )
    //   )
    //
    //   .join(' ');
    //
    // if (flags.includes('!')) {
    //   const refPaths = new Set<string>();
    //   const target = clean(path);
    //   // this.triggerImmediate(
    //   //   target,
    //   //   refPaths,
    //   //   (value, props) => listener!((value as any) as T, props),
    //   //   path.split('.')
    //   // );
    // }

    // return refs;
  }

  off(refs: string) {
    console.log('off', refs);
    // for (let ref of refs
    //   .split(' ')
    //   .map(ref => ref.trim())
    //   .filter(ref => ref)) {
    //   this._changeListeners.remove(ref);
    //   this._addListeners.remove(ref);
    //   this._removeListeners.remove(ref);
    //   this._triggerListeners.remove(ref);
    // }
  }

  // _trigger(
  //   target: string,
  //   refPaths: Set<string>,
  //   listeners: Listeners,
  //   path: string,
  //   value: any = null
  // ) {
  //   const results = listeners.get(path.split('.')).lookups;
  //   let resultValue;
  //   for (let res of results) {
  //     const { path, fullPath } = res;
  //     const listeners = res.value;
  //     for (let [ref, listener] of Object.entries(listeners)) {
  //       const refPath = ref + res.path;
  //       if (listener && !refPaths.has(refPath)) {
  //         refPaths.add(refPath);
  //         let val = get(this._data, res.path);
  //         if (typeof val === 'undefined') {
  //           val = value;
  //         }
  //         const valIsObject = isProbablyPlainObject(val);
  //         resultValue = listener(val as any, {
  //           subPath: fullPath.slice(path.length),
  //           path,
  //           newValue: value,
  //           oldValue: value,
  //           fullPath: target,
  //           ...res.keys,
  //           ...(valIsObject
  //             ? {
  //                 values: Object.values(val as LooseObject),
  //                 keys: Object.keys(val as LooseObject),
  //               }
  //             : {}),
  //         });
  //       }
  //     }
  //   }
  //   return resultValue;
  // }

  trigger(path: string, value: any) {
    const listeners = this._triggerListeners.get(path.split('.'));
    for (const lookup of listeners.lookups) {
      for (const listener of Object.values(lookup.value)) {
        listener(value, {
          fullPath: path,
          newValue: value,
          oldValue: undefined,
          path,
          subPath: '',
        });
      }
    }
  }

  get<T = any>(path?: string): T | undefined {
    if (!path) return this._data;

    const parts = path.split('.');
    let input = this._data;
    for (let i = 0; i < parts.length; i++) {
      input = input[parts[i]];
      if (typeof input === 'undefined') return undefined;
    }
    return input;
  }

  unset(path: string) {
    console.log('unset', path);
    // const refPaths = new Set<string>();
    // const target = path;
    // const unsetRecursive = (parent: LooseObject, key: string, path: string) => {
    //   const data = get(parent, key) as LooseObject;
    //   if (isProbablyPlainObject(data)) {
    //     for (let key of Object.keys(data)) {
    //       unsetRecursive(data, key, path + '.' + key);
    //     }
    //   }
    //   if (typeof data !== 'undefined') {
    //     this._trigger(target, refPaths, this._removeListeners, path, data);
    //   }
    // };
    //
    // unsetRecursive(this._data, path, path);
    // unset(this._data, path);
  }
}
