import './bezier-slider.native.js';

const BezierSlider = globalThis.BezierSlider;

export { BezierSlider };
export {
    ensureDefaultTrackDom,
    updateDefaultTrack,
    renderDefaultTrack
} from './track-renderer.js';
export default BezierSlider;
