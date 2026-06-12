import { BezierSlider, renderDefaultTrack } from '../src/index.js';
import { ICONS, MODE_DESC, PARAM_SCHEMA, RESET_ICON_SVG, COPY_ICON_SVG } from './shared/constants.js';
import {
    createDefaultParams,
    buildSliderConfig,
    deepClone,
    setByPath,
    syncParamsForm
} from './shared/param-utils.js';
import { bindParamsPanel } from './shared/params-panel.js';
import { bindGeometryPresetBar } from './shared/geometry-preset-bar.js';
import { bindCopyButton, bindResetButton } from './shared/clipboard.js';
import { CODE_FORMATTERS } from './shared/format-code.js';
import {
    applyComposeLayout,
    fitDefaultSvgSize,
    fitImageDisplaySize,
    getDisplaySizeHint
} from './shared/container-size.js';
import {
    applyBgLayer,
    clearBgLayer,
    clearTrackArtifacts,
    DEFAULT_BG_NATURAL,
    loadImageNaturalSize,
    readImageFile,
    updateDebugTrack
} from './shared/track-helpers.js';

const MAX_BG_FILE_SIZE = 5 * 1024 * 1024;

document.getElementById('paramsReset').innerHTML = RESET_ICON_SVG;
document.getElementById('codeCopyBtn').innerHTML = `${COPY_ICON_SVG}复制`;

document.addEventListener('DOMContentLoaded', () => {
    const sliderCompose = document.getElementById('sliderCompose');
    const carouselBg = document.getElementById('carouselBg');
    const sliderMount = document.getElementById('sliderMount');
    const selectedIcon = document.getElementById('selectedIcon');
    const selectedName = document.getElementById('selectedName');
    const modeDesc = document.getElementById('modeDesc');
    const bgOptions = document.getElementById('bgOptions');
    const bgUpload = document.getElementById('bgUpload');
    const bgFileName = document.getElementById('bgFileName');
    const bgSizeHint = document.getElementById('bgSizeHint');
    const bgReset = document.getElementById('bgReset');
    const debugOption = document.getElementById('debugOption');
    const showDebugTrack = document.getElementById('showDebugTrack');
    const legendExtra = document.getElementById('legendExtra');
    const legendCenterT = document.getElementById('legendCenterT');
    const tabButtons = document.querySelectorAll('.mode-tabs button');
    const codeTabButtons = document.querySelectorAll('#codeTabs button');
    const paramsForm = document.getElementById('paramsForm');
    const codeContent = document.getElementById('codeContent');
    const codeCopyBtn = document.getElementById('codeCopyBtn');
    const paramsReset = document.getElementById('paramsReset');
    const geometryPresetBar = document.getElementById('geometryPresetBar');

    let slider = null;
    let currentMode = 'svg';
    let currentCodeTab = 'native';
    let params = createDefaultParams(BezierSlider.DEFAULTS);
    let rebuildTimer = null;
    let customBgUrl = null;
    let customBgName = '';
    let bgNaturalSize = { ...DEFAULT_BG_NATURAL };
    let displaySize = fitDefaultSvgSize();

    function getActiveBgUrl() {
        return customBgUrl;
    }

    function updateBgSizeHint() {
        if (!bgSizeHint) return;
        const hint = getDisplaySizeHint(displaySize, params.trackScale);
        if (currentMode === 'bg') {
            bgSizeHint.textContent = `背景 ${hint.width}×${hint.height}px · 滑轨容器 ${hint.trackWidth}×${hint.trackHeight}px（trackScale=${hint.trackScale}）`;
        } else {
            bgSizeHint.textContent = '';
        }
    }

    function applyDisplayLayout() {
        applyComposeLayout(sliderCompose, carouselBg, sliderMount, displaySize, params.trackScale);
        updateBgSizeHint();
    }

    function getCodePreviewOptions() {
        const sizeHint = getDisplaySizeHint(displaySize, params.trackScale);
        return {
            trackMode: currentMode === 'bg' ? 'bg' : 'svg',
            displaySize: sizeHint
        };
    }

    function updateParamsPreview() {
        const formatter = CODE_FORMATTERS[currentCodeTab] ?? CODE_FORMATTERS.native;
        codeContent.textContent = formatter(params, getCodePreviewOptions());
        legendCenterT.textContent = `centerT = ${params.centerT}`;
    }

    function setCodeTab(tab) {
        currentCodeTab = tab;
        codeTabButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.code === tab);
        });
        updateParamsPreview();
    }

    function refreshBgOverlays() {
        if (currentMode !== 'bg' || !slider) return;
        const layout = slider.getLayoutState();
        updateDebugTrack(sliderMount, layout, showDebugTrack.checked, BezierSlider);
    }

    async function resolveBgNaturalSize(url) {
        if (!url) return { ...DEFAULT_BG_NATURAL };
        try {
            return await loadImageNaturalSize(url);
        } catch {
            return { ...DEFAULT_BG_NATURAL };
        }
    }

    async function applyBackground(url, fileName = '') {
        customBgUrl = url;
        customBgName = fileName;
        bgFileName.textContent = fileName || '内置示例背景';
        bgReset.classList.toggle('hidden', !url);

        if (currentMode === 'bg') {
            bgNaturalSize = await resolveBgNaturalSize(url);
            displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
            applyDisplayLayout();
            applyBgLayer(carouselBg, url);
            if (slider) {
                refreshBgOverlays();
            } else {
                createSlider('bg', false);
            }
        }
    }

    function createSlider(mode, keepIndex) {
        const prevIndex = keepIndex && slider ? slider.getCurrentIndex() : params.initialIndex;

        slider?.destroy();
        clearTrackArtifacts(sliderMount);

        const isBgMode = mode === 'bg';

        if (isBgMode) {
            displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
            applyDisplayLayout();
            applyBgLayer(carouselBg, getActiveBgUrl());
        } else {
            clearBgLayer(carouselBg);
            displaySize = fitDefaultSvgSize();
            applyDisplayLayout();
        }

        slider = new BezierSlider({
            container: sliderMount,
            icons: ICONS,
            ...buildSliderConfig(params),
            trackScale: 1,
            onSelect: (icon) => {
                selectedIcon.textContent = icon.emoji;
                selectedName.textContent = icon.name;
            },
            onSlideEnd: (index) => console.log('停留下标:', index),
            onLayout: (layout) => {
                if (isBgMode) {
                    updateDebugTrack(sliderMount, layout, showDebugTrack.checked, BezierSlider);
                } else {
                    renderDefaultTrack(sliderMount, layout);
                }
            }
        });

        if (keepIndex) {
            slider.slideTo(prevIndex, false);
        }
    }

    function scheduleRebuild() {
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(() => {
            updateParamsPreview();
            createSlider(currentMode, true);
        }, 80);
    }

    function handleParamChange(path, value) {
        if (path === 'fadeEnabled' || path === 'centerGlowEnabled') {
            params[path] = value;
        } else {
            setByPath(params, path, value);
        }

        if (path === 'trackScale') {
            applyDisplayLayout();
            updateParamsPreview();
            slider?.initLayout();
            return;
        }

        scheduleRebuild();
    }

    function handleReset() {
        params = createDefaultParams(BezierSlider.DEFAULTS);
        syncParamsForm(paramsForm, params, PARAM_SCHEMA);
        scheduleRebuild();
    }

    function handleGeometryPreset(preset) {
        params.bezier = deepClone(preset.bezier);
        syncParamsForm(paramsForm, params, PARAM_SCHEMA);
        scheduleRebuild();
    }

    function setMode(mode) {
        currentMode = mode;
        tabButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        modeDesc.textContent = MODE_DESC[mode];
        bgOptions.classList.toggle('hidden', mode !== 'bg');
        debugOption.classList.toggle('hidden', mode !== 'bg');
        legendExtra.textContent = mode === 'bg'
            ? (customBgUrl ? '自定义背景 + bezier 对齐' : '背景图 + bezier 对齐')
            : '';
        updateParamsPreview();
        createSlider(mode, false);
    }

    const unbindPanel = bindParamsPanel(paramsForm, {
        getParams: () => params,
        onParamChange: handleParamChange,
        schema: PARAM_SCHEMA
    });
    const unbindGeometryBar = bindGeometryPresetBar(geometryPresetBar, {
        onPreset: handleGeometryPreset
    });
    const unbindReset = bindResetButton(paramsReset, handleReset);
    const unbindCopy = bindCopyButton(codeCopyBtn, () => codeContent.textContent);

    applyDisplayLayout();
    updateParamsPreview();

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    codeTabButtons.forEach((btn) => {
        btn.addEventListener('click', () => setCodeTab(btn.dataset.code));
    });

    bgUpload.addEventListener('change', async () => {
        const file = bgUpload.files?.[0];
        bgUpload.value = '';
        if (!file) return;

        if (file.size > MAX_BG_FILE_SIZE) {
            window.alert('图片请小于 5MB');
            return;
        }

        try {
            const dataUrl = await readImageFile(file);
            await applyBackground(dataUrl, file.name);
        } catch (err) {
            window.alert(err.message || '上传失败');
        }
    });

    bgReset.addEventListener('click', async () => {
        bgNaturalSize = { ...DEFAULT_BG_NATURAL };
        await applyBackground(null);
    });

    showDebugTrack.addEventListener('change', () => {
        if (currentMode === 'bg' && slider) {
            updateDebugTrack(sliderMount, slider.getLayoutState(), showDebugTrack.checked, BezierSlider);
        }
    });

    window.addEventListener('resize', () => {
        if (currentMode === 'bg') {
            displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
        } else {
            displaySize = fitDefaultSvgSize();
        }
        applyDisplayLayout();
        slider?.initLayout();
        updateParamsPreview();
    });

    setMode('svg');

    window.addEventListener('beforeunload', () => {
        unbindPanel();
        unbindGeometryBar();
        unbindReset();
        unbindCopy();
        slider?.destroy();
    });
});
