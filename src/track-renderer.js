/**
 * 可选的默认滑轨渲染工具，供调用方在 onLayout 中使用。
 * 核心 BezierSlider 不包含任何滑轨 DOM 绘制逻辑。
 */

/** 生成 SVG 二次贝塞尔 path 字符串 */
function bezierPath(curve, fillToY) {
    const { p0, p1, p2 } = curve;
    const parts = [
        `M ${p0.x} ${p0.y}`,
        `Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`
    ];
    if (fillToY != null) {
        parts.push(`L ${p2.x} ${fillToY}`, `L ${p0.x} ${fillToY}`, 'Z');
    }
    return parts.join(' ');
}

/**
 * 根据布局状态更新已有滑轨 DOM 的 path / viewBox
 * @param {HTMLElement} container 滑块容器
 * @param {object} layout BezierSlider.getLayoutState() 返回值
 * @param {object} [selectors] 自定义选择器
 */
/** 根据 trackBounds 计算 SVG viewBox，避免 trackScale>1 时路径被裁切 */
export function getTrackViewBox(layout) {
    const { width, height, trackBounds } = layout;
    if (!trackBounds) {
        return `0 0 ${width} ${height}`;
    }

    const minX = Math.min(0, trackBounds.left);
    const maxX = Math.max(width, trackBounds.left + trackBounds.width);
    return `${minX} 0 ${maxX - minX} ${height}`;
}

export function updateDefaultTrack(container, layout, selectors = {}) {
    const {
        svg = '.abs-track-svg',
        trackFill = '.abs-track-fill',
        trackGlow = '.abs-track-glow',
        trackLine = '.abs-track-line'
    } = selectors;

    const { bezier, width, height, fillBottom } = layout;

    const svgEl = container.querySelector(svg);
    if (svgEl) {
        svgEl.setAttribute('viewBox', getTrackViewBox(layout));
    }

    const pathD = bezierPath(bezier);
    const fillPath = bezierPath(bezier, fillBottom);

    const fillEl = container.querySelector(trackFill);
    const glowEl = container.querySelector(trackGlow);
    const lineEl = container.querySelector(trackLine);

    if (fillEl) fillEl.setAttribute('d', fillPath);
    if (glowEl) glowEl.setAttribute('d', pathD);
    if (lineEl) lineEl.setAttribute('d', pathD);
}

/**
 * 向容器插入默认滑轨 SVG（仅当不存在时）
 * @param {HTMLElement} container
 * @param {object} [options]
 * @returns {boolean} 是否新创建了 DOM
 */
export function ensureDefaultTrackDom(container, options = {}) {
    const {
        svgClass = 'abs-track-svg track-svg',
        fillClass = 'abs-track-fill track-fill',
        glowClass = 'abs-track-glow track-glow',
        lineClass = 'abs-track-line track-line',
        fillGradientId = 'absTrackRedGradient',
        glowGradientId = 'absTrackGlowGradient'
    } = options;

    if (container.querySelector('.abs-track-svg')) {
        return false;
    }

    container.insertAdjacentHTML('afterbegin', `
        <svg class="${svgClass}" preserveAspectRatio="none">
            <defs>
                <linearGradient id="${glowGradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(255, 220, 150, 0.3)" />
                    <stop offset="50%" stop-color="rgba(255, 230, 180, 0.9)" />
                    <stop offset="100%" stop-color="rgba(255, 200, 100, 0.5)" />
                </linearGradient>
            </defs>
            <path class="${fillClass}" fill="url(#${fillGradientId})"></path>
            <path class="${glowClass}" stroke="url(#${glowGradientId})"></path>
            <path class="${lineClass}"></path>
        </svg>
    `);

    return true;
}

/**
 * 确保 DOM 存在并绘制默认滑轨
 */
export function renderDefaultTrack(container, layout, options = {}) {
    ensureDefaultTrackDom(container, options);
    updateDefaultTrack(container, layout, options.selectors);
}
