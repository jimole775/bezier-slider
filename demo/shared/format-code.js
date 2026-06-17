import { ICONS } from './constants.js';
import { buildSliderConfig } from './param-utils.js';

function formatObjectBlock(obj, lineIndent = 2) {
    const pad = ' '.repeat(lineIndent);
    return JSON.stringify(obj, null, 2).replace(/\n/g, `\n${pad}`);
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
${indent}:bezier='${formatObjectBlock(cfg.bezier, 2)}'`;
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

export const CODE_FORMATTERS = {
    native: formatNativeCode,
    react: formatReactCode,
    vue: formatVueCode
};
