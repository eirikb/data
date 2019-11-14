function isPlainObject(obj) {
  return typeof obj === 'object' && obj !== null && obj.constructor === Object;
}

function get(input, path) {
  path = path.split('.');
  for (let i = 0; i < path.length; i++) {
    input = input[path[i]];
    if (typeof input === 'undefined') return;
  }
  return input;
}

function unset(input, path) {
  if (typeof get(input, path) === 'undefined') return;

  path = path.split('.');
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    if (!isPlainObject(input[current])) {
      input[current] = {};
    }
    input = input[current];
  }
  delete input[path[path.length - 1]];
}

function pathBrancher(path, onPart) {
  return path.split('.').reduce((paths, part) => {
    const results = [];
    [].concat(onPart(part, paths)).forEach(pp =>
      [].concat(pp).forEach(p => results.push(p))
    );
    if (results.length > 0) {
      if (paths.length === 0) {
        return results;
      }
      return paths.reduce((res, p) => {
        results.forEach(part => res.push(p + '.' + part));
        return res;
      }, []);
    } else {
      return paths.map(path => path + '.' + part);
    }
  }, []);
}

module.exports = {get, unset, isPlainObject, pathBrancher};
