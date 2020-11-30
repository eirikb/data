import { Pathifier } from './pathifier';
import { ListenerCallbackWithType } from './types';
import { Core, reverseLookup } from './core';
import { ChangeListeners, ChangeType, Listeners } from './listeners';

export * from './types';

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

    const refs = [];
    if (listener) {
      for (const flag of flags) {
        if (flag === '*') {
          refs.push(
            this._changeListeners.add(ChangeType.Update, path, listener)
          );
        } else if (flag === '+') {
          refs.push(this._changeListeners.add(ChangeType.Add, path, listener));
        } else if (flag === '-') {
          refs.push(
            this._changeListeners.add(ChangeType.Remove, path, listener)
          );
        } else if (flag === '=') {
          refs.push(this._triggerListeners.add(path, listener));
        } else if (flag === '!') {
          const paths = reverseLookup(this._data, path.split('.'));
          const listeners = new Listeners('immediate');
          listeners.add(path, listener);
          for (const path of paths) {
            this._call(listeners, path.join('.'), this.get(path.join('.')));
          }
        }
      }
    }

    return refs.join(' ');
  }

  off(refs: string) {
    for (const ref of refs.split(' ')) {
      this._triggerListeners.remove(ref);
      this._changeListeners.off(ref);
    }
  }

  private _call(listeners: Listeners, path: string, value: any) {
    const { lookups } = listeners.get(path.split('.'));
    for (const lookup of lookups) {
      for (const listener of Object.values(lookup.value)) {
        listener(value, {
          fullPath: path,
          newValue: value,
          oldValue: undefined,
          path,
          subPath: '',
          ...lookups.keys,
        });
      }
    }
  }

  trigger(path: string, value: any) {
    this._call(this._triggerListeners, path, value);
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
    this.set(path, undefined);
  }
}
