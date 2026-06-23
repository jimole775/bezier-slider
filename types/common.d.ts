export interface BezierPoint {
    x: number;
    y: number;
}

export interface BezierFitted {
    p0: BezierPoint;
    p1: BezierPoint;
    p2: BezierPoint;
}

export interface BezierLocalBend {
    t: number;
    degrees: number;
}

export interface BezierLeftEndBend {
    degrees: number;
}

export interface BezierConfig {
    fitted?: BezierFitted;
    curveSmooth?: number;
    rightTilt?: number;
    rightEndOffset?: number;
    localBend?: BezierLocalBend;
    leftEndBend?: BezierLeftEndBend;
}

/** 传入 icons 数组时的单项配置 */
export interface SliderIconInput {
    name?: string;
    color?: string;
    emoji?: string;
    label?: string;
    text?: string;
    image?: string;
    src?: string;
    img?: string;
    svgUrl?: string;
    svgSrc?: string;
    svg?: string;
    svgPath?: string;
    path?: string;
    viewBox?: string;
    fill?: string;
    iconFill?: string;
    stroke?: string;
    iconStroke?: string;
    strokeWidth?: number;
    iconStrokeWidth?: number;
    fontIcon?: string | number;
    unicode?: string | number;
    iconCode?: string | number;
    charCode?: string | number;
    fontFamily?: string;
    fontClass?: string;
    iconClass?: string;
}

export type SliderIconList = SliderIconInput[] | Array<string | number>;

export interface IconContentText {
    type: 'text';
    value: string;
}

export interface IconContentFont {
    type: 'font';
    value: string;
    fontFamily?: string;
    fontClass?: string;
}

export interface IconContentImage {
    type: 'image';
    value: string;
}

export interface IconContentSvgUrl {
    type: 'svg-url';
    value: string;
}

export interface IconContentSvgPath {
    type: 'svg-path';
    value: string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

export type IconContent =
    | IconContentText
    | IconContentFont
    | IconContentImage
    | IconContentSvgUrl
    | IconContentSvgPath;

/** onSelect 回调中的标准化图标 */
export interface NormalizedIcon {
    name: string;
    color: string;
    content: IconContent;
    displayLabel: string;
    emoji: string;
}

export interface RectBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface EngineLayoutState {
    width: number;
    height: number;
    trackBounds: RectBounds | null;
    dragArea: RectBounds | null;
    bezier: BezierFitted | null;
    bezierNorm: BezierFitted | null;
    centerT: number;
    centerPoint: BezierPoint | null;
    fillBottom: number;
}

export interface LayoutState extends EngineLayoutState {
    container: HTMLElement;
}

export interface DragPayload {
    offset: number;
    indexFloat: number;
    index: number;
}

export interface FollowSwiperPayload {
    baseIndex: number;
    dx: number;
    width: number;
}

export interface BezierSliderOptions {
    container: string | HTMLElement;
    icons?: SliderIconList | null;
    defaultIconCount?: number;
    tStep?: number;
    visibleIconCount?: number;
    centerT?: number;
    trackScale?: number;
    sensitivity?: number;
    snapDuration?: number;
    rubberBandLimit?: number;
    rubberBandDuration?: number;
    fadeEnabled?: boolean;
    centerGlowEnabled?: boolean;
    bezier?: BezierConfig;
    initialIndex?: number;
    onSelect?: (icon: NormalizedIcon, index: number) => void;
    onSlideEnd?: (index: number) => void;
    onDragStart?: () => void;
    onDragMove?: (payload: DragPayload) => void;
    onLayout?: (layout: LayoutState) => void;
}

/** Vue / React 组件共用的配置 Props（不含容器与回调命名差异） */
export interface BezierSliderSharedProps {
    icons?: SliderIconList;
    defaultIconCount?: number;
    tStep?: number;
    visibleIconCount?: number;
    centerT?: number;
    trackScale?: number;
    sensitivity?: number;
    snapDuration?: number;
    rubberBandLimit?: number;
    rubberBandDuration?: number;
    fadeEnabled?: boolean;
    centerGlowEnabled?: boolean;
    initialIndex?: number;
    bezier?: BezierConfig;
}

export interface BezierSliderInstanceMethods {
    slideTo(index: number, animate?: boolean): void;
    followSwiper(payload: FollowSwiperPayload): void;
    endExternalFollow(index: number): void;
    animateToIndex(index: number, duration: number, onComplete?: () => void): void;
    followIndexFloat(indexFloat: number): void;
    getCurrentIndex(): number;
    getOffsetForIndex(index: number): number;
    getLayoutState(): LayoutState;
    initLayout(): void;
    destroy(): void;
}

export interface TrackDomSelectors {
    svg?: string;
    trackFill?: string;
    trackGlow?: string;
    trackLine?: string;
    centerHighlight?: string;
}

export interface TrackRenderOptions {
    selectors?: TrackDomSelectors;
    svgClass?: string;
    fillClass?: string;
    glowClass?: string;
    lineClass?: string;
    glowGradientId?: string;
    fillGradientId?: string;
}
