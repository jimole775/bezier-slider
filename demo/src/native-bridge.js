import { BezierSlider as NativeBezierSlider } from './index.js';

const NATIVE_OPTION_KEYS = [
    'icons',
    'defaultIconCount',
    'tStep',
    'visibleIconCount',
    'centerT',
    'trackScale',
    'sensitivity',
    'snapDuration',
    'rubberBandLimit',
    'rubberBandDuration',
    'fadeEnabled',
    'centerGlowEnabled',
    'bezier',
    'initialIndex'
];

/** 从 props / options 提取 native 配置（跳过 undefined） */
export function pickNativeOptions(source) {
    const result = {};
    for (const key of NATIVE_OPTION_KEYS) {
        const value = source[key];
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

export function getConfigKey(source) {
    return JSON.stringify(pickNativeOptions(source));
}

/**
 * 创建 native 实例，回调由 hooks 注入（便于框架封装读取最新 props / emit）
 */
export function createNativeSlider(container, source, hooks = {}) {
    const { onSelect, onSlideEnd, onLayout, renderTrack } = hooks;

    return new NativeBezierSlider({
        container,
        ...pickNativeOptions(source),
        onSelect,
        onSlideEnd,
        onLayout: (layout) => {
            if (typeof renderTrack === 'function') {
                renderTrack(container, layout);
            }
            onLayout?.(layout);
        }
    });
}

/** 等容器有尺寸后再 mount，返回 cancel 函数 */
export function mountNativeSliderWhenReady(container, source, hooks) {
    let slider = null;
    let rafId = 0;
    let cancelled = false;

    const mount = () => {
        if (cancelled) return;

        if (container.clientWidth === 0 || container.clientHeight === 0) {
            rafId = requestAnimationFrame(mount);
            return;
        }

        slider = createNativeSlider(container, source, hooks);
    };

    mount();

    return {
        getInstance() {
            return slider;
        },
        destroy() {
            cancelled = true;
            cancelAnimationFrame(rafId);
            slider?.destroy();
            slider = null;
        }
    };
}
