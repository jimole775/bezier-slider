import { getTrackViewBox } from '../../src/track-renderer.js';

const TRACK_BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none">
    <defs>
        <linearGradient id="trackFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#450a0a"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(252,211,77,0.55)"/>
            <stop offset="100%" stop-color="rgba(252,211,77,0)"/>
        </radialGradient>
    </defs>
    <path d="M 31 134 Q 236 304 451 20 L 451 280 L 31 280 Z" fill="url(#trackFill)" opacity="0.7"/>
    <path d="M 31 134 Q 236 304 451 20" fill="none" stroke="rgba(252,211,77,0.5)" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="330" cy="143" rx="30" ry="30" fill="url(#centerGlow)"/>
</svg>`;

export const TRACK_BG_URL = `url("data:image/svg+xml,${encodeURIComponent(TRACK_BG_SVG)}")`;

export const DEFAULT_BG_NATURAL = { width: 480, height: 300 };

export function resolveBgTrackUrl(customUrl) {
    if (!customUrl) return TRACK_BG_URL;
    return customUrl.startsWith('url(') ? customUrl : `url("${customUrl}")`;
}

export function clampTrackScale(trackScale) {
    return Math.max(0.5, Math.min(2, Number(trackScale) || 1));
}

export function clearTrackArtifacts(trackLayer) {
    trackLayer.querySelectorAll(
        '.abs-track-svg, .debug-track'
    ).forEach((el) => el.remove());
}

export function clearBgLayer(bgLayer) {
    bgLayer.classList.remove('is-visible');
    bgLayer.style.backgroundImage = '';
}

export function applyBgLayer(bgLayer, bgUrl = null) {
    bgLayer.classList.add('is-visible');
    bgLayer.style.backgroundImage = resolveBgTrackUrl(bgUrl);
    bgLayer.style.backgroundRepeat = 'no-repeat';
    bgLayer.style.backgroundPosition = 'center center';
    bgLayer.style.backgroundSize = '100% 100%';
}

export function updateDebugTrack(trackLayer, layout, visible, BezierSliderClass) {
    let svg = trackLayer.querySelector('.debug-track');
    if (!visible) {
        svg?.remove();
        return;
    }
    if (!svg) {
        trackLayer.insertAdjacentHTML(
            'afterbegin',
            '<svg class="debug-track" preserveAspectRatio="none"><path fill="none" stroke="lime" stroke-width="2" stroke-dasharray="6 4" opacity="0.85"/></svg>'
        );
        svg = trackLayer.querySelector('.debug-track');
    }
    svg.setAttribute('viewBox', getTrackViewBox(layout));
    svg.querySelector('path').setAttribute('d', BezierSliderClass.bezierPath(layout.bezier));
}

export function readImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('请选择图片文件'));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error('读取图片失败'));
        reader.readAsDataURL(file);
    });
}

export function loadImageNaturalSize(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth || DEFAULT_BG_NATURAL.width,
                height: img.naturalHeight || DEFAULT_BG_NATURAL.height
            });
        };
        img.onerror = () => reject(new Error('无法读取图片尺寸'));
        img.src = src;
    });
}
