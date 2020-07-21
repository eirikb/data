import Listeners from './listeners';

export declare type Callback = (value: any, props: any) => void;

export interface LooseObject {
  [key: string]: any;
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
  add(value: any, index: number, subIndex?: number, path?: string): void;

  remove(value: any, index: number, subIndex?: number, path?: string): void;

  or(index: number, or: any): void;
}

export interface H {
  keys: LooseObject;
  _: [string, Function][];
  path: string;
  fullPath?: string;
  __?: [any, Function][];
  value?: any;
}
