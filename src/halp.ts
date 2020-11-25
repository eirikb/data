export function isProbablyPlainObject(obj: any) {
  return typeof obj === 'object' && obj !== null && obj.constructor === Object;
}

/**
 * Cloning because of:
 * const u = {x:1};
 * data.set('u', u);
 * u.x = 2;
 * // Will not fire any updates, because stored "u" is also updated
 * data.set('u', u);
 * @param o
 */
export function clone(o: any): any {
  if (isProbablyPlainObject(o)) {
    return Object.entries(o).reduce((res: any, [key, val]) => {
      res[key] = clone(val);
      return res;
    }, {});
  } else if (Array.isArray(o)) {
    return (o as any[]).map(clone);
  } else return o;
}
