import { getConfigKey, mountNativeSliderWhenReady } from '../native-bridge.js';
import { renderDefaultTrack } from '../track-renderer.js';

const DEFAULT_ICONS = [
    { name: '首页', emoji: '🏠', color: '#8b5cf6' },
    { name: '搜索', emoji: '🔍', color: '#ec4899' },
    { name: '消息', emoji: '💬', color: '#06b6d4' },
    { name: '设置', emoji: '⚙️', color: '#22c55e' }
];

const BezierSliderVue2 = {
    name: 'BezierSlider',
    props: {
        icons: {
            type: Array,
            default: () => DEFAULT_ICONS
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
        renderTrack: {
            type: Function,
            default: undefined
        },
        rootClass: [String, Array, Object],
        rootStyle: [String, Object, Array]
    },
    data() {
        return {
            controller: null
        };
    },
    computed: {
        configKey() {
            return getConfigKey(this.$props);
        }
    },
    watch: {
        configKey() {
            this.$nextTick(() => {
                this.mountSlider();
            });
        }
    },
    mounted() {
        this.mountSlider();
    },
    beforeDestroy() {
        this.destroySlider();
    },
    methods: {
        resolveRenderTrack() {
            if (this.renderTrack === null) {
                return null;
            }
            return this.renderTrack !== undefined ? this.renderTrack : renderDefaultTrack;
        },
        destroySlider() {
            this.controller?.destroy();
            this.controller = null;
        },
        mountSlider() {
            const container = this.$refs.mountRef;
            if (!container) return;

            this.destroySlider();

            this.controller = mountNativeSliderWhenReady(container, this.$props, {
                onSelect: (icon, index) => this.$emit('select', icon, index),
                onSlideEnd: (index) => this.$emit('slide-end', index),
                onLayout: null,
                renderTrack: this.resolveRenderTrack()
            });
        },
        slideTo(index, animate = true) {
            this.controller?.getInstance()?.slideTo(index, animate);
        },
        getCurrentIndex() {
            return this.controller?.getInstance()?.getCurrentIndex() ?? 0;
        },
        getLayoutState() {
            return this.controller?.getInstance()?.getLayoutState();
        },
        getInstance() {
            return this.controller?.getInstance() ?? null;
        }
    },
    render(h) {
        return h('div', {
            ref: 'mountRef',
            staticClass: 'bezier-slider-root',
            class: this.rootClass,
            style: [{ position: 'relative', overflow: 'hidden' }, this.rootStyle]
        });
    }
};

export default BezierSliderVue2;
