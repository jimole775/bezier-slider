import { ICONS } from './constants.js';
import { buildSliderConfig } from './param-utils.js';

function isIdentifierKey(key) {
    return /^[A-Za-z_$][\w$]*$/.test(key);
}

function formatJsString(value) {
    return `'${value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')}'`;
}

function formatJsValue(value, indent = 0) {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return formatJsString(value);

    const pad = ' '.repeat(indent);
    const innerPad = ' '.repeat(indent + 2);

    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map((item) => `${innerPad}${formatJsValue(item, indent + 2)}`).join(',\n');
        return `[\n${items}\n${pad}]`;
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        const lines = entries.map(([key, val]) => {
            const keyStr = isIdentifierKey(key) ? key : formatJsString(key);
            return `${innerPad}${keyStr}: ${formatJsValue(val, indent + 2)}`;
        }).join(',\n');
        return `{\n${lines}\n${pad}}`;
    }

    return formatJsString(String(value));
}

function formatObjectBlock(obj, lineIndent = 2) {
    return formatJsValue(obj, lineIndent);
}

function buildContainerSize(displaySize) {
    return {
        width: displaySize?.width ?? 480,
        height: displaySize?.height ?? 300
    };
}

function buildSliderOptions(cfg, indent = '  ') {
    return `${indent}centerT: ${cfg.centerT},
${indent}tStep: ${cfg.tStep},
${indent}trackScale: ${cfg.trackScale},
${indent}initialIndex: ${cfg.initialIndex},
${indent}visibleIconCount: ${cfg.visibleIconCount},
${indent}sensitivity: ${cfg.sensitivity},
${indent}snapDuration: ${cfg.snapDuration},
${indent}rubberBandLimit: ${cfg.rubberBandLimit},
${indent}rubberBandDuration: ${cfg.rubberBandDuration},
${indent}fadeEnabled: ${cfg.fadeEnabled},
${indent}centerGlowEnabled: ${cfg.centerGlowEnabled},
${indent}bezier: ${formatObjectBlock(cfg.bezier, indent.length + 2)}`;
}

function buildReactProps(cfg, indent = '      ') {
    const bezier = formatObjectBlock(cfg.bezier, indent.length + 2).replace(/\n/g, `\n${indent}  `);
    return `${indent}centerT={${cfg.centerT}}
${indent}tStep={${cfg.tStep}}
${indent}trackScale={${cfg.trackScale}}
${indent}initialIndex={${cfg.initialIndex}}
${indent}visibleIconCount={${cfg.visibleIconCount}}
${indent}sensitivity={${cfg.sensitivity}}
${indent}snapDuration={${cfg.snapDuration}}
${indent}rubberBandLimit={${cfg.rubberBandLimit}}
${indent}rubberBandDuration={${cfg.rubberBandDuration}}
${indent}fadeEnabled={${cfg.fadeEnabled}}
${indent}centerGlowEnabled={${cfg.centerGlowEnabled}}
${indent}bezier={${bezier}}`;
}

function buildVueProps(cfg, indent = '    ') {
    return `${indent}:centerT="${cfg.centerT}"
${indent}:tStep="${cfg.tStep}"
${indent}:trackScale="${cfg.trackScale}"
${indent}:initialIndex="${cfg.initialIndex}"
${indent}:visibleIconCount="${cfg.visibleIconCount}"
${indent}:sensitivity="${cfg.sensitivity}"
${indent}:snapDuration="${cfg.snapDuration}"
${indent}:rubberBandLimit="${cfg.rubberBandLimit}"
${indent}:rubberBandDuration="${cfg.rubberBandDuration}"
${indent}:fadeEnabled="${cfg.fadeEnabled}"
${indent}:centerGlowEnabled="${cfg.centerGlowEnabled}"
${indent}:bezier="${formatObjectBlock(cfg.bezier, 2)}"`;
}

function buildMpProps(cfg, indent = '      ') {
    return `${indent}:initial-index="${cfg.initialIndex}"
${indent}:t-step="${cfg.tStep}"
${indent}:track-scale="${cfg.trackScale}"
${indent}:visible-icon-count="${cfg.visibleIconCount}"
${indent}:center-t="${cfg.centerT}"
${indent}:sensitivity="${cfg.sensitivity}"
${indent}:snap-duration="${cfg.snapDuration}"
${indent}:rubber-band-limit="${cfg.rubberBandLimit}"
${indent}:rubber-band-duration="${cfg.rubberBandDuration}"
${indent}:fade-enabled="${cfg.fadeEnabled}"
${indent}:center-glow-enabled="${cfg.centerGlowEnabled}"
${indent}:show-track="true"
${indent}:bezier="${formatObjectBlock(cfg.bezier, 2)}"`;
}

function pxToRpx(px) {
    return Math.round(px * 2);
}

function buildContainerHtml(displaySize) {
    const { width, height } = buildContainerSize(displaySize);
    return `<div id="slider" style="position:relative;width:${width}px;height:${height}px;overflow:visible"></div>`;
}

function buildIconsBlock(indent = '') {
    return `${indent}const icons = ${formatObjectBlock(ICONS, indent.length + 2)};`;
}

export function formatNativeCode(params, options = {}) {
    const cfg = buildSliderConfig(params);
    const { displaySize } = options;
    const sliderOptions = buildSliderOptions(cfg);

    return `<!-- 复制 HTML + 下方 script 即可运行 -->
${buildContainerHtml(displaySize)}

<script type="module">
import BezierSlider from 'bezier-slider';

${buildIconsBlock()}

const container = document.getElementById('slider');

new BezierSlider({
  container,
  icons,
${sliderOptions},
  onLayout: () => {
    // 滑轨由页面背景承载；layout.bezier 可用于对齐调试
  }
});
</script>`;
}

export function formatReactCode(params, options = {}) {
    const cfg = buildSliderConfig(params);
    const { displaySize } = options;
    const { width, height } = buildContainerSize(displaySize);
    const sliderOptions = buildReactProps(cfg);
    const icons = formatObjectBlock(ICONS, 6);

    return `import BezierSlider from 'bezier-slider/react';

const icons = ${icons};

export function SliderDemo() {
  return (
    <BezierSlider
      style={{ position: 'relative', overflow: 'visible', width: ${width}, height: ${height} }}
      icons={icons}
${sliderOptions}
      renderTrack={null}
      onSelect={handleSelect}
      onSlideEnd={handleSlideEnd}
    />
  );
}`;
}

export function formatVueCode(params, options = {}) {
    const cfg = buildSliderConfig(params);
    const { displaySize } = options;
    const { width, height } = buildContainerSize(displaySize);
    const sliderOptions = buildVueProps(cfg);
    const icons = formatObjectBlock(ICONS, 2);

    return `<script setup>
import { BezierSlider } from 'bezier-slider/vue';
// vue2 版本
// import { BezierSlider } from 'bezier-slider/vue2';

const icons = ${icons};
</script>

<template>
  <BezierSlider
    :root-style="{ position: 'relative', overflow: 'visible', width: '${width}px', height: '${height}px' }"
    :icons="icons"
${sliderOptions}
    :render-track="null"
    @select="onSelect"
    @slide-end="onSlideEnd"
  />
</template>`;
}

export function formatMpCode(params, options = {}) {
    const cfg = buildSliderConfig(params);
    const hint = options.displaySize ?? {};
    const widthRpx = pxToRpx(hint.trackWidth ?? hint.width ?? 480);
    const heightRpx = pxToRpx(hint.trackHeight ?? hint.height ?? 300);
    const sliderOptions = buildMpProps(cfg);
    const icons = formatObjectBlock(ICONS, 6);

    return `<template>
  <view class="slider-wrap">
    <BezierSlider
      :icons="icons"
${sliderOptions}
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
      icons: ${icons}
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
  width: ${widthRpx}rpx;
  height: ${heightRpx}rpx;
}
</style>`;
}

export const CODE_FORMATTERS = {
    native: formatNativeCode,
    react: formatReactCode,
    vue: formatVueCode,
    mp: formatMpCode
};
