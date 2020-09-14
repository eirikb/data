class Path {
  children: {
    [key: string]: Path;
  } = {};
  $: {
    [key: string]: Path;
  } = {};

  $x?: Path;
  $xx?: Path;

  value?: {
    [ref: string]: unknown;
  };
}

export interface Lookup {
  keys: { [key: string]: string };
  value: { [ref: string]: unknown };
  path: string;
  fullPath: string;
}

class Lookuper {
  private readonly parent: Path;
  private readonly parts: string[];
  private result: Lookup[] = [];

  constructor(parent: Path, parts: string[]) {
    this.parent = parent;
    this.parts = parts;
  }

  private _addResult(
    keys: string[][],
    value: { [ref: string]: unknown },
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

  lookup(): Lookup[] {
    this._lookup(this.parent);
    return this.result;
  }

  private _lookup(
    parent: Path,
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

export class Paths {
  private map: Path = new Path();
  private refs: { [key: string]: string } = {};

  add = (path: string, ref: string, input: unknown) => {
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

  lookup(path: string) {
    const parts = path.split('.');
    const lookup = new Lookuper(this.map, parts);
    return lookup.lookup();
  }

  remove(ref: string) {
    const path = this.refs[ref];
    if (!path) return;

    const parts = path.split('.');
    let parent: Path | undefined = this.map;
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

export const clean = (path: string) => {
  const res: string[] = [];
  path.split('.').every(part => {
    const check = part !== '*' && part !== '**' && !part.startsWith('$');
    if (check) res.push(part);
    return check;
  });
  return res.join('.');
};
