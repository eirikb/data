import Paths from './paths';
import { Listeners, LooseObject } from './types';

export default (prefix = 'ref') => {
  const self = {} as Listeners;
  let cache: LooseObject = {};
  const paths = Paths();
  let next = 0;

  function nextRef() {
    next++;
    return `${prefix}-${next}`;
  }

  self.add = (path, listener) => {
    cache = {};
    const ref = nextRef();
    paths.add(path, ref, { listener });
    return ref;
  };

  self.remove = ref => {
    paths.remove(ref);
    cache = {};
  };

  function get(path: string) {
    return paths.lookup(path).map(res => {
      res._ = Object.entries(res._).map(([ref, res]) => [ref, res['listener']]);
      return res;
    });
  }

  self.get = path => {
    if (cache[path]) {
      return cache[path];
    }
    return (cache[path] = get(path));
  };

  return self;
};
