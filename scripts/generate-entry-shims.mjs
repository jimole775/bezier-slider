import { writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

/** Webpack 4 / uni-app 等旧打包器不识别 package.json exports，需要根目录物理入口文件 */
const shims = [
  { file: 'vue2.js', bundle: './dist/bezier-slider.vue2.cjs' },
  { file: 'vue.js', bundle: './dist/bezier-slider.vue.cjs' },
  { file: 'react.js', bundle: './dist/bezier-slider.react.cjs' },
  { file: 'mp.js', bundle: './dist/bezier-slider.mp.cjs' }
];

for (const { file, bundle } of shims) {
  const content = `'use strict';

module.exports = require('${bundle}');
`;
  writeFileSync(join(root, file), content, 'utf8');
  console.log(`generated ${file}`);
}
