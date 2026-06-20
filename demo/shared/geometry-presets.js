/** 几何轨迹预设：一键覆盖 bezier 相关参数 */
export const GEOMETRY_PRESETS = [
    {
        id: 'semicircle',
        label: '半圆',
        bezier: {
            fitted: {
                p0: { x: 0.02, y: 0.16 },
                p1: { x: 0.5, y: 1.08 },
                p2: { x: 0.98, y: 0.16 }
            },
            curveSmooth: 0,
            rightTilt: 0,
            rightEndOffset: 0,
            localBend: { t: 0.5, degrees: 0 },
            leftEndBend: { degrees: 0 }
        }
    },
    {
        id: 'semicircle-up',
        label: '上拱半圆',
        bezier: {
            fitted: {
                p0: { x: 0.02, y: 0.84 },
                p1: { x: 0.5, y: -0.08 },
                p2: { x: 0.98, y: 0.84 }
            },
            curveSmooth: 0,
            rightTilt: 0,
            rightEndOffset: 0,
            localBend: { t: 0.5, degrees: 0 },
            leftEndBend: { degrees: 0 }
        }
    },
    {
        id: 'angle-45',
        label: '45° 斜角',
        bezier: {
            fitted: {
                p0: { x: 0.02, y: 0.94 },
                p1: { x: 0.5, y: 0.5 },
                p2: { x: 0.98, y: 0.06 }
            },
            curveSmooth: 1,
            rightTilt: 0,
            rightEndOffset: 0,
            localBend: { t: 0.5, degrees: 0 },
            leftEndBend: { degrees: 0 }
        }
    },
    {
        id: 'straight',
        label: '平直',
        bezier: {
            fitted: {
                p0: { x: 0.02, y: 0.5 },
                p1: { x: 0.5, y: 0.5 },
                p2: { x: 0.98, y: 0.5 }
            },
            curveSmooth: 1,
            rightTilt: 0,
            rightEndOffset: 0,
            localBend: { t: 0.5, degrees: 0 },
            leftEndBend: { degrees: 0 }
        }
    },
    {
        id: 'quarter-circle',
        label: '1/4 圆',
        bezier: {
            fitted: {
                p0: { x: 0.02, y: 0.92 },
                p1: { x: 0.92, y: 0.92 },
                p2: { x: 0.92, y: 0.08 }
            },
            curveSmooth: 0,
            rightTilt: 0,
            rightEndOffset: 0,
            localBend: { t: 0.5, degrees: 0 },
            leftEndBend: { degrees: 0 }
        }
    },
    {
        id: 'default-arc',
        label: '默认弧',
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
        }
    }
];
