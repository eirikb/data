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

export type Filter = (value: any, opts: ListenerCallbackOptions) => boolean;
export type OnFilter = (
  value: any,
  opts: {
    opts: ListenerCallbackOptions;
    onValue?: any;
    onOpts?: ListenerCallbackOptions;
  }
) => boolean;
