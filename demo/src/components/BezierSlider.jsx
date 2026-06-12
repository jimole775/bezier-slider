import {
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useRef
} from 'react';
import { getConfigKey, mountNativeSliderWhenReady } from '../native-bridge.js';

/** 从 props 提取传给 native 核心的配置项（跳过 undefined，避免覆盖默认值） */
export { getConfigKey, pickNativeOptions } from '../native-bridge.js';

/** 永不 re-render，防止 React 清空 native 插入的 DOM 子节点 */
const ImperativeMount = memo(
    forwardRef(function ImperativeMount(_props, ref) {
        return (
            <div
                ref={ref}
                className="bezier-slider-mount"
                style={{ width: '100%', height: '100%', position: 'relative' }}
            />
        );
    }),
    () => true
);

ImperativeMount.displayName = 'ImperativeMount';

/**
 * React 薄封装：内部使用 native BezierSlider，滑轨由 renderTrack / onLayout 负责。
 */
const BezierSlider = forwardRef(function BezierSlider(props, ref) {
    const { className, style } = props;
    const mountRef = useRef(null);
    const controllerRef = useRef(null);
    const propsRef = useRef(props);
    propsRef.current = props;

    const configKey = getConfigKey(props);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const current = propsRef.current;

        controllerRef.current = mountNativeSliderWhenReady(container, current, {
            onSelect: (...args) => propsRef.current.onSelect?.(...args),
            onSlideEnd: (...args) => propsRef.current.onSlideEnd?.(...args),
            onLayout: (layout) => propsRef.current.onLayout?.(layout),
            renderTrack: current.renderTrack
        });

        return () => {
            controllerRef.current?.destroy();
            controllerRef.current = null;
        };
    }, [configKey]);

    useImperativeHandle(ref, () => ({
        slideTo(index, animate = true) {
            controllerRef.current?.getInstance()?.slideTo(index, animate);
        },
        getCurrentIndex() {
            return controllerRef.current?.getInstance()?.getCurrentIndex() ?? 0;
        },
        getLayoutState() {
            return controllerRef.current?.getInstance()?.getLayoutState();
        },
        getInstance() {
            return controllerRef.current?.getInstance() ?? null;
        }
    }), [configKey]);

    return (
        <div className={className} style={style}>
            <ImperativeMount ref={mountRef} />
        </div>
    );
});

BezierSlider.displayName = 'BezierSlider';

export default BezierSlider;
