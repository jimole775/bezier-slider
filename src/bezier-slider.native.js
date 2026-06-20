/**
 * 二次贝塞尔弧形图标滑块
 *
 * Arc  = 弧形滑轨（一段曲线，非整圆）
 * Bezier = 轨迹由二次贝塞尔 Q 命令描述
 *
 * @example
 * const slider = new BezierSlider({
 *   container: '#carouselContainer',
 *   icons: [
 *     { name: '首页', emoji: '🏠', color: '#8b5cf6' },
 *     { name: '头像', image: 'data:image/png;base64,...' },
 *     { name: '设置', src: './icons/gear.svg' },
 *     { name: '消息', fontIcon: '\\ue001', fontFamily: 'iconfont' },
 *     { name: '搜索', svgPath: 'M10 10 L20 20', viewBox: '0 0 24 24' }
 *   ],
 *   bezier: { localBend: { t: 0.36, degrees: 40 } },
 *   tStep: 0.33,
 *   onSlideEnd: (index) => console.log(index)
 * });
 */
(function (global) {
    'use strict';

    /** 未指定 color 时循环使用的默认配色 */
    const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#3b82f6'];

    /** 组件默认配置，可通过 BezierSlider.DEFAULTS 查看 */
    const DEFAULTS = {
        icons: null,              // 图标列表，见 normalizeIcons / resolveIconContent 说明
        defaultIconCount: 4,      // 未传 icons 时的默认数量
        tStep: 0.33,              // 相邻图标沿曲线的参数间距，越大间隔越远
        visibleIconCount: 2,      // 拖动区域内最多同时可见的图标数
        centerT: 0.72,            // 滑轨中心点（固定参数 t，0~1）
        sensitivity: 0.004,       // 拖动灵敏度
        snapDuration: 300,        // 吸附动画时长（ms）
        rubberBandLimit: 0.42,    // 边界拉扯最大越界量（offset 单位）
        rubberBandDuration: 420,  // 越界松手后回弹动画时长（ms）
        fadeEnabled: false,        // 是否启用渐隐效果（距离中心越远越透明）
        centerGlowEnabled: true,   // 当前中心图标是否显示高亮背光
        trackScale: 1,             // 滑轨占容器宽度的比例（0.5~2），越大滑轨越长
        bezier: {
            // 基础二次贝塞尔三控制点（归一化坐标 0~1，y 越大越低）
            fitted: {
                p0: { x: 0.015, y: 0.48 },   // 左端略低（接近原默认高度）
                p1: { x: 0.48, y: 0.48 },    // 控制点 Y 直接参与弧度（不再被 rightTilt 覆盖）
                p2: { x: 0.985, y: 0.48 }    // 右端 Y 为基准，rightEndOffset 在其上叠加
            },
            curveSmooth: 0.1,             // 略平滑，弧线仍清晰
            rightTilt: 1,
            rightEndOffset: 0.11,         // 右端略抬高
            localBend: {
                t: 0.36,
                degrees: 38
            },
            leftEndBend: {
                degrees: 10
            }
        },
        onSlideEnd: null,           // 滑动吸附完成回调 (index) => {}
        onSelect: null,              // 图标进入中心选中回调 (icon, index) => {}
        onLayout: null,              // 布局更新回调 (layout) => {}，由调用方绘制滑轨
        initialIndex: 0              // 初始化时停在中心的图标下标
    };

    /** 解析容器：支持 CSS 选择器字符串或 DOM 元素 */
    function resolveElement(el) {
        if (typeof el === 'string') {
            return document.querySelector(el);
        }
        return el;
    }

    /** 去掉 undefined 字段，避免覆盖 DEFAULTS（框架封装常显式传入 undefined） */
    function omitUndefined(obj) {
        const result = {};
        for (const key of Object.keys(obj)) {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    /** 将十六进制颜色按百分比加深，用于图标渐变底色 */
    function darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /** 判断是否为图片地址（base64 或资源路径） */
    function isImageSource(value) {
        if (typeof value !== 'string' || !value) return false;
        return /^data:image\//i.test(value)
            || /\.(png|jpe?g|gif|webp|bmp|ico)(\?.*)?$/i.test(value)
            || /\.svg(\?.*)?$/i.test(value)
            || /^(\.\/|\.\.\/|\/|https?:)/i.test(value);
    }

    /** 判断是否为 SVG 资源路径（与 raster 图片区分时可单独传入 svg / svgUrl） */
    function isSvgUrl(value) {
        if (typeof value !== 'string' || !value) return false;
        return /\.svg(\?.*)?$/i.test(value) || /^data:image\/svg\+xml/i.test(value);
    }

    /**
     * 解析 font-icon 的 unicode
     * 支持：'\ue001'、'0xe001'、'U+E001'、59001、'&#xe001;'、直接字符
     */
    function parseUnicode(value) {
        if (value == null) return '';
        if (typeof value === 'number') {
            return String.fromCodePoint(value);
        }
        const str = String(value).trim();
        if (/^\\u[0-9a-fA-F]{4}$/.test(str)) {
            return String.fromCharCode(parseInt(str.slice(2), 16));
        }
        if (/^(0x[0-9a-fA-F]+|U\+[0-9a-fA-F]+)$/i.test(str)) {
            const hex = str.replace(/^U\+/i, '').replace(/^0x/i, '');
            return String.fromCodePoint(parseInt(hex, 16));
        }
        if (/^&#x[0-9a-fA-F]+;$/i.test(str)) {
            return String.fromCodePoint(parseInt(str.slice(3, -1), 16));
        }
        if (/^&#\d+;$/.test(str)) {
            return String.fromCodePoint(parseInt(str.slice(2, -1), 10));
        }
        if (/^\d+$/.test(str)) {
            return String.fromCodePoint(parseInt(str, 10));
        }
        return str;
    }

    /**
     * 解析单个图标的展示内容
     * 支持：emoji/text | image(base64/路径) | font-icon unicode | svg path | svg 资源路径
     */
    function resolveIconContent(icon, index) {
        if (typeof icon === 'number' || typeof icon === 'string') {
            if (typeof icon === 'string' && isImageSource(icon)) {
                const type = isSvgUrl(icon) ? 'svg-url' : 'image';
                return { type, value: icon };
            }
            const value = String(icon);
            return { type: 'text', value };
        }

        const imageSrc = icon.image ?? icon.src ?? icon.img;
        if (imageSrc) {
            const type = isSvgUrl(imageSrc) ? 'svg-url' : 'image';
            return { type, value: imageSrc };
        }

        const svgUrl = icon.svgUrl ?? icon.svgSrc;
        if (svgUrl) {
            return { type: 'svg-url', value: svgUrl };
        }
        if (typeof icon.svg === 'string' && isImageSource(icon.svg)) {
            return { type: 'svg-url', value: icon.svg };
        }

        const pathValue = icon.svgPath ?? icon.path ?? icon.svg?.path ?? icon.svg?.d;
        if (pathValue) {
            return {
                type: 'svg-path',
                value: pathValue,
                viewBox: icon.viewBox ?? icon.svg?.viewBox ?? '0 0 24 24',
                fill: icon.iconFill ?? icon.fill ?? icon.svg?.fill ?? 'currentColor',
                stroke: icon.iconStroke ?? icon.stroke ?? icon.svg?.stroke,
                strokeWidth: icon.iconStrokeWidth ?? icon.strokeWidth ?? icon.svg?.strokeWidth
            };
        }

        const fontValue = icon.fontIcon ?? icon.unicode ?? icon.iconCode ?? icon.charCode;
        if (fontValue != null) {
            return {
                type: 'font',
                value: parseUnicode(fontValue),
                fontFamily: icon.fontFamily,
                fontClass: icon.fontClass ?? icon.iconClass
            };
        }

        const text = icon.emoji ?? icon.label ?? icon.text ?? String(index + 1);
        return { type: 'text', value: text };
    }

    /** 供 onSelect 等回调使用的展示文本 */
    function getIconDisplayLabel(name, content) {
        if (content.type === 'text' || content.type === 'font') {
            return content.value;
        }
        return name;
    }

    /**
     * 标准化 icons 入参
     * 支持：对象数组 / 字符串数组 / 数字数组 / 图片路径字符串 / 不传（用 1~N 数字代替）
     */
    function normalizeIcons(icons, defaultCount) {
        const source = icons && icons.length > 0
            ? icons
            : Array.from({ length: defaultCount }, (_, i) => i + 1);

        return source.map((icon, index) => {
            const name = typeof icon === 'object' && icon !== null
                ? (icon.name ?? String(index + 1))
                : String(typeof icon === 'number' ? icon : (icon || index + 1));
            const color = typeof icon === 'object' && icon !== null
                ? (icon.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length])
                : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            const content = resolveIconContent(icon, index);
            const displayLabel = getIconDisplayLabel(name, content);

            return {
                name,
                color,
                content,
                displayLabel,
                emoji: displayLabel
            };
        });
    }

    /** 将标准化图标内容渲染为 DOM 节点 */
    function renderIconContent(iconData) {
        const { content } = iconData;
        const wrapClass = 'abs-icon-content';

        if (content.type === 'image' || content.type === 'svg-url') {
            const img = document.createElement('img');
            img.className = `${wrapClass} abs-icon-image`;
            img.src = content.value;
            img.alt = iconData.name;
            img.draggable = false;
            return img;
        }

        if (content.type === 'font') {
            const span = document.createElement('span');
            span.className = `${wrapClass} abs-icon-font`;
            if (content.fontClass) {
                span.classList.add(...content.fontClass.split(/\s+/).filter(Boolean));
            }
            span.textContent = content.value;
            if (content.fontFamily) {
                span.style.fontFamily = content.fontFamily;
            }
            return span;
        }

        if (content.type === 'svg-path') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', `${wrapClass} abs-icon-svg`);
            svg.setAttribute('viewBox', content.viewBox || '0 0 24 24');
            svg.setAttribute('aria-hidden', 'true');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', content.value);
            path.setAttribute('fill', content.fill || 'currentColor');
            if (content.stroke) {
                path.setAttribute('stroke', content.stroke);
            }
            if (content.strokeWidth != null) {
                path.setAttribute('stroke-width', String(content.strokeWidth));
            }
            svg.appendChild(path);
            return svg;
        }

        const span = document.createElement('span');
        span.className = `${wrapClass} abs-icon-text`;
        span.textContent = content.value;
        return span;
    }

    /** 注入图标、滑轨等基础样式（仅注入一次，框架封装无需重复写 CSS） */
    function ensureIconStyles() {
        if (document.getElementById('abs-slider-base-styles')) return;
        const style = document.createElement('style');
        style.id = 'abs-slider-base-styles';
        style.textContent = `
            .abs-carousel-icon, .carousel-icon {
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 22px;
                cursor: pointer;
                user-select: none;
                will-change: transform, opacity;
                z-index: 10;
            }
            .abs-carousel-icon .abs-icon-content { display: block; pointer-events: none; }
            .abs-carousel-icon .abs-icon-text,
            .abs-carousel-icon .abs-icon-font { line-height: 1; }
            .abs-carousel-icon .abs-icon-image {
                width: 62%;
                height: 62%;
                object-fit: contain;
                border-radius: 4px;
            }
            .abs-carousel-icon .abs-icon-svg {
                width: 58%;
                height: 58%;
                color: #fff;
            }
            .abs-track-svg, .track-svg {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: visible;
            }
            .abs-track-fill, .track-fill {
                opacity: 0.35;
            }
            .abs-track-glow, .track-glow {
                fill: none;
                stroke-width: 3;
                stroke-linecap: round;
                filter: drop-shadow(0 0 6px rgba(255, 200, 100, 0.8));
            }
            .abs-track-line, .track-line {
                fill: none;
                stroke: rgba(255, 220, 150, 0.45);
                stroke-width: 1.5;
                stroke-linecap: round;
            }
        `;
        document.head.appendChild(style);
    }

    /** 合并用户传入的 bezier 配置与默认值 */
    function mergeBezierConfig(bezier) {
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

    /**
     * 平滑贝塞尔：将控制点 P1 向 P0-P2 连线中点靠拢
     * smooth 越大，曲线越接近直线
     */
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

    /**
     * 右端高度微调：仅在 fitted 基础上叠加 P2 的 Y 偏移
     * 不修改 P1，以便控制点 P1 的 X/Y 滑块直接生效
     */
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

    /**
     * 中间局部下弯：通过下移 P1 实现
     * t 越接近 0.5 影响越大，degrees 为下弯角度
     */
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

    /** 左端下沉：下移 P0，P1 同步移动一半以保持切线平滑 */
    function applyLeftEndBend(bezier, degrees) {
        const sag = Math.tan(degrees * Math.PI / 180) * 0.1;
        return {
            p0: { x: bezier.p0.x, y: bezier.p0.y + sag },
            p1: { x: bezier.p1.x, y: bezier.p1.y + sag * 0.5 },
            p2: bezier.p2
        };
    }

    /** 按顺序叠加各项贝塞尔变换，输出最终归一化控制点 */
    function buildBezierNorm(bezierConfig) {
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

    /** 生成 SVG 二次贝塞尔 path 字符串（供调用方绘制滑轨） */
    function bezierPathFromCurve(curve, fillToY) {
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

    /** 二次贝塞尔曲线求点（静态工具） */
    function pointOnBezierCurve(t, curve) {
        const u = 1 - t;
        return {
            x: u * u * curve.p0.x + 2 * u * t * curve.p1.x + t * t * curve.p2.x,
            y: u * u * curve.p0.y + 2 * u * t * curve.p1.y + t * t * curve.p2.y
        };
    }

    /**
     * 二次贝塞尔弧形图标滑块
     */
    class BezierSlider {
        static DEFAULTS = DEFAULTS;
        static resolveIconContent = resolveIconContent;
        static renderIconContent = renderIconContent;
        static bezierPath = bezierPathFromCurve;
        static pointOnCurve = pointOnBezierCurve;

        constructor(options = {}) {
            const normalizedOptions = omitUndefined(options);
            this.options = { ...DEFAULTS, ...normalizedOptions };
            this.options.bezier = mergeBezierConfig(normalizedOptions.bezier);
            this.container = resolveElement(options.container);

            if (!this.container) {
                throw new Error('BezierSlider: container is required');
            }

            this.icons = normalizeIcons(options.icons, this.options.defaultIconCount);
            this.totalIcons = this.icons.length;
            this.maxOffset = (this.totalIcons - 1) / 2;  // 拖动偏移上限，保证首尾图标都能到中心
            this.centerT = options.centerT ?? DEFAULTS.centerT;
            this.tStep = options.tStep ?? DEFAULTS.tStep;
            this.visibleIconCount = options.visibleIconCount ?? DEFAULTS.visibleIconCount;
            this.startT = this.centerT - this.maxOffset * this.tStep;  // offset=maxOffset 时 index=0 在 centerT
            this.bezierNorm = buildBezierNorm(this.options.bezier);

            this.dragArea = null;       // 拖动可见区域（动态测量）
            this.trackBounds = null;    // 滑轨绘制区域（动态测量）
            this.bezier = null;         // 像素坐标系下的三控制点
            this.iconHalf = 25;
            const initialIndex = this._clampIndex(
                options.initialIndex ?? this.options.initialIndex ?? DEFAULTS.initialIndex
            );
            this.currentIndex = initialIndex;
            this.currentOffset = this.getOffsetForIndex(initialIndex);
            this.isDragging = false;
            this.isSliding = false;     // 是否处于拖动/吸附中（用于禁用文字选中）
            this.startX = 0;
            this.startOffset = 0;
            this._animFrameId = null;

            this._onSelectStart = this._onSelectStart.bind(this);
            this._onMouseDown = this._onMouseDown.bind(this);
            this._onTouchStart = this._onTouchStart.bind(this);
            this._onMove = this._onMove.bind(this);
            this._onEnd = this._onEnd.bind(this);
            this._onResize = this._onResize.bind(this);

            this.iconsArray = [];
            ensureIconStyles();
            this._createIcons();
            this._bindEvents();
            this.initLayout();
        }

        /** 将图标下标限制在合法范围 */
        _clampIndex(index) {
            const n = Math.round(Number(index));
            const safe = Number.isFinite(n) ? n : 0;
            return Math.max(0, Math.min(this.totalIcons - 1, safe));
        }

        /** 指定下标处于中心时的 offset：index=0 → maxOffset，末位 → -maxOffset */
        getOffsetForIndex(index) {
            return this.maxOffset - this._clampIndex(index);
        }

        /** 触发 onLayout，将几何数据交给调用方绘制滑轨 */
        _emitLayout() {
            const layout = this.getLayoutState();
            if (typeof this.options.onLayout === 'function') {
                this.options.onLayout(layout);
            }
            return layout;
        }

        /**
         * 获取当前布局几何状态（供调用方自行绘制滑轨 / 中心标记）
         */
        getLayoutState() {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            const fillBottom = this.trackBounds
                ? this.trackBounds.top + this.trackBounds.height + 10
                : 0;

            return {
                container: this.container,
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

        /** 根据 icons 配置创建图标 DOM */
        _createIcons() {
            this.container.querySelectorAll('.abs-carousel-icon').forEach((el) => el.remove());

            this.icons.forEach((iconData) => {
                const icon = document.createElement('div');
                icon.className = 'abs-carousel-icon carousel-icon';
                icon.appendChild(renderIconContent(iconData));

                const isMedia = iconData.content.type === 'image' || iconData.content.type === 'svg-url';
                if (isMedia && iconData.content.type === 'image') {
                    icon.style.background = `linear-gradient(145deg, ${iconData.color} 0%, ${darkenColor(iconData.color, 30)} 100%)`;
                } else if (isMedia) {
                    icon.style.background = `linear-gradient(145deg, ${iconData.color}22 0%, ${darkenColor(iconData.color, 10)}33 100%)`;
                } else {
                    icon.style.background = `linear-gradient(145deg, ${iconData.color} 0%, ${darkenColor(iconData.color, 30)} 100%)`;
                    if (iconData.content.type === 'font' && iconData.content.fontFamily) {
                        icon.style.fontFamily = iconData.content.fontFamily;
                    }
                }

                icon.style.boxShadow = `0 6px 20px ${iconData.color}50`;
                this.container.appendChild(icon);
                this.iconsArray.push({ element: icon, data: iconData });
            });
        }

        /** 绑定拖动、触摸、resize 等事件 */
        _bindEvents() {
            document.addEventListener('selectstart', this._onSelectStart);
            this.container.addEventListener('mousedown', this._onMouseDown);
            this.container.addEventListener('touchstart', this._onTouchStart, { passive: true });
            document.addEventListener('mousemove', this._onMove);
            document.addEventListener('mouseup', this._onEnd);
            document.addEventListener('touchmove', this._onMove, { passive: false });
            document.addEventListener('touchend', this._onEnd);
            window.addEventListener('resize', this._onResize);
        }

        /** 滑动过程中阻止文字被框选 */
        _onSelectStart(e) {
            if (this.isSliding) {
                e.preventDefault();
            }
        }

        /** 切换滑动状态，同步 body 样式以禁用 user-select */
        _setSliding(active) {
            this.isSliding = active;
            document.body.classList.toggle('is-sliding', active);
            if (active) {
                window.getSelection()?.removeAllRanges();
            }
        }

        _onMouseDown(e) {
            this._cancelAnimation();
            this.isDragging = true;
            this._setSliding(true);
            this.startX = e.clientX;
            this.startOffset = this.currentOffset;
        }

        _onTouchStart(e) {
            this._cancelAnimation();
            this.isDragging = true;
            this._setSliding(true);
            this.startX = e.touches?.[0]?.clientX || e.clientX;
            this.startOffset = this.currentOffset;
        }

        /** 合法 offset 范围：首图标 +maxOffset，末图标 -maxOffset */
        _getOffsetBounds() {
            return { min: -this.maxOffset, max: this.maxOffset };
        }

        /** 越界拖拽时的阻尼距离：拉得越远阻力越大，渐近于 rubberBandLimit */
        _rubberBandDistance(excess, limit) {
            return limit * (1 - 1 / (excess / limit * 0.55 + 1));
        }

        /** 将超出范围的 offset 转为带阻尼的拉扯值 */
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
                cancelAnimationFrame(this._animFrameId);
                this._animFrameId = null;
            }
        }

        /**
         * offset 动画通用驱动
         * @param {number} targetOffset 目标 offset
         * @param {number} duration 时长 ms
         * @param {function} ease 缓动函数 (progress 0~1) => 0~1
         * @param {function} onComplete 完成回调
         */
        _animateOffsetTo(targetOffset, duration, ease, onComplete) {
            this._cancelAnimation();
            const startOffsetAnim = this.currentOffset;
            const diff = targetOffset - startOffsetAnim;
            const startTime = performance.now();

            if (Math.abs(diff) < 0.0001) {
                onComplete?.();
                return;
            }

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = ease(progress);

                this.currentOffset = startOffsetAnim + diff * eased;
                this.updatePositions(this.currentOffset);

                if (progress < 1) {
                    this._animFrameId = requestAnimationFrame(animate);
                } else {
                    this._animFrameId = null;
                    this.currentOffset = targetOffset;
                    this.updatePositions(this.currentOffset);
                    onComplete?.();
                }
            };

            this._animFrameId = requestAnimationFrame(animate);
        }

        /** ease-out 缓动（吸附用） */
        _easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        /** 带回弹的 ease-out（越界回弹用，末尾轻微 overshoot） */
        _easeOutBack(t) {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }

        _onMove(e) {
            if (!this.isDragging) return;
            e.preventDefault?.();

            const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
            const deltaX = clientX - this.startX;
            // 向左滑 → deltaX 负 → offset 减小 → 图标向左移动
            let newOffset = this.startOffset + deltaX * this.options.sensitivity;

            // 末/首图标越界时允许拉扯，带阻尼
            newOffset = this._applyRubberBand(newOffset);
            this.currentOffset = newOffset;
            this.updatePositions(this.currentOffset);
        }

        _onEnd() {
            if (!this.isDragging) return;
            this.isDragging = false;

            if (this._isOutOfBounds()) {
                this._snapBackRubberBand();
            } else {
                this.snapToClosest();
            }
        }

        /**
         * 越界松手后回弹到合法边界
         * 末图标（offset = -maxOffset）或首图标（offset = +maxOffset）处生效
         */
        _snapBackRubberBand() {
            const { min, max } = this._getOffsetBounds();
            const targetOffset = this.currentOffset < min ? min : max;

            this._animateOffsetTo(
                targetOffset,
                this.options.rubberBandDuration,
                (t) => this._easeOutBack(t),
                () => {
                    this._setSliding(false);
                    this.currentIndex = this.getIndexFromOffset(targetOffset);
                    if (typeof this.options.onSlideEnd === 'function') {
                        this.options.onSlideEnd(this.currentIndex);
                    }
                }
            );
        }

        _onResize() {
            this.initLayout();
        }

        /** 归一化坐标 (0~1) 映射到容器像素坐标 */
        _mapToPixels(point, bounds) {
            return {
                x: bounds.left + point.x * bounds.width,
                y: bounds.top + point.y * bounds.height
            };
        }

        /**
         * 动态测量拖动区域与滑轨边界
         * 每次初始化 / resize 时调用，不固定写死尺寸
         */
        measureDragArea() {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            const sampleIcon = this.container.querySelector('.abs-carousel-icon');
            this.iconHalf = sampleIcon ? sampleIcon.offsetWidth / 2 : 25;

            // 图标中心点允许出现的矩形区域
            this.dragArea = {
                left: this.iconHalf,
                top: this.iconHalf,
                width: width - this.iconHalf * 2,
                height: height - this.iconHalf * 2
            };

            // 滑轨几何范围（相对容器比例），不含 DOM 绘制
            const trackScale = this.options.trackScale;
            const trackMargin = (1 - trackScale) / 2;
            this.trackBounds = {
                left: width * trackMargin,
                top: height * 0.067,
                width: width * trackScale,
                height: height * 0.867
            };
        }

        /** 将归一化贝塞尔控制点转换为当前容器下的像素坐标 */
        rebuildBezierCurve() {
            this.bezier = {
                p0: this._mapToPixels(this.bezierNorm.p0, this.trackBounds),
                p1: this._mapToPixels(this.bezierNorm.p1, this.trackBounds),
                p2: this._mapToPixels(this.bezierNorm.p2, this.trackBounds)
            };
        }

        /** 二次贝塞尔曲线求点，委托给静态工具 BezierSlider.pointOnCurve */
        bezierPoint(t, curve = this.bezier) {
            return pointOnBezierCurve(t, curve);
        }

        isInDragArea(point) {
            if (!this.dragArea) return false;
            return (
                point.x >= this.dragArea.left &&
                point.x <= this.dragArea.left + this.dragArea.width &&
                point.y >= this.dragArea.top &&
                point.y <= this.dragArea.top + this.dragArea.height
            );
        }

        /** 图标圆盘是否与容器可见区域相交（用于可见性，允许边缘半露） */
        isIconVisibleInContainer(point) {
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            const r = this.iconHalf;
            return (
                point.x + r >= 0 &&
                point.x - r <= w &&
                point.y + r >= 0 &&
                point.y - r <= h
            );
        }

        /** 根据当前 offset 计算最近的图标下标 */
        getIndexFromOffset(offset = this.currentOffset) {
            const index = Math.round(this.maxOffset - offset);
            return Math.max(0, Math.min(this.totalIcons - 1, index));
        }

        /**
         * 更新所有图标的位置与视觉状态
         * 距离 centerT 越近 → 越大、越亮（近大远小）
         */
        updatePositions(offset = 0) {
            const iconStates = this.iconsArray.map((item, index) => {
                const t = this.startT + this.tStep * index + offset * this.tStep;
                return { item, index, t, dist: Math.abs(t - this.centerT) };
            });

            // 与容器相交、且离中心最近的 N 个图标可见
            const visibleIndexes = new Set(
                iconStates
                    .filter(({ t }) => this.isIconVisibleInContainer(this.bezierPoint(t)))
                    .slice()
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, this.visibleIconCount)
                    .map((state) => state.index)
            );

            iconStates.forEach(({ item, index, t }) => {
                const point = this.bezierPoint(t);
                const visible = visibleIndexes.has(index);
                const distanceFromCenter = Math.abs(t - this.centerT);
                const normalizedDistance = Math.min(distanceFromCenter / this.tStep, 1);

                if (!visible) {
                    item.element.style.opacity = '0';
                    item.element.style.pointerEvents = 'none';
                    item.element.style.visibility = 'hidden';
                    return;
                }

                item.element.style.visibility = 'visible';
                item.element.style.pointerEvents = 'auto';

                const scale = 0.35 + (1 - normalizedDistance) * 0.7;
                const opacity = this.options.fadeEnabled ? (0.35 + (1 - normalizedDistance) * 0.65) : 1;
                const brightness = this.options.fadeEnabled ? (0.5 + (1 - normalizedDistance) * 0.5) : 1;
                const zIndex = Math.floor(scale * 20);

                item.element.style.left = `${point.x - this.iconHalf}px`;
                item.element.style.top = `${point.y - this.iconHalf}px`;
                item.element.style.transform = `scale(${scale})`;
                item.element.style.opacity = opacity;
                item.element.style.filter = `brightness(${brightness})`;
                item.element.style.zIndex = zIndex;

                const isCenter = normalizedDistance < 0.15;
                if (isCenter) {
                    this.currentIndex = index;
                    if (typeof this.options.onSelect === 'function') {
                        this.options.onSelect(item.data, index);
                    }
                }

                item.element.style.boxShadow = this.options.centerGlowEnabled && isCenter
                    ? `0 10px 30px ${item.data.color}70`
                    : `0 4px 15px ${item.data.color}30`;
            });
        }

        /** 重新测量布局，通知调用方绘制滑轨并刷新图标位置 */
        initLayout() {
            this.measureDragArea();
            this.rebuildBezierCurve();
            this._emitLayout();
            this.updatePositions(this.currentOffset);
        }

        /**
         * 吸附到最近的图标
         * 动画结束后触发 onSlideEnd 回调
         */
        snapToClosest() {
            const closestIndex = this.getIndexFromOffset();
            const targetOffset = this.getOffsetForIndex(closestIndex);

            this._animateOffsetTo(
                targetOffset,
                this.options.snapDuration,
                (t) => this._easeOutCubic(t),
                () => {
                    this._setSliding(false);
                    this.currentIndex = closestIndex;
                    if (typeof this.options.onSlideEnd === 'function') {
                        this.options.onSlideEnd(closestIndex);
                    }
                }
            );
        }

        /** 获取当前选中图标的下标 */
        getCurrentIndex() {
            return this.currentIndex;
        }

        /**
         * 滑动到指定下标
         * @param {number} index 目标图标下标
         * @param {boolean} animate 是否播放吸附动画，默认 true
         */
        slideTo(index, animate = true) {
            const targetIndex = this._clampIndex(index);
            const targetOffset = this.getOffsetForIndex(targetIndex);

            if (!animate) {
                this.currentOffset = targetOffset;
                this.updatePositions(this.currentOffset);
                this.currentIndex = targetIndex;
                return;
            }

            this.currentOffset = targetOffset - 0.001;
            this.snapToClosest();
        }

        /** 销毁实例：解绑事件并移除图标 DOM */
        destroy() {
            this._cancelAnimation();
            document.removeEventListener('selectstart', this._onSelectStart);
            this.container.removeEventListener('mousedown', this._onMouseDown);
            this.container.removeEventListener('touchstart', this._onTouchStart);
            document.removeEventListener('mousemove', this._onMove);
            document.removeEventListener('mouseup', this._onEnd);
            document.removeEventListener('touchmove', this._onMove);
            document.removeEventListener('touchend', this._onEnd);
            window.removeEventListener('resize', this._onResize);
            this.container.querySelectorAll(
                '.abs-carousel-icon, .abs-track-svg'
            ).forEach((el) => el.remove());
        }
    }

    global.BezierSlider = BezierSlider;
    global.BezierSlider.resolveIconContent = resolveIconContent;
    global.BezierSlider.renderIconContent = renderIconContent;
})(typeof window !== 'undefined' ? window : globalThis);
