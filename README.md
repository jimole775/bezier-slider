# BezierSlider — 贝塞尔弧形图标滑块

基于**二次贝塞尔曲线**的弧形图标滑块组件。图标沿平滑弧线排列，支持拖动、吸附、边界回弹，以及近大远小的视觉反馈。

> **Arc** 指弧形滑轨（一段曲线，非整圆）；**Bezier** 指轨迹由二次贝塞尔（`Q` 命令）描述。

---

## 功能介绍

| 功能 | 说明 |
|------|------|
| 弧形滑轨 | 图标沿二次贝塞尔曲线分布，滑轨由 SVG 绘制 |
| 近大远小 | 越靠近中心点（`centerT`）的图标越大、越亮 |
| 渐隐效果 | 距离中心越远越透明，可通过 `fadeEnabled` 控制 |
| 拖动滑动 | 支持鼠标拖动与触摸滑动，方向与手势一致 |
| 自动吸附 | 松手后平滑吸附到最近的图标 |
| 边界回弹 | 滑到首/末图标后继续越界拖动，松手带回弹效果 |
| 可见数量控制 | 拖动区域内最多同时显示 2 个图标（可配置） |
| 动态布局 | 初始化时自动测量容器尺寸，窗口变化时重新布局 |
| 弧度可配 | 支持整体平滑度、左/右端高度、局部下弯角度等 |
| 多种图标 | 支持 emoji、图片、SVG 路径、SVG 文件、font-icon |
| 滑动防选中 | 拖动过程中禁用页面文字框选 |

---

## 文件结构

```
slider-master/
├── demo/
│   ├── index.html                  # 演示页（滑轨预览 + 参数调节 + 代码输出）
│   ├── native-main.js              # 演示入口
│   └── shared/                     # 演示公共样式与工具
├── src/
│   ├── bezier-slider.native.js     # 核心：拖动交互、图标布局、贝塞尔轨迹（不含滑轨绘制）
│   ├── track-renderer.js           # 可选：默认 SVG 滑轨渲染（ensure / update / renderDefaultTrack）
│   ├── index.js                    # 包入口 → export BezierSlider + 滑轨工具
│   ├── native-bridge.js            # 框架封装共享：pickNativeOptions / mountNativeSlider
│   ├── vue-component.js            # Vue 包入口 → export BezierSlider 组件 + 滑轨工具
│   ├── react-component.js          # React 包入口 → export BezierSlider 组件 + 滑轨工具
│   └── components/
│       ├── BezierSlider.vue        # Vue 3 薄封装（内部使用 native 核心）
│       └── BezierSlider.jsx        # React 薄封装（内部使用 native 核心）
├── dist/                           # npm run build 生成（.gitignore，使用前需先 build）
│   ├── bezier-slider.mjs           # import 'bezier-slider'
│   ├── bezier-slider.vue.mjs       # import 'bezier-slider/vue'
│   ├── bezier-slider.react.mjs     # import 'bezier-slider/react'
│   └── style.css                   # Vue 组件样式
├── package.json
├── package-lock.json
├── vite.config.js
├── .gitignore
└── README.md
```

---

## 快速开始

### 方式一：原生 JavaScript

先执行 `npm run build` 生成 `dist/`，或通过 `npm install bezier-slider` 安装包。

```html
<div class="carousel-container" id="carouselContainer"></div>

<script type="module">
  // npm 安装后：
  // import BezierSlider, { renderDefaultTrack } from 'bezier-slider';

  // 本仓库本地 dist：
  import BezierSlider, { renderDefaultTrack } from './dist/bezier-slider.mjs';

  const container = document.querySelector('#carouselContainer');

  const slider = new BezierSlider({
    container,
    icons: [
      { name: '首页', emoji: '🏠', color: '#8b5cf6' },
      { name: '搜索', emoji: '🔍', color: '#ec4899' },
      { name: '消息', emoji: '💬', color: '#06b6d4' },
      { name: '设置', emoji: '⚙️', color: '#22c55e' }
    ],
    onLayout: (layout) => renderDefaultTrack(container, layout),
    onSlideEnd: (index) => {
      console.log('当前停留图标下标:', index);
    }
  });
</script>
```

要点：

- 必须使用 **单个** `<script type="module">`；普通 `<script>` 里不能写 `import`
- 不要同时写 `<script type="module" src="...">` 和另一个带 `import` 的脚本——模块作用域隔离，后者拿不到前者里的变量
- 滑轨需调用方绘制；上面用 `renderDefaultTrack` 渲染默认样式，也可改用背景图等方式（见 §6.1）

**注意**：若用 `file://` 直接打开 HTML，浏览器可能拦截 ES 模块；请用 `npm run dev` 或任意静态服务器访问。

### 方式二：Vue 3

```vue
<template>
  <BezierSlider
    class="carousel-container"
    :icons="icons"
    :initial-index="0"
    @select="onSelect"
    @slide-end="onSlideEnd"
  />
</template>

<script setup>
import { BezierSlider } from 'bezier-slider/vue';

const icons = [
  { name: '首页', emoji: '🏠', color: '#8b5cf6' },
  { name: '搜索', emoji: '🔍', color: '#ec4899' },
  { name: '消息', emoji: '💬', color: '#06b6d4' },
  { name: '设置', emoji: '⚙️', color: '#22c55e' }
];

function onSelect(icon, index) {
  console.log('选中:', icon.name, index);
}

function onSlideEnd(index) {
  console.log('滑动结束:', index);
}
</script>

<style scoped>
.carousel-container {
  width: min(100vw - 32px, 480px);
  height: min(62vw, 300px);
}
</style>
```

默认使用 `renderDefaultTrack` 绘制滑轨；传 `:render-track="null"` 可关闭，或传入自定义函数。演示页右侧代码面板可切换 Vue 代码输出。

Vue 封装为**薄包装**，内部复用 native `BezierSlider` 核心，与 React 版一致。

---

### 方式三：React

需安装 peer 依赖：`npm install react react-dom`

```jsx
import { useRef } from 'react';
import BezierSlider, { renderDefaultTrack } from 'bezier-slider/react';

function App() {
  const sliderRef = useRef(null);

  return (
    <BezierSlider
      ref={sliderRef}
      className="carousel-container"
      icons={[
        { name: '首页', emoji: '🏠', color: '#8b5cf6' },
        { name: '搜索', emoji: '🔍', color: '#ec4899' },
        { name: '消息', emoji: '💬', color: '#06b6d4' },
        { name: '设置', emoji: '⚙️', color: '#22c55e' }
      ]}
      initialIndex={0}
      renderTrack={renderDefaultTrack}
      onSelect={(icon, index) => console.log('选中:', icon.name, index)}
      onSlideEnd={(index) => console.log('滑动结束:', index)}
    />
  );
}
```

通过 `ref` 调用实例方法：

```jsx
sliderRef.current?.slideTo(2);
sliderRef.current?.getCurrentIndex();
```

演示页右侧代码面板可切换 React 代码输出。

React 封装为**薄包装**，内部复用 native `BezierSlider` 核心，逻辑与原生版一致。

---

### 开发

```bash
npm install
npm run dev
```

启动后访问 **http://127.0.0.1:5173/** 打开演示页（Vite 以 `demo/` 为 dev 根目录）。右侧代码面板支持切换 **原生 JS / React / Vue** 三种代码输出。

### 构建

```bash
npm run build
```

### 本地测试（npm link）

```bash
# 在当前项目创建链接
npm link

# 在测试项目中使用
npm link bezier-slider
```

---

## 使用样例

### 1. 自定义 icons（数量不限）

#### 文本 / Emoji

```javascript
new BezierSlider({
  container: '#carouselContainer',
  icons: [
    { name: '首页', emoji: '🏠', color: '#8b5cf6' },
    { name: '搜索', emoji: '🔍', color: '#ec4899' }
  ]
});

// 简写：字符串或数字
icons: ['A', 'B', 'C']
icons: [1, 2, 3, 4, 5, 6]

// 不传 icons：默认 4 个，显示数字 1、2、3、4
new BezierSlider({
  container: '#carouselContainer',
  defaultIconCount: 6
});
```

#### 图片（base64 或资源路径）

```javascript
icons: [
  { name: '头像', image: 'data:image/png;base64,iVBORw0KG...' },
  { name: '封面', src: './assets/cover.png' },
  { name: '远程', img: 'https://example.com/icon.jpg' }
]
```

#### SVG 资源路径

```javascript
icons: [
  { name: '设置', svgUrl: './icons/gear.svg' },
  { name: '星标', svg: '/assets/star.svg' }   // 字符串且为 .svg 路径
]
```

#### Font Icon（unicode）

```javascript
icons: [
  {
    name: '消息',
    fontIcon: '\\ue001',           // 也支持 '0xe001'、'U+E001'、59001、'&#xe001;'
    fontFamily: 'iconfont',
    fontClass: 'iconfont icon-msg'  // 可选，iconfont 类名
  }
]
```

#### SVG Path（内联路径）

```javascript
icons: [
  {
    name: '搜索',
    svgPath: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5...',
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    stroke: '#fff',
    strokeWidth: 1.5
  }
]
```

**字段识别优先级：**

`image / src / img` → `svgUrl / svgSrc` → `svgPath / path` → `fontIcon / unicode` → `emoji / text`

**通用字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 否 | 名称，默认取序号 |
| `color` | string | 否 | 背景色，默认自动分配 |
| `emoji` | string | 否 | 文本/emoji 内容 |
| `label` / `text` | string | 否 | 文本别名 |
| `image` / `src` / `img` | string | 否 | 图片 base64 或路径 |
| `svgUrl` / `svgSrc` | string | 否 | SVG 文件路径 |
| `svgPath` / `path` | string | 否 | SVG path 的 `d` 属性 |
| `viewBox` | string | 否 | 内联 SVG 视口，默认 `0 0 24 24` |
| `fill` / `iconFill` | string | 否 | SVG 填充色 |
| `stroke` / `iconStroke` | string | 否 | SVG 描边色 |
| `fontIcon` / `unicode` / `iconCode` | string \| number | 否 | 字体图标 unicode |
| `fontFamily` | string | 否 | 字体图标 font-family |
| `fontClass` / `iconClass` | string | 否 | 字体图标 CSS 类名 |

---

### 2. 控制渐隐效果

```javascript
new BezierSlider({
  container: '#carouselContainer',
  icons: [...],
  fadeEnabled: false  // 禁用渐隐效果，所有图标保持相同透明度
});
```

**Vue 版本：**
```vue
<BezierSlider :icons="icons" :fade-enabled="false" />
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `fadeEnabled` | `true` | 是否启用渐隐效果（距离中心越远越透明） |

---

### 3. 控制贝塞尔弧度（二次贝塞尔）

不传 `bezier` 时使用组件内置默认值（与 demo 当前效果一致）。

```javascript
new BezierSlider({
  container: '#carouselContainer',
  bezier: {
    fitted: {
      p0: { x: 0.003, y: 0.438 },
      p1: { x: 0.490, y: 1.090 },
      p2: { x: 0.994, y: 0.000 }
    },
    curveSmooth: 0.7,
    rightTilt: 1,
    rightEndOffset: 0.04,
    localBend: { t: 0.36, degrees: 40 },
    leftEndBend: { degrees: 10 }
  },
  centerT: 0.72
});
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `bezier.fitted` | 见源码 | 二次贝塞尔基础三控制点（归一化 0~1） |
| `bezier.curveSmooth` | `0.7` | 整体平滑度，越大越接近直线 |
| `bezier.rightTilt` | `1` | 右端上扬强度 |
| `bezier.rightEndOffset` | `0.04` | 右端相对左端的高度差 |
| `bezier.localBend.t` | `0.36` | 中间下弯位置 |
| `bezier.localBend.degrees` | `40` | 中间下弯角度 |
| `bezier.leftEndBend.degrees` | `10` | 左端下沉角度 |
| `centerT` | `0.72` | 选中中心在曲线上的参数位置（固定不变） |

---

### 4. 控制图标间距

```javascript
new BezierSlider({
  container: '#carouselContainer',
  tStep: 0.33,
  visibleIconCount: 2
});
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `tStep` | `0.33` | 相邻图标的参数 `t` 间距，越大间隔越远 |
| `visibleIconCount` | `2` | 拖动区域内最多显示几个图标 |

---

### 5. 边界拉扯回弹

滑到第一个或最后一个图标后，继续向边界外拖动会出现阻尼拉扯；松手后带回弹动画。

```javascript
new BezierSlider({
  container: '#carouselContainer',
  rubberBandLimit: 0.42,     // 最大越界量（offset 单位）
  rubberBandDuration: 420    // 回弹动画时长（ms）
});
```

---

### 6. 回调

```javascript
const slider = new BezierSlider({
  container: '#carouselContainer',

  // 图标滑到中心选中时触发（拖动过程中也会触发）
  onSelect: (icon, index) => {
    document.getElementById('selectedIcon').textContent = icon.displayLabel;
    document.getElementById('selectedName').textContent = icon.name;
  },

  // 滑动吸附或边界回弹完成后触发
  onSlideEnd: (index) => {
    console.log('停留图标下标:', index);
  },

  // 布局更新时触发，由调用方自行绘制滑轨（初始化 / resize 时也会触发）
  onLayout: (layout) => {
    // layout 含 bezier、width、height、centerPoint、fillBottom 等几何数据
    // 可使用内置 renderDefaultTrack(container, layout) 快速渲染默认样式
  }
});
```

---

### 6.1 滑轨绘制（由调用方负责）

核心 `BezierSlider` **不包含**滑轨 SVG / 中心高亮的 DOM 创建与绘制。布局变化时通过 `onLayout` 传出几何数据，调用方自行渲染：

```javascript
import BezierSlider, { renderDefaultTrack } from 'bezier-slider';

const container = document.querySelector('#carouselContainer');

new BezierSlider({
  container,
  icons: [...],
  onLayout: (layout) => renderDefaultTrack(container, layout)
});
```

`layout` 对象字段：

| 字段 | 说明 |
|------|------|
| `container` | 容器元素 |
| `width` / `height` | 容器尺寸 |
| `bezier` | 像素坐标 `{ p0, p1, p2 }` |
| `bezierNorm` | 归一化控制点 |
| `trackBounds` / `dragArea` | 滑轨与拖动区域 |
| `centerT` / `centerPoint` | 中心参数 t 及坐标 |
| `fillBottom` | 填充区域底部 y 坐标 |

也可按需使用 `ensureDefaultTrackDom` / `updateDefaultTrack`，或完全自定义绘制。静态工具：`BezierSlider.bezierPath(curve, fillToY?)`、`BezierSlider.pointOnCurve(t, curve)`。

**背景图滑轨**：容器用 CSS `background-image` 放设计稿，不传 `renderDefaultTrack`，通过 `bezier` 参数让图标轨迹与背景凹槽对齐。Demo 顶部可切换「背景图滑轨」模式查看，并支持勾选调试线对比贴合度。

---

### 7. 完整示例

```javascript
import BezierSlider, { renderDefaultTrack } from 'bezier-slider';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#carouselContainer');

  const slider = new BezierSlider({
    container,
    icons: [
      { name: '首页', emoji: '🏠', color: '#8b5cf6' },
      { name: '头像', src: './avatar.png', color: '#ec4899' },
      { name: '消息', fontIcon: '\\ue001', fontFamily: 'iconfont', color: '#06b6d4' },
      { name: '设置', svgUrl: './icons/gear.svg', color: '#22c55e' }
    ],
    tStep: 0.33,
    fadeEnabled: true,
    rubberBandLimit: 0.42,
    bezier: {
      curveSmooth: 0.7,
      localBend: { t: 0.36, degrees: 40 },
      leftEndBend: { degrees: 10 }
    },
    onSelect: (icon, index) => console.log('选中:', index, icon.name),
    onSlideEnd: (index) => console.log('停留:', index),
    onLayout: (layout) => renderDefaultTrack(container, layout)
  });

  setTimeout(() => slider.slideTo(1), 3000);
});
```

---

## 实例方法

| 方法 | 说明 |
|------|------|
| `getCurrentIndex()` | 获取当前选中图标的下标 |
| `getOffsetForIndex(index)` | 指定下标处于中心时的 offset 值 |
| `getLayoutState()` | 获取当前布局几何（与 `onLayout` 参数相同） |
| `slideTo(index, animate?)` | 滑动到指定下标，`animate` 默认 `true` |
| `initLayout()` | 重新测量布局（一般无需手动调用） |
| `destroy()` | 销毁实例，移除事件与图标 DOM |

---

## 静态工具

| 属性 / 方法 | 说明 |
|-------------|------|
| `BezierSlider.DEFAULTS` | 查看全部默认配置 |
| `BezierSlider.resolveIconContent(icon, index)` | 解析单个 icon 的展示类型 |
| `BezierSlider.renderIconContent(iconData)` | 将标准化 icon 渲染为 DOM 节点 |
| `BezierSlider.bezierPath(curve, fillToY?)` | 生成 SVG path 字符串 |
| `BezierSlider.pointOnCurve(t, curve)` | 求曲线上参数 t 处的坐标 |

### 可选滑轨渲染（从包中单独导入）

| 导出 | 说明 |
|------|------|
| `renderDefaultTrack(container, layout)` | 插入默认 DOM 并绘制滑轨 |
| `ensureDefaultTrackDom(container)` | 仅插入默认 SVG / 中心高亮 DOM |
| `updateDefaultTrack(container, layout)` | 仅更新已有滑轨 path |

---

## 配置项一览

```javascript
console.log(BezierSlider.DEFAULTS);
```

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `container` | string \| Element | — | **必填**，容器选择器或 DOM 元素 |
| `icons` | Array | `null` | 图标列表，不传则显示数字 |
| `defaultIconCount` | number | `4` | 未传 icons 时的默认数量 |
| `tStep` | number | `0.33` | 图标间距 |
| `visibleIconCount` | number | `2` | 可见图标上限 |
| `centerT` | number | `0.72` | 滑轨中心点 |
| `initialIndex` | number | `0` | 初始化时停在中心的图标下标 |
| `sensitivity` | number | `0.004` | 拖动灵敏度 |
| `snapDuration` | number | `300` | 吸附动画时长（ms） |
| `rubberBandLimit` | number | `0.42` | 边界拉扯最大越界量 |
| `rubberBandDuration` | number | `420` | 边界回弹动画时长（ms） |
| `fadeEnabled` | boolean | `true` | 是否启用渐隐效果 |
| `bezier` | object | 见源码 | 二次贝塞尔弧度配置 |
| `onSelect` | function | `null` | 选中回调 `(icon, index)` |
| `onSlideEnd` | function | `null` | 滑动完成回调 `(index)` |
| `onLayout` | function | `null` | 布局更新回调 `(layout)`，供调用方绘制滑轨 |

---

## Vue 组件 Props

与 native 配置项一致；默认调用 `renderDefaultTrack` 绘制滑轨。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icons` | Array | `[...]` | 图标列表 |
| `initialIndex` | Number | `0` | 初始化停在中心的图标下标 |
| `tStep` / `visibleIconCount` / `centerT` / `bezier` 等 | — | 同 native | 见配置项一览 |
| `renderTrack` | Function \| null | `renderDefaultTrack` | 滑轨绘制；`null` 关闭 |
| `rootClass` / `rootStyle` | — | — | 外层容器样式 |

### Vue 组件 Events

| Event | 参数 | 说明 |
|-------|------|------|
| `select` | `(icon, index)` | 图标进入中心选中时触发 |
| `slide-end` | `(index)` | 滑动吸附完成时触发 |

### Vue 组件 Methods（ref）

| 方法 | 说明 |
|------|------|
| `slideTo(index, animate?)` | 滑动到指定下标 |
| `getCurrentIndex()` | 当前选中下标 |
| `getLayoutState()` | 当前布局几何 |
| `getInstance()` | native `BezierSlider` 实例 |

---

## React 组件 Props

与 native 配置项一致，通过 props 传入；滑轨使用 `renderTrack`（等价于 native 的 `onLayout` + `renderDefaultTrack`）。

| Prop | 类型 | 说明 |
|------|------|------|
| `icons` | Array | 图标列表 |
| `initialIndex` | number | 初始化停在中心的图标下标，默认 `0` |
| `tStep` / `visibleIconCount` / `centerT` / `bezier` 等 | — | 同 native 配置项 |
| `renderTrack` | `(container, layout) => void` | 绘制滑轨，如 `renderDefaultTrack` |
| `onLayout` | `(layout) => void` | 布局更新（在 `renderTrack` 之后触发） |
| `onSelect` | `(icon, index) => void` | 选中回调 |
| `onSlideEnd` | `(index) => void` | 滑动完成回调 |
| `className` / `style` | — | 容器 div 样式 |

### React ref 方法

| 方法 | 说明 |
|------|------|
| `slideTo(index, animate?)` | 滑动到指定下标 |
| `getCurrentIndex()` | 当前选中下标 |
| `getLayoutState()` | 当前布局几何 |
| `getInstance()` | 获取 native `BezierSlider` 实例 |

`icons`、`bezier` 等配置变更时会自动 destroy 并按新配置重建实例。

---

## 样式说明

核心会在首次初始化时自动注入图标、滑轨 SVG、中心高亮等**基础样式**（`abs-slider-base-styles`）。调用方只需为容器定义尺寸，例如：

```css
.carousel-container {
  position: relative;
  width: min(100vw - 32px, 480px);
  height: min(62vw, 300px);
  overflow: hidden;
}
```

如需自定义外观，可在页面 CSS 中覆盖以下类名：

| 类名 | 说明 |
|------|------|
| `.carousel-container` | 外层容器（需自行定义尺寸） |
| `.track-fill` / `.track-glow` / `.track-line` | 滑轨 SVG 路径 |
| `.center-highlight` | 中心高亮光晕 |
| `.carousel-icon` | 图标外层圆形容器 |
| `.abs-icon-image` | 图片 / SVG 文件图标 |
| `.abs-icon-font` | 字体图标 |
| `.abs-icon-svg` | 内联 SVG path 图标 |
| `.abs-icon-text` | 文本 / emoji 图标 |

以上 `.carousel-icon`、`.track-*` 等默认样式已由核心注入，通常无需重复编写。

使用 font-icon 时，记得在页面中引入对应字体：

```css
@font-face {
  font-family: 'iconfont';
  src: url('./fonts/iconfont.woff2') format('woff2');
}
```

---

## 技术说明

- 滑轨类型：**二次贝塞尔**（`M … Q …`），非三次贝塞尔，非折线近似
- 图标位置：沿曲线参数 `t` 均匀偏移，中心固定在 `centerT`
- 拖动区域：初始化时通过 `container.clientWidth / clientHeight` 动态测量
- 边界回弹：越界拖动时阻尼递增，松手后以 `easeOutBack` 回弹至合法边界
- 无第三方依赖，纯原生 JavaScript + Vue 3

---

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v3.0 | 2026-06-10 | 支持 Vue 3；添加 `fadeEnabled` 参数；项目结构重构 |
| v2.2 | 2026-06-09 | 支持图片/SVG/font-icon 多种图标；边界拉扯回弹 |
| v2.1 | 2026-06-09 | 抽象公共组件；中文注释；动态布局 |
| v2.0 | 2026-06-09 | 二次贝塞尔滑轨；弧度/间距/回调可配置 |
| v1.0 | 2026-06-09 | 初始圆弧版本（已废弃） |
