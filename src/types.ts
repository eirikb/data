export interface Paths {
  add(path: string, ref: string, input: any): void;

  lookup(path: string): Lookup[];

  remove(ref: string): void;
}

export declare type Callback = (value: any, props: any) => void;

export interface Lookup {
  keys: LooseObject;
  _: LooseObject;
  path: string;
  fullPath?: string;
}

export interface LooseObject {
  [key: string]: any;
}

export interface Pathifier {}

export interface Data {
  unset(path: string): void;

  merge(path: string, value: any, byKey?: string): void;

  set(path: string, value: any, byKey?: string): void;

  on(flagsAndPath: string): Pathifier;

  on(flagsAndPath: string, listener?: Callback): string;

  on(flagsAndPath: string, listener?: Callback): Pathifier | string;

  off(refs: string): void;

  trigger(path: string, value: any): any;

  get(path?: string): any;
}

export interface Listeners {
  add(path: string, listener: Function): string;

  remove(ref: string): void;

  get(path: string): H2[];
}

export interface ToCall {
  listeners: Listeners;
  path: string;
  value: any;
}

export declare type Sorter = (
  a: any,
  b: any,
  aPath: string,
  bPath: string
) => number;
export declare type Filter = (value: any) => boolean;
export declare type SorterOn = (
  sortValue: any,
  a: any,
  b: any,
  aPath: string,
  bPath: string
) => number;
export declare type FilterOn = (filterValue: any, value: any) => boolean;

export interface Stower {
  add(index: number, path: string, value: any): void;

  remove(index: number, path: string, value: any): void;

  or(index: number, or: any): void;
}

export interface H {
  keys: LooseObject;
  _: [string, Function][];
  path: string;
  fullPath?: string;
}

export interface H2 extends H {
  __: [any, Function][];
  value: any;
}
