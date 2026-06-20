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

const CONTROL_POINT_META = {
    p0: { label: 'P0', color: '#38bdf8', influence: [0, 0.45], hint: '左端起点' },
    p1: { label: 'P1', color: '#fb923c', influence: [0.15, 0.85], hint: '中间弧度' },
    p2: { label: 'P2', color: '#c084fc', influence: [0.55, 1], hint: '右端终点' }
};

export function parseControlPointPath(path) {
    const match = String(path).match(/^bezier\.fitted\.(p[012])\.([xy])$/);
    if (!match) return null;
    return { point: match[1], axis: match[2] };
}

function sampleCurveSegment(curve, tStart, tEnd, pointOnCurve, steps = 20) {
    const parts = [];
    for (let i = 0; i <= steps; i++) {
        const t = tStart + (tEnd - tStart) * (i / steps);
        const { x, y } = pointOnCurve(t, curve);
        parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return parts.join(' ');
}

function setSvgContent(svg, layout, BezierSliderClass, activeControl) {
    const { bezier } = layout;
    if (!bezier) return;

    const pointOnCurve = BezierSliderClass.pointOnCurve;
    const curvePath = BezierSliderClass.bezierPath(bezier);
    const { p0, p1, p2 } = bezier;
    const activeKey = activeControl?.point ?? null;
    const activeMeta = activeKey ? CONTROL_POINT_META[activeKey] : null;

    let influencePath = '';
    if (activeMeta) {
        const [t0, t1] = activeMeta.influence;
        influencePath = `<path class="debug-influence" fill="none" stroke="${activeMeta.color}" stroke-width="5" stroke-linecap="round" opacity="0.55" d="${sampleCurveSegment(bezier, t0, t1, pointOnCurve)}"/>`;
    }

    let axisHint = '';
    if (activeControl && activeMeta) {
        const pt = bezier[activeControl.point];
        const len = Math.min(56, Math.max(36, layout.width * 0.1));
        const half = len / 2;
        const color = activeMeta.color;
        if (activeControl.axis === 'x') {
            axisHint = `
                <line class="debug-axis" x1="${pt.x - half}" y1="${pt.y}" x2="${pt.x + half}" y2="${pt.y}" stroke="${color}" stroke-width="2" marker-start="url(#debugArrow)" marker-end="url(#debugArrow)" opacity="0.95"/>
                <text class="debug-axis-label" x="${pt.x + half + 6}" y="${pt.y + 4}" fill="${color}">X →</text>`;
        } else {
            axisHint = `
                <line class="debug-axis" x1="${pt.x}" y1="${pt.y - half}" x2="${pt.x}" y2="${pt.y + half}" stroke="${color}" stroke-width="2" marker-start="url(#debugArrow)" marker-end="url(#debugArrow)" opacity="0.95"/>
                <text class="debug-axis-label" x="${pt.x + 6}" y="${pt.y + half + 14}" fill="${color}">Y ↓</text>`;
        }
    }

    const controlPoints = ['p0', 'p1', 'p2'].map((key) => {
        const pt = bezier[key];
        const meta = CONTROL_POINT_META[key];
        const isActive = key === activeKey;
        const r = isActive ? 7 : 5;
        const opacity = isActive ? 1 : 0.55;
        const stroke = isActive ? '#fff' : meta.color;
        const fill = isActive ? meta.color : 'rgba(0,0,0,0.35)';
        const pulse = isActive
            ? `<circle cx="${pt.x}" cy="${pt.y}" r="14" fill="none" stroke="${meta.color}" stroke-width="2" opacity="0.45" class="debug-point-pulse"/>`
            : '';
        const hint = isActive
            ? `<text class="debug-point-hint" x="${pt.x}" y="${pt.y - 16}" fill="${meta.color}" text-anchor="middle">${meta.hint} · 调${activeControl.axis.toUpperCase()}</text>`
            : '';
        return `${pulse}
            <circle class="debug-point" data-point="${key}" cx="${pt.x}" cy="${pt.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="${opacity}"/>
            <text class="debug-point-label" x="${pt.x}" y="${pt.y + 4}" fill="${isActive ? '#fff' : meta.color}" text-anchor="middle" font-size="10" font-weight="600">${meta.label}</text>
            ${hint}`;
    }).join('');

    svg.innerHTML = `
        <defs>
            <marker id="debugArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
            </marker>
        </defs>
        ${influencePath}
        <path class="debug-curve" fill="none" stroke="lime" stroke-width="2" stroke-dasharray="6 4" opacity="0.85" d="${curvePath}"/>
        <line class="debug-polygon" x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="4 3"/>
        <line class="debug-polygon" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="4 3"/>
        <g class="debug-axis-hints" color="${activeMeta?.color ?? '#fff'}">${axisHint}</g>
        <g class="debug-control-points">${controlPoints}</g>`;
}

export function updateDebugTrack(trackLayer, layout, visible, BezierSliderClass, activeControl = null) {
    let svg = trackLayer.querySelector('.debug-track');
    if (!visible) {
        svg?.remove();
        return;
    }
    if (!svg) {
        trackLayer.insertAdjacentHTML('afterbegin', '<svg class="debug-track" preserveAspectRatio="none"></svg>');
        svg = trackLayer.querySelector('.debug-track');
    }
    svg.setAttribute('viewBox', getTrackViewBox(layout));
    setSvgContent(svg, layout, BezierSliderClass, activeControl);
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
