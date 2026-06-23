import type {
    BezierFitted,
    BezierPoint,
    BezierSliderInstanceMethods,
    BezierSliderOptions,
    IconContent,
    LayoutState,
    NormalizedIcon,
    SliderIconInput,
    TrackRenderOptions
} from './common';

export * from './common';

declare class BezierSlider implements BezierSliderInstanceMethods {
    constructor(options: BezierSliderOptions);

    static readonly DEFAULTS: Required<Omit<BezierSliderOptions, 'container'>> & {
        container?: never;
    };

    static resolveIconContent(icon: SliderIconInput | string | number, index: number): IconContent;
    static renderIconContent(iconData: NormalizedIcon): HTMLElement;
    static bezierPath(curve: BezierFitted, fillToY?: number): string;
    static pointOnCurve(t: number, curve: BezierFitted): BezierPoint;
}

export function getTrackViewBox(layout: LayoutState): string;

export function ensureDefaultTrackDom(
    container: HTMLElement,
    options?: TrackRenderOptions
): boolean;

export function updateDefaultTrack(
    container: HTMLElement,
    layout: LayoutState,
    selectors?: TrackRenderOptions['selectors']
): void;

export function renderDefaultTrack(
    container: HTMLElement,
    layout: LayoutState,
    options?: TrackRenderOptions
): void;

export default BezierSlider;
