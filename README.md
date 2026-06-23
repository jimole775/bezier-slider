# BezierSlider — 贝塞尔弧形图标滑块

基于**二次贝塞尔曲线**的弧形图标滑块组件。图标沿平滑弧线排列，支持拖动、吸附、边界回弹，以及近大远小的视觉反馈。

**支持平台**：现代浏览器（HTML + JavaScript / Vue 2 / Vue 3 / React）、**uni-app 小程序**（微信等，canvas 滑轨）。

[demo](https://jimole775.github.io/bezier-slider/demo)（Web 演示，含参数调节与代码输出）

---

## 目录

- [功能介绍](#功能介绍)
- [平台与入口](#平台与入口)
- [快速开始](#快速开始)（[HTML](#方式一html--javascript) · [Vue](#方式二vue) · [React](#方式三react) · [小程序](#方式四uni-app-小程序) · [TypeScript](#typescript)）
- [使用样例](#使用样例)（icons、bezier、回调等，以 HTML / DOM 版为主）
- [API 参考](#api-参考)（[HTML / DOM](#html--dom-版-bezierslider) · [Vue](#vue-组件) · [React](#react-组件) · [小程序](#小程序组件)）
- [样式说明](#样式说明)

---

## 功能介绍

| 功能 | 说明 |
|------|------|
| 弧形滑轨 | 图标沿二次贝塞尔曲线分布；Web 版 SVG 绘制，小程序版 canvas 绘制 |
| 近大远小 | 越靠近中心点（`centerT`）的图标越大、越亮 |
| 渐隐效果 | 距离中心越远越透明，可通过 `fadeEnabled` 控制 |
| 拖动滑动 | 支持鼠标拖动与触摸滑动，方向与手势一致 |
| 自动吸附 | 松手后平滑吸附到最近的图标 |
| 边界回弹 | 滑到首/末图标后继续越界拖动，松手带回弹效果 |
| 可见数量控制 | 拖动区域内最多同时显示 2 个图标（可配置） |
| 动态布局 | 初始化时自动测量容器尺寸，窗口变化时重新布局 |
| 弧度可配 | 支持整体平滑度、左/右端高度、局部下弯角度等 |
| 多种图标 | Web：emoji、图片、SVG、font-icon；小程序：优先 emoji / 图片 / 文字 |
| 滑动防选中 | 拖动过程中禁用页面文字框选（Web DOM 版） |

> DOM 版与小程序版共享 `src/core/` 滑动算法（`BezierSliderEngine`），渲染与交互层各自实现，**入口不可混用**。详见 [平台与入口](#平台与入口)。

---

## 平台与入口

本包按**运行环境**拆成多条入口。DOM 版（默认 / Vue / React）与小程序版（`mp`）实现不同，**不可混用**：小程序里请用 `bezier-slider/mp`，浏览器 / uni-app H5 请用 DOM 版。

### 包入口一览

| 导入路径 | 构建产物 | 根目录 shim | 实现方式 | 适用场景 |
|----------|----------|-------------|----------|----------|
| `bezier-slider` | `dist/bezier-slider.{mjs,cjs}` | — | `BezierSlider` class + DOM（HTML 直接使用） | 浏览器、`<script type="module">` |
| `bezier-slider/vue` | `dist/bezier-slider.vue.{mjs,cjs}` | `vue.js` | Vue 3 薄包装 → DOM 核心 | Vue 3 Web / uni-app H5 |
| `bezier-slider/vue2` | `dist/bezier-slider.vue2.{mjs,cjs}` | `vue2.js` | Vue 2 薄包装 → DOM 核心 | Vue 2 Web / uni-app H5 |
| `bezier-slider/react` | `dist/bezier-slider.react.{mjs,cjs}` | `react.js` | React 18+ 薄包装 → DOM 核心 | React Web |
| `bezier-slider/mp` | `dist/bezier-slider.mp.{mjs,cjs}` | `mp.js` | Vue 2 组件 + `BezierSliderEngine` + canvas | **uni-app 小程序** |

- **ESM**：`import … from 'bezier-slider/…'` → 解析为 `dist/*.mjs`（Vite / Webpack 5+ 等）
- **CJS**：`require('bezier-slider/…')` → 解析为 `dist/*.cjs`
- **旧打包器**：Webpack 4、部分 uni-app 构建链不识别 `package.json` 的 `exports`，请改用根目录 `vue.js` / `vue2.js` / `react.js` / `mp.js`（见 [uni-app 兼容说明](#uni-app--vue-cliwebpack-4-兼容说明)）

### 运行环境支持

| 环境 | 支持 | 推荐入口 | 备注 |
|------|:----:|----------|------|
| 现代浏览器（ES Module） | ✅ | `bezier-slider` | 需静态服务器，勿用 `file://` |
| Vite / Webpack 5+ / Rollup | ✅ | 按框架选对应 subpath | 识别 `exports` 字段 |
| Webpack 4 / 旧 uni-app 构建 | ✅ | 根目录 `*.js` shim | 需 `transpileDependencies: ['bezier-slider']` |
| Vue 2 / Vue 3（Web） | ✅ | `bezier-slider/vue2` 或 `/vue` | peer：`vue@>=2.6` 或 `>=3.4` |
| React 18+（Web） | ✅ | `bezier-slider/react` | peer：`react`、`react-dom` |
| uni-app **H5** | ✅ | `bezier-slider/vue2` 或 `/vue` | 走浏览器 DOM，**不要用 `/mp`** |
| uni-app **微信小程序** 等小程序 | ✅ | `bezier-slider/mp` | canvas 滑轨 + 声明式图标，无 DOM |
| **TypeScript 项目** | ✅ | 同上各入口 | 包内自带 `types/`，无需 `@types/bezier-slider` |
| uni-app **App**（vue 页面） | ⚠️ | `bezier-slider/mp` | 非 H5 时走 canvas 分支，未全面验证 |
| Node.js / SSR | ❌ | — | DOM 版无 `document`；`mp` 依赖 `uni` API |
| 微信原生（非 uni-app） | ❌ | — | 需自行移植算法，暂无原生 WXML 组件 |
| React Native | ❌ | — | 暂无适配 |

### DOM 版 vs 小程序版

| 对比项 | DOM 版（`/`、`/vue`、`/vue2`、`/react`） | 小程序版（`/mp`） |
|--------|------------------------------------------|-------------------|
| 渲染 | `document.createElement`、SVG 滑轨 | `<view>` / `<image>` / `<text>` + canvas 滑轨 |
| 交互 | 鼠标 + 触摸（绑定在 DOM 上） | `@touchstart` / `@touchmove` / `@touchend` |
| 滑轨 | `renderDefaultTrack`（SVG） | 内置 canvas 绘制，`:show-track="false"` 可关 |
| 图标 | emoji、图片、SVG path、font-icon 等 | 优先 **emoji / 图片 / 文字**；fontIcon、svgPath 支持有限 |
| 核心 | `bezier-slider.native.js` | 共享 `BezierSliderEngine`（`src/core/`） |

小程序版 Props / Events 与 Vue2 Web 版大体一致，另含 `show-track`、`iconSize` 等；完整说明见 [小程序组件](#小程序组件) 与 [方式四 · uni-app 小程序](#方式四uni-app-小程序)。

### 项目结构（简要）

```
src/
├── core/                  # 共享算法：bezier 数学、icons 解析、BezierSliderEngine
├── bezier-slider.native.js # DOM 版核心
├── mp/
│   ├── BezierSliderMp.vue # uni-app 小程序组件
│   ├── track-canvas.js    # canvas 滑轨绘制
│   └── mp-bridge.js       # props → engine 选项映射
├── components/            # Vue / React / Vue2 Web 包装
├── mp-component.js        # bezier-slider/mp 入口
└── index.js               # bezier-slider 默认入口
```

---

## 快速开始

### 方式一：HTML + JavaScript

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

### 方式二：Vue

**Vue 3**（需 `vue@>=3.4`）：

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

**Vue 2**（需 `vue@>=2.6`，Options API）：

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

<script>
import { BezierSlider } from 'bezier-slider/vue2';

export default {
  components: { BezierSlider },
  data() {
    return {
      icons: [
        { name: '首页', emoji: '🏠', color: '#8b5cf6' },
        { name: '搜索', emoji: '🔍', color: '#ec4899' },
        { name: '消息', emoji: '💬', color: '#06b6d4' },
        { name: '设置', emoji: '⚙️', color: '#22c55e' }
      ]
    };
  },
  methods: {
    onSelect(icon, index) {
      console.log('选中:', icon.name, index);
    },
    onSlideEnd(index) {
      console.log('滑动结束:', index);
    }
  }
};
</script>

<style scoped>
.carousel-container {
  width: min(100vw - 32px, 480px);
  height: min(62vw, 300px);
}
</style>
```

默认使用 `renderDefaultTrack` 绘制滑轨；传 `:render-track="null"` 可关闭，或传入自定义函数。演示页右侧代码面板可切换 Vue 代码输出。

Vue 封装为**薄包装**，内部复用 DOM 版 `BezierSlider` 核心，与 React 版一致。

#### uni-app H5 / Webpack 4 兼容

H5 端与纯 Web 相同，使用 `bezier-slider/vue2` 或 `/vue`（依赖浏览器 DOM）：

```js
import { BezierSlider } from 'bezier-slider/vue2';

export default {
  components: { BezierSlider }
};
```

**uni-app 微信小程序等小程序端**请使用独立入口 `bezier-slider/mp`，见 [方式四 · uni-app 小程序](#方式四uni-app-小程序)。

旧版 Webpack 不识别 `package.json` 的 `exports` 时，改用根目录 shim 文件（`vue.js` / `vue2.js` / `react.js` / **`mp.js`**）。若报语法错误，在 `vue.config.js` 中加入：

```js
module.exports = {
  transpileDependencies: ['bezier-slider']
};
```

入口对照见 [平台与入口 · 包入口一览](#包入口一览)。

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

React 封装为**薄包装**，内部复用 DOM 版 `BezierSlider` 核心，逻辑与 HTML 入口一致。

---

### 方式四：uni-app 小程序

适用于 **微信小程序、支付宝小程序** 等 uni-app **非 H5** 编译目标。使用 Vue 2 组件 + `BezierSliderEngine` + **canvas 滑轨**，无 `document` / DOM 依赖。

> **不要**在小程序里使用 `bezier-slider/vue2` 或 `/vue`；**不要**在 H5 里使用 `/mp`（H5 请用 Vue 入口）。

**安装**

```bash
npm install bezier-slider
```

**页面示例**

```vue
<template>
  <view class="slider-wrap">
    <BezierSlider
      ref="slider"
      :icons="icons"
      :initial-index="0"
      :bezier="bezier"
      :show-track="true"
      :icon-size="50"
      @select="onSelect"
      @slide-end="onSlideEnd"
    />
  </view>
</template>

<script>
import BezierSlider from 'bezier-slider/mp';

export default {
  components: { BezierSlider },
  data() {
    return {
      icons: [
        { name: '首页', emoji: '🏠', color: '#8b5cf6' },
        { name: '搜索', emoji: '🔍', color: '#ec4899' },
        { name: '消息', emoji: '💬', color: '#06b6d4' },
        { name: '设置', emoji: '⚙️', color: '#22c55e' }
      ],
      bezier: {
        curveSmooth: 0.1,
        localBend: { t: 0.36, degrees: 38 }
      }
    };
  },
  methods: {
    onSelect(icon, index) {
      console.log('选中:', icon.name, index);
    },
    onSlideEnd(index) {
      console.log('停留:', index);
    }
  }
};
</script>

<style>
.slider-wrap {
  width: 690rpx;
  height: 320rpx;
}
</style>
```

**要点**

| 项 | 说明 |
|----|------|
| 入口 | `import BezierSlider from 'bezier-slider/mp'` 或 `require('bezier-slider/mp')` |
| 旧构建链 | 使用根目录 `mp.js` → `dist/bezier-slider.mp.cjs` |
| 容器尺寸 | 外层 `view` 必须给出宽高（如 `rpx` / `px`），组件内部会 `boundingClientRect` 测量 |
| 滑轨 | 默认 canvas 绘制；`:show-track="false"` 关闭后可用容器背景图对齐轨迹 |
| 图标 | 推荐 **emoji / 图片 URL / 文字**；`fontIcon`、`svgPath` 支持有限 |
| 与 swiper 联动 | 提供 `followSwiper` / `endExternalFollow` 等方法，见 [小程序组件 · Methods](#小程序组件-methodsref) |
| 转译 | 必要时 `transpileDependencies: ['bezier-slider']` |

完整 Props / Events / Methods 见 [小程序组件](#小程序组件)。

---

### TypeScript

包内自带类型声明（`types/` 目录），**库源码仍为 JavaScript**，使用方在 TS 项目中可直接获得类型提示，无需安装 `@types/bezier-slider`。

| 导入路径 | 类型声明文件 |
|----------|--------------|
| `bezier-slider` | `types/bezier-slider.d.ts` |
| `bezier-slider/vue` | `types/vue.d.ts` |
| `bezier-slider/vue2` | `types/vue2.d.ts` |
| `bezier-slider/react` | `types/react.d.ts` |
| `bezier-slider/mp` | `types/mp.d.ts` |

共享类型（`BezierSliderOptions`、`SliderIconInput`、`BezierConfig`、`LayoutState` 等）从各入口 re-export，通常写：

```ts
import BezierSlider, { renderDefaultTrack } from 'bezier-slider';
import type { BezierSliderOptions, LayoutState, NormalizedIcon } from 'bezier-slider';

import { BezierSlider as VueSlider } from 'bezier-slider/vue';
import BezierSliderReact from 'bezier-slider/react';
import BezierSliderMp from 'bezier-slider/mp';
```

`package.json` 的 `exports` 已为每个 subpath 配置 `"types"` 字段，Vite、Webpack 5+、`tsc` 会自动解析。

**Vue 2 + TS**：若模板里用组件，请在项目中配置 `shims-vue.d.ts`（与使用任何 `.vue` 组件相同）。  
**uni-app + TS**：小程序入口同样走 `bezier-slider/mp`；必要时在 `tsconfig.json` 中加入 `"types": ["@dcloudio/types"]` 等 uni 类型。

---

### 开发

```bash
npm install
npm run dev
```

启动后访问 **http://127.0.0.1:5173/index.dev.html** 打开演示页。右侧代码面板支持切换 **HTML / React / Vue / 小程序**，以及 **JS / TS** 代码输出。

GitHub Pages 演示构建：

```bash
npm run build:demo   # 产物同步到 demo/index.html + demo/assets/
```

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

以下示例以 **HTML / DOM 版**（`bezier-slider` / Vue / React）为主。小程序版通过组件 Props 传入相同配置项（如 `:bezier`、`:t-step`），详见 [小程序组件](#小程序组件)。

### 1. 自定义 icons（数量不限）

> **小程序**：优先使用 `emoji`、`image`/`src`/`img`、文字字段；SVG path、font-icon 在部分端上不可用或表现不一致。

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

**背景图滑轨**：容器用 CSS `background-image` 放设计稿，不传 `renderDefaultTrack`，通过 `bezier` 参数让图标轨迹与背景凹槽对齐。Web Demo 支持上传背景图并显示调试线对比贴合度。

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

## API 参考

### HTML / DOM 版 BezierSlider

#### 实例方法

| 方法 | 说明 |
|------|------|
| `getCurrentIndex()` | 获取当前选中图标的下标 |
| `getOffsetForIndex(index)` | 指定下标处于中心时的 offset 值 |
| `getLayoutState()` | 获取当前布局几何（与 `onLayout` 参数相同） |
| `slideTo(index, animate?)` | 滑动到指定下标，`animate` 默认 `true` |
| `initLayout()` | 重新测量布局（一般无需手动调用） |
| `destroy()` | 销毁实例，移除事件与图标 DOM |

#### 静态工具

| 属性 / 方法 | 说明 |
|-------------|------|
| `BezierSlider.DEFAULTS` | 查看全部默认配置 |
| `BezierSlider.resolveIconContent(icon, index)` | 解析单个 icon 的展示类型 |
| `BezierSlider.renderIconContent(iconData)` | 将标准化 icon 渲染为 DOM 节点 |
| `BezierSlider.bezierPath(curve, fillToY?)` | 生成 SVG path 字符串 |
| `BezierSlider.pointOnCurve(t, curve)` | 求曲线上参数 t 处的坐标 |

#### 可选滑轨渲染（从包中单独导入）

| 导出 | 说明 |
|------|------|
| `renderDefaultTrack(container, layout)` | 插入默认 DOM 并绘制滑轨 |
| `ensureDefaultTrackDom(container)` | 仅插入默认 SVG / 中心高亮 DOM |
| `updateDefaultTrack(container, layout)` | 仅更新已有滑轨 path |

#### 配置项一览

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
| `trackScale` | number | `1` | 轨迹长度缩放 |
| `iconSize` | number | `50` | 图标尺寸（px，engine 层） |
| `fadeEnabled` | boolean | `false` | 是否启用渐隐效果 |
| `centerGlowEnabled` | boolean | `true` | 中心光晕 |
| `bezier` | object | 见源码 | 二次贝塞尔弧度配置 |
| `onSelect` | function | `null` | 选中回调 `(icon, index)` |
| `onSlideEnd` | function | `null` | 滑动完成回调 `(index)` |
| `onLayout` | function | `null` | 布局更新回调 `(layout)`，供调用方绘制滑轨 |

### Vue 组件

与 HTML / DOM 版配置项一致；默认调用 `renderDefaultTrack` 绘制滑轨。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icons` | Array | `[...]` | 图标列表 |
| `initialIndex` | Number | `0` | 初始化停在中心的图标下标 |
| `tStep` / `visibleIconCount` / `centerT` / `bezier` 等 | — | 同 HTML / DOM 版 | 见配置项一览 |
| `renderTrack` | Function \| null | `renderDefaultTrack` | 滑轨绘制；`null` 关闭 |
| `rootClass` / `rootStyle` | — | — | 外层容器样式 |

#### Events

| Event | 参数 | 说明 |
|-------|------|------|
| `select` | `(icon, index)` | 图标进入中心选中时触发 |
| `slide-end` | `(index)` | 滑动吸附完成时触发 |

#### Methods（ref）

| 方法 | 说明 |
|------|------|
| `slideTo(index, animate?)` | 滑动到指定下标 |
| `getCurrentIndex()` | 当前选中下标 |
| `getLayoutState()` | 当前布局几何 |
| `getInstance()` | DOM 版 `BezierSlider` 实例 |

### React 组件

与 HTML / DOM 版配置项一致，通过 props 传入；滑轨使用 `renderTrack`（等价于默认入口的 `onLayout` + `renderDefaultTrack`）。

#### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `icons` | Array | 图标列表 |
| `initialIndex` | number | 初始化停在中心的图标下标，默认 `0` |
| `tStep` / `visibleIconCount` / `centerT` / `bezier` 等 | — | 同 HTML / DOM 版配置项 |
| `renderTrack` | `(container, layout) => void` | 绘制滑轨，如 `renderDefaultTrack` |
| `onLayout` | `(layout) => void` | 布局更新（在 `renderTrack` 之后触发） |
| `onSelect` | `(icon, index) => void` | 选中回调 |
| `onSlideEnd` | `(index) => void` | 滑动完成回调 |
| `className` / `style` | — | 容器 div 样式 |

#### ref 方法

| 方法 | 说明 |
|------|------|
| `slideTo(index, animate?)` | 滑动到指定下标 |
| `getCurrentIndex()` | 当前选中下标 |
| `getLayoutState()` | 当前布局几何 |
| `getInstance()` | 获取 DOM 版 `BezierSlider` 实例 |

`icons`、`bezier` 等配置变更时会自动 destroy 并按新配置重建实例。

### 小程序组件

入口：`import BezierSlider from 'bezier-slider/mp'`。基于 `BezierSliderEngine`，滑轨由组件内置 canvas（小程序）或 SVG（H5 编译分支）绘制，**无** `renderTrack` / `onLayout` 回调。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icons` | Array | 内置 4 项 | 图标列表，字段见 [使用样例 · icons](#1-自定义-icons数量不限) |
| `initialIndex` | Number | `0` | 初始停在中心的图标下标 |
| `defaultIconCount` | Number | `4` | 未传 icons 时的占位数量 |
| `tStep` | Number | `0.33` | 图标间距 |
| `visibleIconCount` | Number | `2` | 可见图标上限 |
| `centerT` | Number | `0.72` | 中心点在曲线上的参数 t |
| `trackScale` | Number | `1` | 轨迹长度缩放 |
| `sensitivity` | Number | `0.004` | 拖动灵敏度 |
| `snapDuration` | Number | `300` | 吸附动画时长（ms） |
| `rubberBandLimit` | Number | `0.42` | 边界拉扯最大越界量 |
| `rubberBandDuration` | Number | `420` | 边界回弹时长（ms） |
| `fadeEnabled` | Boolean | `false` | 是否启用渐隐 |
| `centerGlowEnabled` | Boolean | `true` | 中心光晕（引擎层，与 DOM 版一致） |
| `bezier` | Object | 见 `DEFAULTS` | 二次贝塞尔弧度配置 |
| `iconSize` | Number | `50` | 图标直径（px） |
| `showTrack` | Boolean | `true` | 是否绘制默认滑轨；`false` 时可改用背景图 |
| `rootClass` | String / Array / Object | — | 根节点 class |
| `rootStyle` | String / Object / Array | — | 根节点 style |

#### Events

| Event | 参数 | 说明 |
|-------|------|------|
| `select` | `(icon, index)` | 图标进入中心选中时 |
| `slide-end` | `(index)` | 吸附或回弹完成时 |
| `drag-start` | — | 开始拖动 |
| `drag-move` | `(payload)` | 拖动中（含 offset 等） |

#### Methods（ref）

| 方法 | 说明 |
|------|------|
| `slideTo(index, animate?)` | 滑动到指定下标 |
| `getCurrentIndex()` | 当前选中下标 |
| `getLayoutState()` | 当前布局几何（与 engine 一致） |
| `getInstance()` | 获取 `BezierSliderEngine` 实例 |
| `followSwiper(payload)` | 与外部 swiper 联动跟手 |
| `endExternalFollow(index)` | 结束外部跟手并吸附到指定下标 |
| `animateToIndex(index, duration, onComplete?)` | 指定时长动画到某下标 |
| `followIndexFloat(indexFloat)` | 按浮点下标跟手（连续滑动） |

#### 额外导出

| 导出 | 说明 |
|------|------|
| `BezierSliderEngine` | 共享滑动引擎，可脱离组件单独使用 |
| `drawDefaultTrackOnCanvas` | canvas 滑轨绘制工具函数 |

---

## 样式说明

### DOM 版（Web）

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

### 小程序版（uni-app）

组件使用 scoped 样式，主要类名：

| 类名 | 说明 |
|------|------|
| `.bezier-slider-mp` | 根容器，需外层给出宽高 |
| `.bezier-slider-mp__track-canvas` | canvas 滑轨层 |
| `.bezier-slider-mp__icon` | 图标圆形容器 |
| `.bezier-slider-mp__icon-text` | emoji / 文字图标 |
| `.bezier-slider-mp__icon-image` | 图片图标 |

滑轨样式内置于组件；若 `:show-track="false"`，可在父级 `view` 用背景图对齐轨迹。图标 `color` 字段仍作用于圆形背景色。
