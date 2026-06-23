import type { DefineComponent } from 'vue';
import type {
    BezierSliderInstanceMethods,
    BezierSliderSharedProps,
    DragPayload,
    LayoutState,
    NormalizedIcon,
    TrackRenderOptions
} from './common';
import type BezierSliderNative from './bezier-slider';

export * from './common';
export {
    renderDefaultTrack,
    ensureDefaultTrackDom,
    updateDefaultTrack,
    getTrackViewBox
} from './bezier-slider';

export interface BezierSliderProps extends BezierSliderSharedProps {
    /** 绘制滑轨；默认内置 renderDefaultTrack，传 null 关闭 */
    renderTrack?: ((container: HTMLElement, layout: LayoutState) => void) | null;
    rootClass?: string | string[] | Record<string, boolean>;
    rootStyle?: string | Record<string, string | number> | Array<string | Record<string, string | number>>;
}

export interface BezierSliderExposed extends BezierSliderInstanceMethods {
    getInstance(): BezierSliderNative | null;
}

export interface BezierSliderEmits {
    (e: 'select', icon: NormalizedIcon, index: number): void;
    (e: 'slideEnd', index: number): void;
    (e: 'slide-end', index: number): void;
    (e: 'dragStart'): void;
    (e: 'drag-start'): void;
    (e: 'dragMove', payload: DragPayload): void;
    (e: 'drag-move', payload: DragPayload): void;
}

export declare const BezierSlider: DefineComponent<
    BezierSliderProps,
    BezierSliderExposed,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    BezierSliderEmits
>;

export default BezierSlider;
