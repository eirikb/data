/***
 * The flat middle-out tree algorithm
 *
 * This is by far the fastest middle-out algorithm implementation in a tree based array-like structure.
 * Insertion and removal of nodes is about O(m) where m is tree depth.
 */

type Index = Index[] & {
  value: any;
  count: number;
  includeInCount: boolean;
};

export class FlatTreeMiddleOut {
  private index: Index[] = [];

  private createIndex(): Index {
    return Object.assign([], {
      count: 0,
      includeInCount: false,
      value: undefined,
    });
  }

  add(index: number[], value: any, includeInCount: boolean): number | null {
    console.log(' >', index, value);

    let idx = 0;
    let ii = this.index;
    for (let i = 0; i < index.length; i++) {
      const end = i === index.length - 1;

      const v = index[i];
      ii[v] = ii[v] ?? this.createIndex();
      if (includeInCount) ii[v].count++;

      if (includeInCount) {
        if (end && ii[v].value !== undefined) {
          // throw new Error(`Index ${index} already set`);
          console.log('Already set! MUST - PUSH!', end, 'idx', idx);
          ii.splice(v, 0, this.createIndex());
        }

        for (let j = 0; j < v; j++) {
          const prev = ii[j];
          if (prev) {
            idx += prev.count;
          }
        }
      }
      if (!end) {
        ii = ii[v];
      }
    }
    const end = index[index.length - 1];

    ii[end].value = value;
    ii[end].includeInCount = includeInCount;
    ii[end].count = includeInCount ? 1 : 0;

    if (!includeInCount) return null;

    // console.log(' <', this.index);
    console.log(' <', idx);

    return idx;
  }
}
