import { DEFAULTS } from './defaults.js';
import {
    bezierPathFromCurve,
    buildBezierNorm,
    mapToPixels,
    mergeBezierConfig,
    pointOnBezierCurve
} from './bezier-math.js';
import { iconBackground, normalizeIcons } from './icons.js';
import {
    createFrameScheduler,
    easeOutBack,
    easeOutCubic,
    omitUndefined
} from './utils.js';

/**
 * 无 DOM 的滑块核心：布局、拖动、吸附、回弹、图标状态计算
 * 供 H5 native 与小程序 Vue 组件共用
 */
export class BezierSliderEngine {
    static DEFAULTS = DEFAULTS;

    constructor(options = {}, scheduler = createFrameScheduler()) {
        const normalizedOptions = omitUndefined(options);
        this.options = { ...DEFAULTS, ...normalizedOptions };
        this.options.bezier = mergeBezierConfig(normalizedOptions.bezier);

        this.icons = normalizeIcons(options.icons, this.options.defaultIconCount);
        this.totalIcons = this.icons.length;
        this.maxOffset = (this.totalIcons - 1) / 2;
        this.centerT = options.centerT ?? DEFAULTS.centerT;
        this.tStep = options.tStep ?? DEFAULTS.tStep;
        this.visibleIconCount = options.visibleIconCount ?? DEFAULTS.visibleIconCount;
        this.startT = this.centerT - this.maxOffset * this.tStep;
        this.bezierNorm = buildBezierNorm(this.options.bezier);

        this.containerWidth = 0;
        this.containerHeight = 0;
        this.iconHalf = (this.options.iconSize ?? DEFAULTS.iconSize) / 2;
        this.dragArea = null;
        this.trackBounds = null;
        this.bezier = null;

        const initialIndex = this._clampIndex(
            options.initialIndex ?? this.options.initialIndex ?? DEFAULTS.initialIndex
        );
        this.currentIndex = initialIndex;
        this.currentOffset = this.getOffsetForIndex(initialIndex);

        this.isDragging = false;
        this.isAnimating = false;
        this.isFollowingExternal = false;
        this.isUserGesture = false;
        this.startX = 0;
        this.startOffset = 0;
        this._animFrameId = null;

        this.onSelect = options.onSelect ?? null;
        this.onSlideEnd = options.onSlideEnd ?? null;
        this.onDragStart = options.onDragStart ?? null;
        this.onDragMove = options.onDragMove ?? null;
        this.onLayout = options.onLayout ?? null;
        this.onFrame = options.onFrame ?? null;

        this._requestFrame = scheduler.requestFrame;
        this._cancelFrame = scheduler.cancelFrame;
        this._now = scheduler.now;
    }

    _clampIndex(index) {
        const n = Math.round(Number(index));
        const safe = Number.isFinite(n) ? n : 0;
        return Math.max(0, Math.min(this.totalIcons - 1, safe));
    }

    clampIndex(index) {
        return this._clampIndex(index);
    }

    getOffsetForIndex(index) {
        return this.maxOffset - this._clampIndex(index);
    }

    getIndexFromOffset(offset = this.currentOffset) {
        const index = Math.round(this.maxOffset - offset);
        return Math.max(0, Math.min(this.totalIcons - 1, index));
    }

    getOffsetBounds() {
        return this._getOffsetBounds();
    }

    applyRubberBand(offset) {
        return this._applyRubberBand(offset);
    }

    isOutOfBounds(offset = this.currentOffset) {
        return this._isOutOfBounds(offset);
    }

    getDragPayload() {
        const offset = this.currentOffset;
        return {
            offset,
            indexFloat: this.maxOffset - offset,
            index: this.getIndexFromOffset(offset)
        };
    }

    _shouldEmitSelect() {
        return !this.isDragging && !this.isAnimating && !this.isFollowingExternal;
    }

    _emitDragMove() {
        if (this.isUserGesture) {
            this.onDragMove?.(this.getDragPayload());
        }
    }

    _getOffsetBounds() {
        return { min: -this.maxOffset, max: this.maxOffset };
    }

    _rubberBandDistance(excess, limit) {
        return limit * (1 - 1 / (excess / limit * 0.55 + 1));
    }

    _applyRubberBand(offset) {
        const { min, max } = this._getOffsetBounds();
        const limit = this.options.rubberBandLimit;

        if (offset >= min && offset <= max) {
            return offset;
        }
        if (offset < min) {
            return min - this._rubberBandDistance(min - offset, limit);
        }
        return max + this._rubberBandDistance(offset - max, limit);
    }

    _isOutOfBounds(offset = this.currentOffset) {
        const { min, max } = this._getOffsetBounds();
        return offset < min || offset > max;
    }

    _cancelAnimation() {
        if (this._animFrameId != null) {
            this._cancelFrame(this._animFrameId);
            this._animFrameId = null;
        }
        this.isAnimating = false;
    }

    _animateOffsetTo(targetOffset, duration, ease, onComplete) {
        this._cancelAnimation();
        this.isAnimating = true;
        const startOffsetAnim = this.currentOffset;
        const diff = targetOffset - startOffsetAnim;
        const startTime = this._now();

        if (Math.abs(diff) < 0.0001) {
            this.isAnimating = false;
            onComplete?.();
            return;
        }

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = ease(progress);

            this.currentOffset = startOffsetAnim + diff * eased;
            this.onFrame?.();
            this._emitDragMove();

            if (progress < 1) {
                this._animFrameId = this._requestFrame(animate);
            } else {
                this._animFrameId = null;
                this.isAnimating = false;
                this.currentOffset = targetOffset;
                this.onFrame?.();
                onComplete?.();
            }
        };

        this._animFrameId = this._requestFrame(animate);
    }

    measureDragArea(width, height, iconHalf = this.iconHalf) {
        this.containerWidth = width;
        this.containerHeight = height;
        this.iconHalf = iconHalf;

        this.dragArea = {
            left: iconHalf,
            top: iconHalf,
            width: width - iconHalf * 2,
            height: height - iconHalf * 2
        };

        const trackScale = this.options.trackScale;
        const trackMargin = (1 - trackScale) / 2;
        this.trackBounds = {
            left: width * trackMargin,
            top: height * 0.067,
            width: width * trackScale,
            height: height * 0.867
        };
    }

    rebuildBezierCurve() {
        if (!this.trackBounds) return;
        this.bezier = {
            p0: mapToPixels(this.bezierNorm.p0, this.trackBounds),
            p1: mapToPixels(this.bezierNorm.p1, this.trackBounds),
            p2: mapToPixels(this.bezierNorm.p2, this.trackBounds)
        };
    }

    bezierPoint(t, curve = this.bezier) {
        return pointOnBezierCurve(t, curve);
    }

    isIconVisibleInContainer(point) {
        const w = this.containerWidth;
        const h = this.containerHeight;
        const r = this.iconHalf;
        return (
            point.x + r >= 0 &&
            point.x - r <= w &&
            point.y + r >= 0 &&
            point.y - r <= h
        );
    }

    getLayoutState() {
        const width = this.containerWidth;
        const height = this.containerHeight;
        const fillBottom = this.trackBounds
            ? this.trackBounds.top + this.trackBounds.height + 10
            : 0;

        return {
            width,
            height,
            trackBounds: this.trackBounds,
            dragArea: this.dragArea,
            bezier: this.bezier,
            bezierNorm: this.bezierNorm,
            centerT: this.centerT,
            centerPoint: this.bezier ? this.bezierPoint(this.centerT) : null,
            fillBottom
        };
    }

    /**
     * 设置容器尺寸并刷新布局
     * @returns {object} layout
     */
    setSize(width, height, iconHalf) {
        if (width > 0 && height > 0) {
            this.measureDragArea(width, height, iconHalf ?? this.iconHalf);
            this.rebuildBezierCurve();
            const layout = this.getLayoutState();
            this.onLayout?.(layout);
            return layout;
        }
        return this.getLayoutState();
    }

    getTrackPaths() {
        if (!this.bezier) {
            return { linePath: '', fillPath: '', viewBox: '0 0 100 100' };
        }
        const layout = this.getLayoutState();
        const linePath = bezierPathFromCurve(this.bezier);
        const fillPath = bezierPathFromCurve(this.bezier, layout.fillBottom);
        const left = this.trackBounds ? Math.min(0, this.trackBounds.left) : 0;
        const right = this.trackBounds
            ? Math.max(this.containerWidth, this.trackBounds.left + this.trackBounds.width)
            : this.containerWidth;
        return {
            linePath,
            fillPath,
            viewBox: `${left} 0 ${right - left} ${this.containerHeight}`
        };
    }

    /**
     * 计算各图标展示状态（供模板绑定）
     * @returns {{ states: Array, selectedIndex: number }}
     */
    computeIconStates(offset = this.currentOffset) {
        if (!this.bezier || this.totalIcons === 0) {
            return { states: [], selectedIndex: this.currentIndex };
        }

        const iconSize = this.options.iconSize ?? DEFAULTS.iconSize;
        const states = [];
        let selectedIndex = this.currentIndex;

        const iconStates = this.icons.map((iconData, index) => {
            const t = this.startT + this.tStep * index + offset * this.tStep;
            return { iconData, index, t, dist: Math.abs(t - this.centerT) };
        });

        const visibleIndexes = new Set(
            iconStates
                .filter(({ t }) => this.isIconVisibleInContainer(this.bezierPoint(t)))
                .slice()
                .sort((a, b) => a.dist - b.dist)
                .slice(0, this.visibleIconCount)
                .map((state) => state.index)
        );

        const nearest = iconStates.slice().sort((a, b) => a.dist - b.dist)[0];
        if (nearest) {
            visibleIndexes.add(nearest.index);
        }

        iconStates.forEach(({ iconData, index, t }) => {
            const point = this.bezierPoint(t);
            const visible = visibleIndexes.has(index);
            const distanceFromCenter = Math.abs(t - this.centerT);
            const normalizedDistance = Math.min(distanceFromCenter / this.tStep, 1);

            if (!visible) {
                states.push({
                    index,
                    visible: false,
                    iconData,
                    name: iconData.name
                });
                return;
            }

            const scale = 0.35 + (1 - normalizedDistance) * 0.7;
            const opacity = this.options.fadeEnabled
                ? (0.35 + (1 - normalizedDistance) * 0.65)
                : 1;
            const zIndex = Math.floor(scale * 20);
            const isCenter = normalizedDistance < 0.15;

            if (isCenter) {
                selectedIndex = index;
            }

            const left = point.x - this.iconHalf;
            const top = point.y - this.iconHalf;
            const background = iconBackground(iconData);
            const boxShadow = this.options.centerGlowEnabled && isCenter
                ? `0 10px 30px ${iconData.color}70`
                : `0 4px 15px ${iconData.color}30`;

            const content = iconData.content;
            const imageSrc = (content.type === 'image' || content.type === 'svg-url')
                ? content.value
                : '';
            const text = (content.type === 'text' || content.type === 'font')
                ? content.value
                : (content.type === 'svg-path' ? '' : iconData.displayLabel);
            const textStyle = content.type === 'font' && content.fontFamily
                ? { fontFamily: content.fontFamily }
                : {};

            states.push({
                index,
                visible: true,
                iconData,
                name: iconData.name,
                imageSrc,
                text,
                textStyle,
                isCenter,
                x: left,
                y: top,
                scale,
                opacity,
                zIndex,
                background,
                boxShadow,
                style: {
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    transform: `scale(${scale})`,
                    opacity,
                    zIndex,
                    background,
                    boxShadow,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }
            });
        });

        if (
            this._shouldEmitSelect() &&
            selectedIndex !== this.currentIndex
        ) {
            this.currentIndex = selectedIndex;
            this.onSelect?.(this.icons[selectedIndex], selectedIndex);
        }

        return { states, selectedIndex };
    }

    touchStart(clientX) {
        this._cancelAnimation();
        this.isDragging = true;
        this.isUserGesture = true;
        this.isFollowingExternal = false;
        this.startX = clientX;
        this.startOffset = this.currentOffset;
        this.onDragStart?.();
    }

    touchMove(clientX) {
        if (!this.isDragging) return this.currentOffset;

        const deltaX = clientX - this.startX;
        let newOffset = this.startOffset + deltaX * this.options.sensitivity;
        newOffset = this._applyRubberBand(newOffset);
        this.currentOffset = newOffset;
        this.onFrame?.();
        this._emitDragMove();
        return this.currentOffset;
    }

    touchEnd() {
        if (!this.isDragging) return { type: 'none' };
        this.isDragging = false;

        if (this._isOutOfBounds()) {
            return { type: 'rubberBand' };
        }
        return { type: 'snap' };
    }

    snapToClosest() {
        const closestIndex = this.getIndexFromOffset();
        const targetOffset = this.getOffsetForIndex(closestIndex);

        this._animateOffsetTo(
            targetOffset,
            this.options.snapDuration,
            easeOutCubic,
            () => {
                this.currentIndex = closestIndex;
                this._finishUserGesture(closestIndex);
            }
        );
    }

    snapBackRubberBand() {
        const { min, max } = this._getOffsetBounds();
        const targetOffset = this.currentOffset < min ? min : max;

        this._animateOffsetTo(
            targetOffset,
            this.options.rubberBandDuration,
            easeOutBack,
            () => {
                this.currentIndex = this.getIndexFromOffset(targetOffset);
                this._finishUserGesture(this.currentIndex);
            }
        );
    }

    _finishUserGesture(index) {
        if (!this.isUserGesture) return;
        this.isUserGesture = false;
        this.isFollowingExternal = false;
        this.onSlideEnd?.(index);
    }

    handleTouchEnd() {
        const result = this.touchEnd();
        if (result.type === 'rubberBand') {
            this.snapBackRubberBand();
        } else if (result.type === 'snap') {
            this.snapToClosest();
        }
        return result;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    slideTo(index, animate = true) {
        const targetIndex = this._clampIndex(index);
        const targetOffset = this.getOffsetForIndex(targetIndex);

        if (!animate) {
            this.currentOffset = targetOffset;
            this.currentIndex = targetIndex;
            this.onFrame?.();
            return;
        }

        this.currentOffset = targetOffset - 0.001;
        this.snapToClosest();
    }

    /** 跟随 swiper 手势位移，offset 与卡片 index 线性对应（每跨 1 页 offset 变化 1） */
    followSwiper({ baseIndex, dx, width }) {
        if (!width) return;
        this._cancelAnimation();
        this.isFollowingExternal = true;
        const baseOffset = this.getOffsetForIndex(baseIndex);
        const offset = baseOffset - dx / width;
        const { min, max } = this._getOffsetBounds();
        this.currentOffset = Math.max(min, Math.min(max, offset));
        this.currentIndex = this.getIndexFromOffset(this.currentOffset);
        this.onFrame?.();
    }

    endExternalFollow(index) {
        this.isFollowingExternal = false;
        this.slideTo(index, false);
    }

    /** 与 scroll 吸附同步的过渡动画 */
    animateToIndex(index, duration, onComplete) {
        const safeIndex = this._clampIndex(index);
        const targetOffset = this.getOffsetForIndex(safeIndex);
        this._cancelAnimation();
        this.isFollowingExternal = true;

        if (Math.abs(this.currentOffset - targetOffset) < 0.001) {
            this.currentIndex = safeIndex;
            this.isFollowingExternal = false;
            onComplete?.();
            return;
        }

        this._animateOffsetTo(targetOffset, duration, easeOutCubic, () => {
            this.currentIndex = safeIndex;
            this.isFollowingExternal = false;
            onComplete?.();
        });
    }

    followIndexFloat(indexFloat) {
        if (!Number.isFinite(indexFloat)) return;
        if (this.isAnimating && this.isFollowingExternal) return;
        this._cancelAnimation();
        this.isFollowingExternal = true;
        const offset = this.maxOffset - indexFloat;
        const { min, max } = this._getOffsetBounds();
        this.currentOffset = Math.max(min, Math.min(max, offset));
        this.currentIndex = this.getIndexFromOffset(this.currentOffset);
        this.onFrame?.();
    }

    destroy() {
        this._cancelAnimation();
        this.onSelect = null;
        this.onSlideEnd = null;
        this.onDragStart = null;
        this.onDragMove = null;
        this.onLayout = null;
        this.onFrame = null;
    }
}

export { mergeBezierConfig, buildBezierNorm, pointOnBezierCurve, bezierPathFromCurve } from './bezier-math.js';
export { normalizeIcons, resolveIconContent } from './icons.js';
