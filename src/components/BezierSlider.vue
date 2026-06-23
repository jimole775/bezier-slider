<template>
    <div
        v-memo="[configKey]"
        ref="mountRef"
        class="bezier-slider-root"
        :class="rootClass"
        :style="rootStyle"
    />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { getConfigKey, mountNativeSliderWhenReady } from '../native-bridge.js';
import { renderDefaultTrack } from '../track-renderer.js';

const props = defineProps({
    icons: {
        type: Array,
        default: () => [
            { name: '首页', emoji: '🏠', color: '#8b5cf6' },
            { name: '搜索', emoji: '🔍', color: '#ec4899' },
            { name: '消息', emoji: '💬', color: '#06b6d4' },
            { name: '设置', emoji: '⚙️', color: '#22c55e' }
        ]
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
    /** 绘制滑轨；默认 renderDefaultTrack，传 null 关闭 */
    renderTrack: {
        type: Function,
        default: undefined
    },
    rootClass: [String, Array, Object],
    rootStyle: [String, Object, Array]
});

const emit = defineEmits(['select', 'slideEnd', 'dragStart', 'dragMove']);

const mountRef = ref(null);
const controller = shallowRef(null);
const configKey = computed(() => getConfigKey(props));

function resolveRenderTrack() {
    if (props.renderTrack === null) {
        return null;
    }
    return props.renderTrack ?? renderDefaultTrack;
}

function destroySlider() {
    controller.value?.destroy();
    controller.value = null;
}

function mountSlider() {
    const container = mountRef.value;
    if (!container) return;

    destroySlider();

    controller.value = mountNativeSliderWhenReady(container, props, {
        onSelect: (icon, index) => emit('select', icon, index),
        onSlideEnd: (index) => emit('slideEnd', index),
        onDragStart: () => emit('dragStart'),
        onDragMove: (payload) => emit('dragMove', payload),
        onLayout: null,
        renderTrack: resolveRenderTrack()
    });
}

onMounted(mountSlider);

watch(configKey, async () => {
    await nextTick();
    mountSlider();
});

onBeforeUnmount(destroySlider);

function slideTo(index, animate = true) {
    controller.value?.getInstance()?.slideTo(index, animate);
}

function followSwiper(payload) {
    controller.value?.getInstance()?.followSwiper(payload);
}

function endExternalFollow(index) {
    controller.value?.getInstance()?.endExternalFollow(index);
}

function animateToIndex(index, duration, onComplete) {
    controller.value?.getInstance()?.animateToIndex(index, duration, onComplete);
}

function followIndexFloat(indexFloat) {
    controller.value?.getInstance()?.followIndexFloat(indexFloat);
}

function getCurrentIndex() {
    return controller.value?.getInstance()?.getCurrentIndex() ?? 0;
}

function getLayoutState() {
    return controller.value?.getInstance()?.getLayoutState();
}

function getInstance() {
    return controller.value?.getInstance() ?? null;
}

defineExpose({
    slideTo,
    followSwiper,
    endExternalFollow,
    animateToIndex,
    followIndexFloat,
    getCurrentIndex,
    getLayoutState,
    getInstance
});
</script>

<style scoped>
/* 尺寸由 rootClass / rootStyle（如 .carousel-container）决定，勿写 width:100% 以免覆盖 */
.bezier-slider-root {
    position: relative;
    overflow: hidden;
}
</style>
