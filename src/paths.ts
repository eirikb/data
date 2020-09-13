class Path<T> {
  children: {
    [key: string]: Path<T>;
  } = {};
  $: {
    [key: string]: Path<T>;
  } = {};

  $x?: Path<T>;
  $xx?: Path<T>;

  value?: {
    [ref: string]: T;
  };
}

export interface Lookup<T> {
  keys: { [key: string]: string };
  value: { [ref: string]: T };
  path: string;
  fullPath: string;
}

class Lookuper<T> {
  private readonly parent: Path<T>;
  private readonly parts: string[];
  private result: Lookup<T>[] = [];

  constructor(parent: Path<T>, parts: string[]) {
    this.parent = parent;
    this.parts = parts;
  }

  private _addResult(
    keys: string[][],
    value: { [ref: string]: T },
    pathUntil: number
  ) {
    this.result.push({
      keys: Object.fromEntries(keys),
      value,
      path: this.parts.slice(0, pathUntil).join('.'),
      fullPath: this.parts.join('.'),
    });
  }

  lookup(): Lookup<T>[] {
    this._lookup(this.parent);
    return this.result;
  }

  private _lookup(
    parent: Path<T>,
    index = 0,
    keys: string[][] = [],
    pathUntil = 0
  ) {
    if (!parent || index >= this.parts.length + 1) {
      return;
    }

    if (parent.$xx && parent.$xx.value) {
      this._addResult(keys, parent.$xx.value, pathUntil);
    }

    for (const [name, p] of Object.entries(parent.$)) {
      this._lookup(
        p,
        index + 1,
        keys.slice().concat([[name, this.parts[index]]]),
        index + 1
      );
    }

    if (parent.$x) {
      this._lookup(parent.$x, index + 1, keys, pathUntil);
    }

    if (index === this.parts.length && parent.value) {
      this._addResult(keys, parent.value, pathUntil);
    } else if (parent.children) {
      this._lookup(
        parent.children[this.parts[index]],
        index + 1,
        keys,
        index + 1
      );
    }
  }
}

export class Paths<T> {
  private map: Path<T> = new Path();
  private refs: { [key: string]: string } = {};

  add = (path: string, ref: string, input: T) => {
    this.refs[ref] = path;
    const parts = path.split('.');
    let parent = this.map;
    for (let part of parts) {
      if (part === '*') {
        parent = parent.$x = parent.$x || new Path();
      } else if (part === '**') {
        parent = parent.$xx = parent.$xx || new Path();
      } else if (part.startsWith('$')) {
        parent = parent.$[part] = parent.$[part] || new Path();
      } else {
        parent = parent.children[part] = parent.children[part] || new Path();
      }
    }
    parent.value = parent.value || {};
    parent.value[ref] = input;
  };

  // for (; index < parts.length; index++) {
  //   const part = parts[index];

  // const part = parts[index];
  // if (parent.$) {
  //   for (let key of Object.keys(parent.$)) {
  //     const newKeys: string[] = keys.slice();
  //     let newUntil = until;
  //     if (key !== '*' && key !== '**') {
  //       newUntil = index;
  //       newKeys[index] = key;
  //     }
  //     this._lookup(
  //       result,
  //       parent.$(key),
  //       parts,
  //       index + 1,
  //       newKeys,
  //       newUntil
  //     );
  //   }
  // }
  // if (parent.$$) {
  //   if (parent.$$.h) {
  //     break;
  //   }
  // }
  // if (parent.children()) {
  //   until = index;
  //   parent = parent._[part];
  // } else {
  //   return;
  // }
  // }

  // if (parent && !parent.h && parent.$$) {
  //   parent = parent.$$;
  // }

  // if (parent && parent.h) {
  //   const keysMap = keys.reduce((res, val, index) => {
  //     if (val) res[val] = parts[index];
  //     return res;
  //   }, {} as any);
  //
  //   const res = {
  //     keys: keysMap,
  //     value: parent.h,
  //     path: (until >= 0 ? parts.slice(0, until + 1) : parts).join('.'),
  //     ...(until >= 0 ? { fullPath: parts.join('.') } : {}),
  //   } as Lookup;
  //   result.push(res);
  // }
  // }

  lookup(path: string) {
    console.dir(this.map, { depth: null });
    const parts = path.split('.');
    const lookup = new Lookuper<T>(this.map, parts);
    return lookup.lookup();
  }

  remove(ref: string) {
    const path = this.refs[ref];
    if (!path) return;

    const parts = path.split('.');
    console.dir(this.map, { depth: null });
    let parent: Path<T> | undefined = this.map;
    for (let part of parts) {
      if (part.startsWith('$')) {
        parent = parent?.$[part];
      } else if (part === '*') {
        parent = parent?.$x;
      } else if (part === '**') {
        parent = parent?.$xx;
        break;
      } else {
        parent = parent?.children[part];
      }
    }
    console.log(111, parent);
    if (parent && parent.value) {
      delete parent.value[ref];
      if (Object.keys(parent.value).length === 0) {
        delete parent.value;
      }
    }
  }
}

export const clean = (path: string) => {
  const res: string[] = [];
  path.split('.').every(part => {
    const check = part !== '*' && part !== '**' && !part.startsWith('$');
    if (check) res.push(part);
    return check;
  });
  return res.join('.');
};
