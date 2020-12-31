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
  private child?: Path<T>;
  private readonly parts: string[];
  private result: Lookup<T>[] = [];
  isEol: boolean = false;

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
      keys: keys.reduce((res: { [key: string]: string }, [name, value]) => {
        res[name] = value;
        return res;
      }, {}),
      value,
      path: this.parts.slice(0, pathUntil).join('.'),
      fullPath: this.parts.join('.'),
    });
  }

  lookup(): Lookup<T>[] {
    this._lookup(this.parent);
    this.isEol =
      !this.child ||
      (Object.keys(this.child.children).length === 0 &&
        (!this.child.value || Object.keys(this.child.value).length === 0) &&
        Object.keys(this.child.$).length === 0 &&
        !this.child.$x &&
        !this.child.$xx);

    return this.result;
  }

  private _lookup(
    parent: Path<T>,
    index = 0,
    keys: string[][] = [],
    pathUntil = 0
  ) {
    if (!parent || pathUntil >= this.parts.length + 1) {
      return;
    }
    if (index === this.parts.length) {
      this.child = parent;
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
      if (parent.$x.value) {
        const restOfPathIsWildcard = this.parts
          .slice(index)
          .every(p => p === '*' || p === '**');
        if (restOfPathIsWildcard) {
          this._addResult(keys, parent.$x.value, pathUntil);
        }
      }
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
  private map: Path<T> = new Path<T>();
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

  lookupByString(path: string): Lookup<T>[] {
    return this.lookup(path.split('.')).lookups;
  }

  lookup(path: string[]): { isEol: boolean; lookups: Lookup<T>[] } {
    const lookup = new Lookuper<T>(this.map, path);
    const lookups = lookup.lookup();
    return {
      isEol: lookup.isEol,
      lookups,
    };
  }

  remove(ref: string) {
    const path = this.refs[ref];
    if (!path) return;

    const parts = path.split('.');
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
    if (parent && parent.value) {
      delete parent.value[ref];
      if (Object.keys(parent.value).length === 0) {
        delete parent.value;
      }
    }
  }
}
