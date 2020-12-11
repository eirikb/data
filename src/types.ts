import { ChangeListeners, Listeners } from './listeners';

export interface LooseObject {
  [key: string]: any;
}

export interface ToCall {
  listeners: Listeners;
  path: string;
  value: any;
}

export type Sorter = (a: any, b: any, aPath: string, bPath: string) => number;

export type Filter = (value: any) => boolean;

export type SorterOn = (
  sortValue: any,
  a: any,
  b: any,
  aPath: string,
  bPath: string
) => number;
export type FilterOn = (filterValue: any, value: any) => boolean;

export interface Stower {
  /**
   * Call with same index to replace
   * Call with same subindex to insert in between
   */
  add(value: any, index: number, subIndex?: number, path?: string): void;

  remove(value: any, index: number, subIndex?: number, path?: string): void;

  or(index: number, or: any): void;
}

export interface CoreOptions {
  changeListeners: ChangeListeners;
  newValue: any;
  oldValue: any;
}

export interface ListenerCallbackOptions {
  newValue: any;
  oldValue: any;
  subPath: string;
  fullPath: string;
  path: string;
  child: (path: string) => string;

  [key: string]: unknown;
}

export interface ListenerCallbackOnValueOptions
  extends ListenerCallbackOptions {
  onValue: any | undefined;
  onOpts: ListenerCallbackOptions | undefined;
}

export type ListenerCallback = (
  value: any,
  listenerCallbackOptions: ListenerCallbackOptions
) => any;

export type ListenerCallbackWithType<T> = (
  value: T,
  listenerCallbackOptions: ListenerCallbackOptions
) => any;

export interface Change {
  listenerCallbackOptions: ListenerCallbackOptions;
  listenerCallback: ListenerCallback;
}

export interface Entry {
  key: string;
  value: any;
  opts: ListenerCallbackOptions;
}

export type Sorter2 = (
  aValue: any,
  bValue: any,
  opts: {
    aOpts: ListenerCallbackOptions;
    bOpts: ListenerCallbackOptions;
  }
) => number;

export type OnSorter2 = (
  aValue: any,
  bValue: any,
  opts: {
    aOpts: ListenerCallbackOptions;
    bOpts: ListenerCallbackOptions;
    onValue: any | undefined;
    onOpts: ListenerCallbackOptions | undefined;
  }
) => number;

export type Mapper = (value: any, opts: ListenerCallbackOnValueOptions) => void;

export type OnMapper = (
  value: any,
  opts: ListenerCallbackOnValueOptions
) => void;

export type SliceOn = (
  onValue?: any,
  onOpts?: ListenerCallbackOptions
) => [number, number?];

export type Filter2 = (value: any, opts: ListenerCallbackOptions) => boolean;
export type OnFilter2 = (
  value: any,
  opts: {
    opts: ListenerCallbackOptions;
    onValue?: any;
    onOpts?: ListenerCallbackOptions;
  }
) => boolean;
