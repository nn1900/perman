'use strict';

const stat = require('./stat');
const readFile = require('./readFile');

function generateIds(category) {
  if (category.parent) {
    const x = category.categories.length;
    const n = parseInt(Math.floor(Math.log10(x || 1))) + 2;
    const id = category.parent.id * parseInt(Math.pow(10, n)) + category.order;
    category.id = id;
  }
  category.categories.forEach(x => generateIds(x));
  const x = category.permissions.length;
  const n = parseInt(Math.floor(Math.log10(x || 1))) + 2;
  category.permissions.forEach((x, i) => {
    x.id = category.id * parseInt(Math.pow(10, n)) + x.order;
  });
}

module.exports = function(path) {
  return stat(path)
    .then(() => readFile(path))
    .then(contents => {
      const lines = contents.split(/\n/g);
      const nameMap = {};
      const root = {
        id: 0,
        type: 'category',
        name: '(default)',
        permissions: [],
        categories: []
      };
      const stack = [root];

      let level = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*$/i.test(line)) continue;
        const match = /^(\s*)\-\s*([^\/]+)\/([^\/]+)/i.exec(line);
        if (match) { // permission line
          const indent = match[1].length / 2;
          const text = match[2];
          const name = match[3];
          if (nameMap[name]) {
            throw new Error(`Permission '${text} (${name})' already exists. `);
          }
          const category = stack[indent];
          const permission = {
            name,
            text,
            order: category.permissions.length + 1
          };
          category.permissions.push(permission);
        } else { // category line
          level = /^\s*/i.exec(line)[0].length / 2;
          while (stack.length > level + 1) {
            stack.pop();
          }
          const top = stack[stack.length - 1];
          const category = {
            name: line.trim(),
            permissions: [],
            categories: [],
            order: top.categories.length + 1,
            parent: top
          };
          top.categories.push(category);
          stack.push(category);
        }
      }
      generateIds(root);
      return root;
    });
}
