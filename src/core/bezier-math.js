import { DEFAULTS } from './defaults.js';

export function mergeBezierConfig(bezier) {
    const base = DEFAULTS.bezier;
    return {
        fitted: { ...base.fitted, ...(bezier?.fitted || {}) },
        curveSmooth: bezier?.curveSmooth ?? base.curveSmooth,
        rightTilt: bezier?.rightTilt ?? base.rightTilt,
        rightEndOffset: bezier?.rightEndOffset ?? base.rightEndOffset,
        localBend: { ...base.localBend, ...(bezier?.localBend || {}) },
        leftEndBend: { ...base.leftEndBend, ...(bezier?.leftEndBend || {}) }
    };
}

function smoothBezier(bezier, smooth) {
    const mid = {
        x: (bezier.p0.x + bezier.p2.x) / 2,
        y: (bezier.p0.y + bezier.p2.y) / 2
    };
    return {
        p0: bezier.p0,
        p1: {
            x: bezier.p1.x + (mid.x - bezier.p1.x) * smooth,
            y: bezier.p1.y + (mid.y - bezier.p1.y) * smooth
        },
        p2: bezier.p2
    };
}

function easeRightTilt(bezier, tilt, rightEndOffset) {
    if (!tilt) {
        return {
            p0: { ...bezier.p0 },
            p1: { ...bezier.p1 },
            p2: { ...bezier.p2 }
        };
    }
    return {
        p0: { ...bezier.p0 },
        p1: { ...bezier.p1 },
        p2: {
            x: bezier.p2.x,
            y: bezier.p2.y - rightEndOffset * tilt
        }
    };
}

function applyQuadraticBend(bezier, { t, degrees }) {
    const sag = Math.tan(degrees * Math.PI / 180) * 0.1;
    const influence = 1 - Math.min(Math.abs(t - 0.5) / 0.5, 1);
    return {
        p0: bezier.p0,
        p1: {
            x: bezier.p1.x,
            y: bezier.p1.y + sag * (0.6 + influence * 0.4)
        },
        p2: bezier.p2
    };
}

function applyLeftEndBend(bezier, degrees) {
    const sag = Math.tan(degrees * Math.PI / 180) * 0.1;
    return {
        p0: { x: bezier.p0.x, y: bezier.p0.y + sag },
        p1: { x: bezier.p1.x, y: bezier.p1.y + sag * 0.5 },
        p2: bezier.p2
    };
}

export function buildBezierNorm(bezierConfig) {
    const cfg = mergeBezierConfig(bezierConfig);
    const fitted = {
        p0: { ...cfg.fitted.p0 },
        p1: { ...cfg.fitted.p1 },
        p2: { ...cfg.fitted.p2 }
    };
    return applyLeftEndBend(
        applyQuadraticBend(
            easeRightTilt(
                smoothBezier(fitted, cfg.curveSmooth),
                cfg.rightTilt,
                cfg.rightEndOffset
            ),
            cfg.localBend
        ),
        cfg.leftEndBend.degrees
    );
}

export function bezierPathFromCurve(curve, fillToY) {
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

export function pointOnBezierCurve(t, curve) {
    const u = 1 - t;
    return {
        x: u * u * curve.p0.x + 2 * u * t * curve.p1.x + t * t * curve.p2.x,
        y: u * u * curve.p0.y + 2 * u * t * curve.p1.y + t * t * curve.p2.y
    };
}

export function mapToPixels(point, bounds) {
    return {
        x: bounds.left + point.x * bounds.width,
        y: bounds.top + point.y * bounds.height
    };
}
