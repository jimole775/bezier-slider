import BezierSliderMp from './mp/BezierSliderMp.vue';
import { BezierSliderEngine } from './core/slider-engine.js';
import { drawDefaultTrackOnCanvas } from './mp/track-canvas.js';

export { BezierSliderMp as BezierSlider };
export { BezierSliderEngine, drawDefaultTrackOnCanvas };
export default BezierSliderMp;
