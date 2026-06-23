import type {
    BezierConfig,
    BezierSliderSharedProps,
    DragPayload,
    EngineLayoutState,
    FollowSwiperPayload,
    NormalizedIcon
} from './common';

export * from './common';

/** 微信原生小程序组件 properties */
export interface BezierSliderWxProps extends BezierSliderSharedProps {
    iconSize?: number;
    showTrack?: boolean;
    rootClass?: string;
    rootStyle?: string;
}

/** select 事件 detail */
export interface BezierSliderWxSelectDetail {
    icon: NormalizedIcon;
    index: number;
}

/** slide-end 事件 detail */
export interface BezierSliderWxSlideEndDetail {
    index: number;
}

/** 组件实例 methods（通过 selectComponent 调用） */
export interface BezierSliderWxMethods {
    slideTo(index: number, animate?: boolean): void;
    getCurrentIndex(): number;
    getLayoutState(): EngineLayoutState | undefined;
    getInstance(): unknown;
    followSwiper(payload: FollowSwiperPayload): void;
    endExternalFollow(index: number): void;
    animateToIndex(index: number, duration: number, onComplete?: () => void): void;
    followIndexFloat(indexFloat: number): void;
}

/** 页面 JSON usingComponents 路径 */
declare const BezierSliderWxComponentPath: 'bezier-slider/wx/bezier-slider/index';

export type { BezierConfig, DragPayload, FollowSwiperPayload };
