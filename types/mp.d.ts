import type { Component } from 'vue';
import type {
    BezierConfig,
    BezierSliderInstanceMethods,
    BezierSliderSharedProps,
    DragPayload,
    EngineLayoutState,
    FollowSwiperPayload,
    LayoutState,
    NormalizedIcon
} from './common';

export * from './common';

export interface BezierSliderMpProps extends BezierSliderSharedProps {
    iconSize?: number;
    showTrack?: boolean;
    rootClass?: string | string[] | Record<string, boolean>;
    rootStyle?: string | Record<string, string | number> | Array<string | Record<string, string | number>>;
}

export interface BezierSliderEngineOptions extends BezierSliderSharedProps {
    iconSize?: number;
    onSelect?: (icon: NormalizedIcon, index: number) => void;
    onSlideEnd?: (index: number) => void;
    onDragStart?: () => void;
    onDragMove?: (payload: DragPayload) => void;
    onLayout?: (layout: LayoutState) => void;
    onFrame?: () => void;
}

export declare class BezierSliderEngine {
    constructor(options?: BezierSliderEngineOptions, scheduler?: unknown);

    static readonly DEFAULTS: BezierSliderSharedProps & { bezier: BezierConfig; iconSize: number };

    containerWidth: number;
    containerHeight: number;
    currentIndex: number;
    currentOffset: number;
    isDragging: boolean;
    isAnimating: boolean;

    getOffsetForIndex(index: number): number;
    getIndexFromOffset(offset?: number): number;
    getDragPayload(): DragPayload;
    getLayoutState(): EngineLayoutState;
    getTrackPaths(): { linePath: string; fillPath: string; viewBox: string };
    setSize(width: number, height: number, iconHalf?: number): void;
    computeIconStates(offset?: number): { states: unknown[] };
    touchStart(clientX: number): void;
    touchMove(clientX: number): void;
    touchEnd(): void;
    handleTouchEnd(): void;
    followSwiper(payload: FollowSwiperPayload): void;
    endExternalFollow(index: number): void;
    animateToIndex(index: number, duration: number, onComplete?: () => void): void;
    followIndexFloat(indexFloat: number): void;
    getCurrentIndex(): number;
    slideTo(index: number, animate?: boolean): void;
    destroy(): void;
}

/** uni-app 小程序组件实例（canvas 作用域） */
export type MpComponentInstance = Record<string, unknown>;

export function drawDefaultTrackOnCanvas(
    component: MpComponentInstance,
    canvasId: string,
    layout: EngineLayoutState
): void;

declare const BezierSlider: Component<BezierSliderMpProps>;

export { BezierSlider };
export default BezierSlider;
