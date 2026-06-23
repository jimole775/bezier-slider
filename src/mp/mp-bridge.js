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
    'initialIndex',
    'iconSize'
];

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
