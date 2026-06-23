<template>
  <view
    class="bezier-slider-mp"
    :class="rootClass"
    :style="[rootStyle, containerStyle]"
    @touchstart="onTouchStart"
    @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- #ifdef H5 -->
    <svg
      v-if="showTrack && layoutReady"
      class="bezier-slider-mp__track"
      :viewBox="trackPaths.viewBox"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="bezierSliderGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 220, 150, 0.3)" />
          <stop offset="50%" stop-color="rgba(255, 230, 180, 0.9)" />
          <stop offset="100%" stop-color="rgba(255, 200, 100, 0.5)" />
        </linearGradient>
      </defs>
      <path class="bezier-slider-mp__track-fill" :d="trackPaths.fillPath" />
      <path class="bezier-slider-mp__track-glow" :d="trackPaths.linePath" />
      <path class="bezier-slider-mp__track-line" :d="trackPaths.linePath" />
    </svg>
    <!-- #endif -->

    <!-- #ifdef MP -->
    <canvas
      v-if="showTrack && layoutReady"
      :canvas-id="canvasId"
      :id="canvasId"
      class="bezier-slider-mp__track-canvas"
      :style="{ width: containerWidth + 'px', height: containerHeight + 'px' }"
    />
    <!-- #endif -->

    <!-- #ifndef H5 || MP -->
    <canvas
      v-if="showTrack && layoutReady"
      :canvas-id="canvasId"
      class="bezier-slider-mp__track-canvas"
      :style="{ width: containerWidth + 'px', height: containerHeight + 'px' }"
    />
    <!-- #endif -->

    <view
      v-for="item in iconStates"
      :key="item.index"
      class="bezier-slider-mp__icon"
      :class="{ 'bezier-slider-mp__icon--hidden': !item.visible }"
      :style="getIconStyle(item)"
    >
      <image
        v-if="item.visible && item.imageSrc"
        class="bezier-slider-mp__icon-image"
        :src="item.imageSrc"
        mode="aspectFit"
      />
      <text
        v-else-if="item.visible"
        class="bezier-slider-mp__icon-text"
        :style="item.textStyle"
      >{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
import { BezierSliderEngine } from '../core/slider-engine.js';
import { pickNativeOptions } from '../mp/mp-bridge.js';
import { drawDefaultTrackOnCanvas } from '../mp/track-canvas.js';

const DEFAULT_ICONS = [
  { name: '首页', emoji: '🏠', color: '#8b5cf6' },
  { name: '搜索', emoji: '🔍', color: '#ec4899' },
  { name: '消息', emoji: '💬', color: '#06b6d4' },
  { name: '设置', emoji: '⚙️', color: '#22c55e' }
];

let canvasSeed = 0;

function getIconsSignature(icons) {
  if (!icons || !icons.length) return '';
  return icons
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        return `${item.name || ''}|${item.emoji || item.label || ''}|${item.color || ''}|${item.image || item.src || ''}`;
      }
      return String(item);
    })
    .join(';');
}

export default {
  name: 'BezierSlider',
  props: {
    icons: {
      type: Array,
      default: () => DEFAULT_ICONS
    },
    defaultIconCount: Number,
    tStep: Number,
    visibleIconCount: Number,
    centerT: Number,
    trackScale: Number,
    sensitivity: Number,
    snapDuration: Number,
    rubberBandLimit: Number,
    rubberBandDuration: Number,
    fadeEnabled: Boolean,
    centerGlowEnabled: Boolean,
    initialIndex: Number,
    bezier: Object,
    iconSize: Number,
    showTrack: {
      type: Boolean,
      default: true
    },
    rootClass: [String, Array, Object],
    rootStyle: [String, Object, Array]
  },
  data() {
    return {
      canvasId: `bezier-slider-canvas-${++canvasSeed}`,
      engine: null,
      iconStates: [],
      trackPaths: { linePath: '', fillPath: '', viewBox: '0 0 100 100' },
      containerWidth: 0,
      containerHeight: 0,
      layoutReady: false,
      iconsSignature: '',
      bezierSignature: ''
    };
  },
  computed: {
    containerStyle() {
      if (this.containerWidth && this.containerHeight) {
        return {
          width: this.containerWidth + 'px',
          height: this.containerHeight + 'px'
        };
      }
      return {};
    }
  },
  watch: {
    icons: {
      deep: true,
      handler(value) {
        const signature = getIconsSignature(value);
        if (signature === this.iconsSignature) return;
        this.iconsSignature = signature;
        this.rebuildEngine(true);
        if (this.containerWidth && this.containerHeight) {
          this.refreshView();
        } else {
          this.measureAndLayout();
        }
      }
    },
    initialIndex(value) {
      const engine = this.engine;
      if (!engine) return;
      if (
        engine.isDragging ||
        engine.isAnimating ||
        engine.isFollowingExternal ||
        engine.isUserGesture
      ) {
        return;
      }
      if (engine.currentIndex === value) return;
      const targetOffset = engine.getOffsetForIndex(value);
      if (Math.abs(engine.currentOffset - targetOffset) < 0.02) {
        engine.currentIndex = value;
        return;
      }
      this.slideTo(value, false);
    },
    bezier: {
      deep: true,
      handler(value) {
        const signature = JSON.stringify(value || {});
        if (signature === this.bezierSignature) return;
        this.bezierSignature = signature;
        this.rebuildEngine(true);
        if (this.engine && this.engine.containerWidth) {
          this.refreshView();
        }
      }
    }
  },
  mounted() {
    this.iconsSignature = getIconsSignature(this.icons);
    this.bezierSignature = JSON.stringify(this.bezier || {});
    this.rebuildEngine(false);
    this.measureAndLayout();
  },
  beforeDestroy() {
    this.engine?.destroy();
    this.engine = null;
  },
  methods: {
    rebuildEngine(keepOffset) {
      const prevEngine = this.engine;
      const prevWidth = (prevEngine && prevEngine.containerWidth) || this.containerWidth;
      const prevHeight = (prevEngine && prevEngine.containerHeight) || this.containerHeight;
      const offset = keepOffset && prevEngine ? prevEngine.currentOffset : undefined;
      const index = keepOffset && prevEngine ? prevEngine.currentIndex : this.initialIndex;

      prevEngine?.destroy();

      this.engine = new BezierSliderEngine({
        ...pickNativeOptions(this.$props),
        icons: this.icons,
        initialIndex: index,
        onSelect: (icon, selectedIndex) => this.$emit('select', icon, selectedIndex),
        onSlideEnd: (selectedIndex) => this.$emit('slide-end', selectedIndex),
        onDragStart: () => this.$emit('drag-start'),
        onDragMove: (payload) => this.$emit('drag-move', payload),
        onFrame: () => this.refreshView()
      });

      if (prevWidth && prevHeight) {
        this.engine.setSize(prevWidth, prevHeight, (this.iconSize || 50) / 2);
      }
      if (offset !== undefined) {
        this.engine.currentOffset = offset;
        this.engine.currentIndex = this.engine.getIndexFromOffset(offset);
      }
    },
    measureAndLayout(retryCount = 0) {
      this.$nextTick(() => {
        const query = this.createSelectorQuery();
        query
          .select('.bezier-slider-mp')
          .boundingClientRect((rect) => {
            if (!rect || !rect.width || !rect.height) {
              if (retryCount < 20) {
                setTimeout(() => this.measureAndLayout(retryCount + 1), 50);
                return;
              }
              this.applyFallbackLayout();
              return;
            }
            this.containerWidth = rect.width;
            this.containerHeight = rect.height;
            if (this.engine) {
              this.engine.setSize(rect.width, rect.height, (this.iconSize || 50) / 2);
            }
            this.layoutReady = true;
            this.refreshView();
          })
          .exec();
      });
    },
    applyFallbackLayout() {
      const sys = typeof uni !== 'undefined' && uni.getSystemInfoSync
        ? uni.getSystemInfoSync()
        : { windowWidth: 375 };
      const width = (686 / 750) * (sys.windowWidth || 375);
      const height = 120;
      this.containerWidth = width;
      this.containerHeight = height;
      if (this.engine) {
        this.engine.setSize(width, height, (this.iconSize || 50) / 2);
      }
      this.layoutReady = true;
      this.refreshView();
    },
    createSelectorQuery() {
      if (typeof uni !== 'undefined' && uni.createSelectorQuery) {
        return uni.createSelectorQuery().in(this);
      }
      return {
        select() {
          return {
            boundingClientRect(cb) {
              cb(null);
              return { exec: () => {} };
            }
          };
        }
      };
    },
    refreshView() {
      if (!this.engine || !this.engine.containerWidth) return;
      const { states } = this.engine.computeIconStates(this.engine.currentOffset);
      this.iconStates = states;
      this.trackPaths = this.engine.getTrackPaths();
      // #ifdef MP
      if (this.showTrack) {
        this.drawTrackCanvas();
      }
      // #endif
      // #ifndef H5 || MP
      if (this.showTrack) {
        this.drawTrackCanvas();
      }
      // #endif
    },
    drawTrackCanvas() {
      if (!this.layoutReady || !this.engine) return;
      drawDefaultTrackOnCanvas(this, this.canvasId, this.engine.getLayoutState());
    },
    getIconStyle(item) {
      if (!item.visible) {
        return {
          opacity: 0,
          visibility: 'hidden',
          pointerEvents: 'none'
        };
      }
      const iconSize = this.iconSize || 50;
      return {
        left: item.x + 'px',
        top: item.y + 'px',
        width: iconSize + 'px',
        height: iconSize + 'px',
        opacity: item.opacity,
        zIndex: item.zIndex,
        background: item.background,
        boxShadow: item.boxShadow,
        transform: `scale(${item.scale})`
      };
    },
    touchClientX(event) {
      const touch = event.touches && event.touches[0];
      return touch?.clientX ?? touch?.pageX ?? 0;
    },
    onTouchStart(event) {
      if (!this.engine) return;
      this.engine.touchStart(this.touchClientX(event));
    },
    onTouchMove(event) {
      if (!this.engine || !this.engine.isDragging) return;
      this.engine.touchMove(this.touchClientX(event));
    },
    onTouchEnd() {
      if (!this.engine) return;
      this.engine.handleTouchEnd();
    },
    slideTo(index, animate = true) {
      this.engine?.slideTo(index, animate);
    },
    followSwiper(payload) {
      this.engine?.followSwiper(payload);
    },
    endExternalFollow(index) {
      this.engine?.endExternalFollow(index);
    },
    animateToIndex(index, duration, onComplete) {
      this.engine?.animateToIndex(index, duration, onComplete);
    },
    followIndexFloat(indexFloat) {
      this.engine?.followIndexFloat(indexFloat);
    },
    getCurrentIndex() {
      return this.engine ? this.engine.getCurrentIndex() : 0;
    },
    getLayoutState() {
      return this.engine?.getLayoutState();
    },
    getInstance() {
      return this.engine;
    }
  }
};
</script>

<style scoped>
.bezier-slider-mp {
  position: relative;
  overflow: visible;
  touch-action: none;
}

.bezier-slider-mp__track,
.bezier-slider-mp__track-canvas {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bezier-slider-mp__track-fill {
  fill: rgba(255, 180, 120, 0.18);
}

.bezier-slider-mp__track-glow {
  fill: none;
  stroke: url(#bezierSliderGlow);
  stroke-width: 3;
  stroke-linecap: round;
}

.bezier-slider-mp__track-line {
  fill: none;
  stroke: rgba(255, 220, 150, 0.45);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.bezier-slider-mp__icon {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  will-change: transform, opacity;
}

.bezier-slider-mp__icon--hidden {
  opacity: 0 !important;
  visibility: hidden;
  pointer-events: none;
}

.bezier-slider-mp__icon-text {
  font-size: 22px;
  line-height: 1;
  color: #fff;
}

.bezier-slider-mp__icon-image {
  width: 62%;
  height: 62%;
  border-radius: 4px;
}
</style>
