import { clampTrackScale } from './track-helpers.js';

export const DEFAULT_SVG_SIZE = { width: 480, height: 300 };

export const DEFAULT_BG_NATURAL = { width: 480, height: 300 };

const MAX_DISPLAY_WIDTH = 480;
const MAX_DISPLAY_HEIGHT = 360;

/** 按图片原始比例 1:1 换算展示尺寸（等比缩放，不拉伸） */
export function fitImageDisplaySize(naturalWidth, naturalHeight) {
    const nw = naturalWidth || DEFAULT_BG_NATURAL.width;
    const nh = naturalHeight || DEFAULT_BG_NATURAL.height;
    const maxW = Math.min(window.innerWidth - 32, MAX_DISPLAY_WIDTH);
    const maxH = Math.min(window.innerWidth * 0.75, MAX_DISPLAY_HEIGHT);
    const scale = Math.min(maxW / nw, maxH / nh);
    return {
        width: Math.round(nw * scale),
        height: Math.round(nh * scale),
        naturalWidth: nw,
        naturalHeight: nh
    };
}

export function fitDefaultSvgSize() {
    return fitImageDisplaySize(DEFAULT_SVG_SIZE.width, DEFAULT_SVG_SIZE.height);
}

/** 滑轨层尺寸：基准显示宽 × trackScale */
export function computeTrackLayerSize(baseDisplay, trackScale) {
    const scale = clampTrackScale(trackScale);
    const maxW = window.innerWidth - 32;
    const trackW = Math.min(Math.round(baseDisplay.width * scale), maxW);
    return {
        width: trackW,
        height: baseDisplay.height
    };
}

/**
 * 背景层固定 1:1 基准尺寸并居中；滑轨层随 trackScale 变宽/变窄，与背景中心对齐
 */
export function applyComposeLayout(compose, bgLayer, trackLayer, baseDisplay, trackScale = 1) {
    const trackSize = computeTrackLayerSize(baseDisplay, trackScale);
    const composeWidth = Math.max(baseDisplay.width, trackSize.width);
    const composeHeight = baseDisplay.height;
    const bgLeft = (composeWidth - baseDisplay.width) / 2;
    const trackLeft = (composeWidth - trackSize.width) / 2;

    compose.style.width = `${composeWidth}px`;
    compose.style.height = `${composeHeight}px`;

    bgLayer.style.width = `${baseDisplay.width}px`;
    bgLayer.style.height = `${baseDisplay.height}px`;
    bgLayer.style.left = `${bgLeft}px`;
    bgLayer.style.top = '0';

    trackLayer.style.width = `${trackSize.width}px`;
    trackLayer.style.height = `${trackSize.height}px`;
    trackLayer.style.left = `${trackLeft}px`;
    trackLayer.style.top = '0';

    return { composeWidth, composeHeight, trackSize, baseDisplay };
}

export function getDisplaySizeHint(baseDisplay, trackScale = 1) {
    const trackSize = computeTrackLayerSize(baseDisplay, trackScale);
    return {
        width: baseDisplay.width,
        height: baseDisplay.height,
        naturalWidth: baseDisplay.naturalWidth,
        naturalHeight: baseDisplay.naturalHeight,
        trackWidth: trackSize.width,
        trackHeight: trackSize.height,
        trackScale: clampTrackScale(trackScale)
    };
}
