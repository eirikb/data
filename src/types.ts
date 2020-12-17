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

export interface Entry<T = any> {
  key: string;
  value: T;
  opts: ListenerCallbackOptions;
}

export type Sorter2<T = any> = (
  aValue: T,
  bValue: T,
  opts: {
    aOpts: ListenerCallbackOptions;
    bOpts: ListenerCallbackOptions;
  }
) => number;

export type OnSorter2<T = any> = (
  aValue: T,
  bValue: T,
  opts: {
    aOpts: ListenerCallbackOptions;
    bOpts: ListenerCallbackOptions;
    onValue: any | undefined;
    onOpts: ListenerCallbackOptions | undefined;
  }
) => number;

export type Mapper<T = any> = (
  value: T,
  opts: ListenerCallbackOnValueOptions
) => void;

export type OnMapper<T = any> = (
  value: T,
  opts: ListenerCallbackOnValueOptions
) => void;

export type SliceOn<T = any> = (
  onValue?: T,
  onOpts?: ListenerCallbackOptions
) => [number, number?];

export type Filter<T = any> = (
  value: T,
  opts: ListenerCallbackOptions
) => boolean;
export type OnFilter<T = any> = (
  value: T,
  opts: {
    opts: ListenerCallbackOptions;
    onValue?: any;
    onOpts?: ListenerCallbackOptions;
  }
) => boolean;
