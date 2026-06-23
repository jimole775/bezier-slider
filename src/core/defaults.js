export const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#3b82f6'];

export const DEFAULTS = {
    icons: null,
    defaultIconCount: 4,
    tStep: 0.33,
    visibleIconCount: 2,
    centerT: 0.72,
    sensitivity: 0.004,
    snapDuration: 300,
    rubberBandLimit: 0.42,
    rubberBandDuration: 420,
    fadeEnabled: false,
    centerGlowEnabled: true,
    trackScale: 1,
    iconSize: 50,
    bezier: {
        fitted: {
            p0: { x: 0.015, y: 0.48 },
            p1: { x: 0.48, y: 0.48 },
            p2: { x: 0.985, y: 0.48 }
        },
        curveSmooth: 0.1,
        rightTilt: 1,
        rightEndOffset: 0.11,
        localBend: { t: 0.36, degrees: 38 },
        leftEndBend: { degrees: 10 }
    },
    initialIndex: 0
};
