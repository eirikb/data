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
  visible: boolean;
};

function createNode(visible: boolean): Node {
  return Object.assign([], {
    ref: {},
    value: undefined,
    count: 0,
    visible,
  });
}

interface NodeFind {
  node: Node;
  idx: number;
  pathAsNodes: Node[];
}

export class FlatTreeMiddleOut {
  private root: Node = createNode(false);

  private find(path: Ref[], index: number): NodeFind {
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
    return { node, idx, pathAsNodes };
  }

  add(
    path: Ref[],
    index: number,
    value: any,
    visible: boolean
  ): [Ref, number | undefined] {
    const { node, idx, pathAsNodes } = this.find(path, index);

    const n = createNode(visible);
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

  walkTheWalk(node: Node, res: Node[] = []): Node[] {
    node.forEach(n => this.walkTheWalk(n, res));
    res.push(node);
    return res;
  }

  remove(path: Ref[], index: number): { idx: number; value: any }[] {
    const { node, idx, pathAsNodes } = this.find(path, index);
    const target = node[index];

    node.splice(index, 1);

    const nodes = this.walkTheWalk(target);

    if (target.count > 0) {
      for (const ns of pathAsNodes) {
        ns.count -= target.count;
      }
    }

    return nodes.map((node, i) => ({ idx: idx + i, value: node.value }));
  }
}
