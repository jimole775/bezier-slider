/** 去掉 undefined 字段，避免覆盖默认值 */
export function omitUndefined(obj) {
    const result = {};
    for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
    }
    return result;
}

/** 将十六进制颜色按百分比加深 */
export function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function createFrameScheduler() {
    const requestFrame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame.bind(globalThis)
        : (cb) => setTimeout(() => cb(Date.now()), 16);
    const cancelFrame = typeof cancelAnimationFrame === 'function'
        ? cancelAnimationFrame.bind(globalThis)
        : clearTimeout;
    const now = typeof performance !== 'undefined' && performance.now
        ? () => performance.now()
        : () => Date.now();
    return { requestFrame, cancelFrame, now };
}
