'use strict';

const { BezierSliderEngine } = require('./engine.js');
const { pickNativeOptions, getIconsSignature } = require('./options.js');
const { drawDefaultTrackOnCanvas } = require('./track-canvas.js');

const DEFAULT_ICONS = [
    { name: '首页', emoji: '🏠', color: '#8b5cf6' },
    { name: '搜索', emoji: '🔍', color: '#ec4899' },
    { name: '消息', emoji: '💬', color: '#06b6d4' },
    { name: '设置', emoji: '⚙️', color: '#22c55e' }
];

let canvasSeed = 0;

function buildIconStyleStr(item, iconSize) {
    if (!item.visible) {
        return 'opacity:0;visibility:hidden;pointer-events:none;';
    }
    return [
        `left:${item.x}px`,
        `top:${item.y}px`,
        `width:${iconSize}px`,
        `height:${iconSize}px`,
        `opacity:${item.opacity}`,
        `z-index:${item.zIndex}`,
        `background:${item.background}`,
        `box-shadow:${item.boxShadow}`,
        `transform:scale(${item.scale})`
    ].join(';');
}

function buildTextStyleStr(textStyle) {
    if (!textStyle || !textStyle.fontFamily) return '';
    return `font-family:${textStyle.fontFamily};`;
}

Component({
    properties: {
        icons: {
            type: Array,
            value: DEFAULT_ICONS
        },
        defaultIconCount: Number,
        tStep: Number,
        visibleIconCount: Number,
        centerT: Number,
        trackScale: Number,
        sensitivity: Number,
        snapDuration: Number,
        rubberBandLimit: Number,
        rubberBandDuration: Number,
        fadeEnabled: Boolean,
        centerGlowEnabled: Boolean,
        initialIndex: Number,
        bezier: Object,
        iconSize: {
            type: Number,
            value: 50
        },
        showTrack: {
            type: Boolean,
            value: true
        },
        rootClass: String,
        rootStyle: String
    },

    data: {
        canvasId: '',
        iconStates: [],
        containerWidth: 0,
        containerHeight: 0,
        layoutReady: false,
        containerStyle: ''
    },

    lifetimes: {
        attached() {
            this._canvasId = `bezier-slider-canvas-${++canvasSeed}`;
            this._iconsSignature = getIconsSignature(this.properties.icons);
            this._bezierSignature = JSON.stringify(this.properties.bezier || {});
            this.setData({ canvasId: this._canvasId });
            this.rebuildEngine(false);
            this.measureAndLayout();
        },
        detached() {
            this._engine?.destroy();
            this._engine = null;
        }
    },

    observers: {
        icons(icons) {
            const signature = getIconsSignature(icons);
            if (signature === this._iconsSignature) return;
            this._iconsSignature = signature;
            this.rebuildEngine(true);
            if (this.data.containerWidth && this.data.containerHeight) {
                this.refreshView();
            } else {
                this.measureAndLayout();
            }
        },
        bezier(bezier) {
            const signature = JSON.stringify(bezier || {});
            if (signature === this._bezierSignature) return;
            this._bezierSignature = signature;
            this.rebuildEngine(true);
            if (this._engine && this._engine.containerWidth) {
                this.refreshView();
            }
        },
        initialIndex(value) {
            const engine = this._engine;
            if (!engine) return;
            if (
                engine.isDragging ||
                engine.isAnimating ||
                engine.isFollowingExternal ||
                engine.isUserGesture
            ) {
                return;
            }
            if (engine.currentIndex === value) return;
            const targetOffset = engine.getOffsetForIndex(value);
            if (Math.abs(engine.currentOffset - targetOffset) < 0.02) {
                engine.currentIndex = value;
                return;
            }
            this.slideTo(value, false);
        }
    },

    methods: {
        rebuildEngine(keepOffset) {
            const prevEngine = this._engine;
            const prevWidth = (prevEngine && prevEngine.containerWidth) || this.data.containerWidth;
            const prevHeight = (prevEngine && prevEngine.containerHeight) || this.data.containerHeight;
            const offset = keepOffset && prevEngine ? prevEngine.currentOffset : undefined;
            const index = keepOffset && prevEngine
                ? prevEngine.currentIndex
                : this.properties.initialIndex;

            prevEngine?.destroy();

            const props = this.properties;
            this._engine = new BezierSliderEngine({
                ...pickNativeOptions(props),
                icons: props.icons,
                initialIndex: index,
                onSelect: (icon, selectedIndex) => {
                    this.triggerEvent('select', { icon, index: selectedIndex });
                },
                onSlideEnd: (selectedIndex) => {
                    this.triggerEvent('slide-end', { index: selectedIndex });
                },
                onDragStart: () => {
                    this.triggerEvent('drag-start', {});
                },
                onDragMove: (payload) => {
                    this.triggerEvent('drag-move', payload);
                },
                onFrame: () => {
                    this.refreshView();
                }
            });

            const iconSize = props.iconSize || 50;
            if (prevWidth && prevHeight) {
                this._engine.setSize(prevWidth, prevHeight, iconSize / 2);
            }
            if (offset !== undefined) {
                this._engine.currentOffset = offset;
                this._engine.currentIndex = this._engine.getIndexFromOffset(offset);
            }
        },

        measureAndLayout(retryCount = 0) {
            const query = this.createSelectorQuery();
            query
                .select('.bezier-slider-wx')
                .boundingClientRect((rect) => {
                    if (!rect || !rect.width || !rect.height) {
                        if (retryCount < 20) {
                            setTimeout(() => this.measureAndLayout(retryCount + 1), 50);
                            return;
                        }
                        this.applyFallbackLayout();
                        return;
                    }
                    const iconSize = this.properties.iconSize || 50;
                    this._engine?.setSize(rect.width, rect.height, iconSize / 2);
                    this.setData({
                        containerWidth: rect.width,
                        containerHeight: rect.height,
                        layoutReady: true
                    }, () => {
                        this.updateContainerStyle();
                        this.refreshView();
                    });
                })
                .exec();
        },

        applyFallbackLayout() {
            const sys = wx.getSystemInfoSync();
            const width = (686 / 750) * (sys.windowWidth || 375);
            const height = 120;
            const iconSize = this.properties.iconSize || 50;
            this._engine?.setSize(width, height, iconSize / 2);
            this.setData({
                containerWidth: width,
                containerHeight: height,
                layoutReady: true
            }, () => {
                this.updateContainerStyle();
                this.refreshView();
            });
        },

        updateContainerStyle() {
            const { containerWidth, containerHeight } = this.data;
            const rootStyle = this.properties.rootStyle || '';
            let style = rootStyle;
            if (containerWidth && containerHeight) {
                style += `width:${containerWidth}px;height:${containerHeight}px;`;
            }
            if (style !== this.data.containerStyle) {
                this.setData({ containerStyle: style });
            }
        },

        refreshView() {
            const engine = this._engine;
            if (!engine || !engine.containerWidth) return;

            const iconSize = this.properties.iconSize || 50;
            const { states } = engine.computeIconStates(engine.currentOffset);
            const iconStates = states.map((item) => ({
                index: item.index,
                visible: item.visible,
                imageSrc: item.imageSrc || '',
                text: item.text || '',
                styleStr: buildIconStyleStr(item, iconSize),
                textStyleStr: buildTextStyleStr(item.textStyle)
            }));

            this.setData({ iconStates });

            if (this.properties.showTrack && this.data.layoutReady) {
                this.drawTrackCanvas();
            }
        },

        drawTrackCanvas() {
            if (!this.data.layoutReady || !this._engine) return;
            drawDefaultTrackOnCanvas(this, this._canvasId, this._engine.getLayoutState());
        },

        touchClientX(event) {
            const touch = event.touches && event.touches[0];
            return touch?.clientX ?? touch?.pageX ?? 0;
        },

        onTouchStart(event) {
            if (!this._engine) return;
            this._engine.touchStart(this.touchClientX(event));
        },

        onTouchMove(event) {
            if (!this._engine || !this._engine.isDragging) return;
            this._engine.touchMove(this.touchClientX(event));
        },

        onTouchEnd() {
            if (!this._engine) return;
            this._engine.handleTouchEnd();
        },

        slideTo(index, animate = true) {
            this._engine?.slideTo(index, animate);
        },

        followSwiper(payload) {
            this._engine?.followSwiper(payload);
        },

        endExternalFollow(index) {
            this._engine?.endExternalFollow(index);
        },

        animateToIndex(index, duration, onComplete) {
            this._engine?.animateToIndex(index, duration, onComplete);
        },

        followIndexFloat(indexFloat) {
            this._engine?.followIndexFloat(indexFloat);
        },

        getCurrentIndex() {
            return this._engine ? this._engine.getCurrentIndex() : 0;
        },

        getLayoutState() {
            return this._engine?.getLayoutState();
        },

        getInstance() {
            return this._engine;
        }
    }
});
