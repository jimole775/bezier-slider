import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type {
    BezierSliderInstanceMethods,
    BezierSliderSharedProps,
    DragPayload,
    LayoutState,
    NormalizedIcon
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
    className?: string;
    style?: import('react').CSSProperties;
    renderTrack?: (container: HTMLElement, layout: LayoutState) => void;
    onLayout?: (layout: LayoutState) => void;
    onSelect?: (icon: NormalizedIcon, index: number) => void;
    onSlideEnd?: (index: number) => void;
    onDragStart?: () => void;
    onDragMove?: (payload: DragPayload) => void;
}

export interface BezierSliderHandle extends BezierSliderInstanceMethods {
    getInstance(): BezierSliderNative | null;
}

export declare const BezierSlider: ForwardRefExoticComponent<
    BezierSliderProps & RefAttributes<BezierSliderHandle>
>;

export function pickNativeOptions(source: BezierSliderSharedProps): BezierSliderSharedProps;

export function getConfigKey(source: BezierSliderSharedProps): string;

export default BezierSlider;
