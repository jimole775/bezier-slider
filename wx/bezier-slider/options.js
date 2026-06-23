'use strict';

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

function pickNativeOptions(source) {
    const result = {};
    for (const key of NATIVE_OPTION_KEYS) {
        const value = source[key];
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

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

module.exports = {
    pickNativeOptions,
    getIconsSignature
};
