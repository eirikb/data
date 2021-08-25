/***
 * The Relatively Fast Flat Middle-out Tree Algorithm
 *
 * This is by far the fastest middle-out algorithm implementation in a tree based array-like structure.
 */

export type Ref = object;

export type Node = Node[] & {
  value: any;
  ref: Ref;
  count: number;
};

function createNode(): Node {
  return Object.assign([], {
    ref: {},
    value: undefined,
    count: 0,
  });
}

export class FlatTreeMiddleOut {
  private root: Node = createNode();

  add(
    path: Ref[],
    index: number,
    value: any,
    visible: boolean
  ): [Ref, number | undefined] {
    let node: Node | undefined = this.root;
    let idx = 0;
    const pathAsNodes = [this.root];
    for (const ref of path) {
      node = node?.find(n => {
        if (n.ref === ref) return n;
        idx += n.count;
        return undefined;
      });
      if (node !== undefined) pathAsNodes.push(node);
    }
    if (!node) node = this.root;

    for (let i = 0; i < index; i++) {
      idx += node[i]?.count ?? 0;
    }

    const n = createNode();
    node.splice(index, 0, n);
    n.value = value;

    if (visible) {
      n.count = 1;
      for (const ns of pathAsNodes) {
        ns.count++;
      }
    }

    return [n.ref, visible ? idx : undefined];
  }
}
