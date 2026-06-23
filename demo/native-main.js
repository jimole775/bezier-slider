import { BezierSlider } from '../src/index.js';
import { ICONS, PARAM_SCHEMA, RESET_ICON_SVG, COPY_ICON_SVG } from './shared/constants.js';
import {
    createDefaultParams,
    buildSliderConfig,
    deepClone,
    setByPath,
    syncParamsForm
} from './shared/param-utils.js';
import { bindParamsPanel } from './shared/params-panel.js';
import { bindGeometryPresetBar } from './shared/geometry-preset-bar.js';
import {
    buildPresetSnapshot,
    removeSavedPreset,
    savePresetSnapshot
} from './shared/saved-presets.js';
import { bindCopyButton, bindResetButton } from './shared/clipboard.js';
import { getCodeFormatter } from './shared/format-code.js';
import { getCodeTabLanguage, getPlainCodeText, renderHighlightedCode } from './shared/code-highlight.js';
import {
    applyComposeLayout,
    fitImageDisplaySize,
    getDisplaySizeHint
} from './shared/container-size.js';
import {
    applyBgLayer,
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
    const bgUpload = document.getElementById('bgUpload');
    const bgFileName = document.getElementById('bgFileName');
    const bgSizeHint = document.getElementById('bgSizeHint');
    const bgReset = document.getElementById('bgReset');
    const showDebugTrack = document.getElementById('showDebugTrack');
    const legendExtra = document.getElementById('legendExtra');
    const legendCenterT = document.getElementById('legendCenterT');
    const codeTabButtons = document.querySelectorAll('#codeTabs button');
    const codeLangToggle = document.getElementById('codeLangToggle');
    const paramsForm = document.getElementById('paramsForm');
    const codeContent = document.getElementById('codeContent');
    const codeCopyBtn = document.getElementById('codeCopyBtn');
    const paramsReset = document.getElementById('paramsReset');
    const paramsSave = document.getElementById('paramsSave');
    const geometryPresetBar = document.getElementById('geometryPresetBar');

    let slider = null;
    let currentCodeTab = 'html';
    let currentCodeLang = 'js';
    let params = createDefaultParams(BezierSlider.DEFAULTS);
    let rebuildTimer = null;
    let customBgUrl = null;
    let bgNaturalSize = { ...DEFAULT_BG_NATURAL };
    let displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
    let activeControl = null;

    function refreshDebugOverlay() {
        if (!slider) return;
        updateDebugTrack(
            sliderMount,
            slider.getLayoutState(),
            showDebugTrack.checked,
            BezierSlider,
            activeControl
        );
    }

    function setActiveControl(hint) {
        activeControl = hint;
        refreshDebugOverlay();
        paramsForm.querySelectorAll('.param-row-cp').forEach((row) => {
            const match = activeControl
                && row.dataset.controlPoint === activeControl.point
                && row.dataset.controlAxis === activeControl.axis;
            row.classList.toggle('is-adjusting', Boolean(match));
        });
    }

    function getActiveBgUrl() {
        return customBgUrl;
    }

    function updateLegendExtra() {
        legendExtra.textContent = customBgUrl ? '自定义背景 + bezier 对齐' : '背景图 + bezier 对齐';
    }

    function updateBgSizeHint() {
        if (!bgSizeHint) return;
        const hint = getDisplaySizeHint(displaySize, params.trackScale);
        bgSizeHint.textContent = `背景 ${hint.width}×${hint.height}px · 滑轨容器 ${hint.trackWidth}×${hint.trackHeight}px（trackScale=${hint.trackScale}）`;
    }

    function applyDisplayLayout() {
        applyComposeLayout(sliderCompose, carouselBg, sliderMount, displaySize, params.trackScale);
        updateBgSizeHint();
    }

    function getCodePreviewOptions() {
        return {
            displaySize: getDisplaySizeHint(displaySize, params.trackScale)
        };
    }

    function updateParamsPreview() {
        const formatter = getCodeFormatter(currentCodeTab, currentCodeLang);
        const source = formatter(params, getCodePreviewOptions());
        renderHighlightedCode(codeContent, source, getCodeTabLanguage(currentCodeTab, currentCodeLang));
        legendCenterT.textContent = `centerT = ${params.centerT}`;
    }

    function setCodeTab(tab) {
        currentCodeTab = tab;
        codeTabButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.code === tab);
        });
        updateParamsPreview();
    }

    function setCodeLang(lang) {
        currentCodeLang = lang;
        if (codeLangToggle) {
            codeLangToggle.checked = lang === 'ts';
        }
        updateParamsPreview();
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
        bgFileName.textContent = fileName || '内置示例背景';
        bgReset.classList.toggle('hidden', !url);
        updateLegendExtra();

        bgNaturalSize = await resolveBgNaturalSize(url);
        displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
        applyDisplayLayout();
        applyBgLayer(carouselBg, url);
        if (slider) {
            slider.initLayout();
        } else {
            createSlider(false);
        }
    }

    function createSlider(keepIndex) {
        const prevIndex = keepIndex && slider ? slider.getCurrentIndex() : params.initialIndex;

        slider?.destroy();
        clearTrackArtifacts(sliderMount);

        displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
        applyDisplayLayout();
        applyBgLayer(carouselBg, getActiveBgUrl());

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
                updateDebugTrack(sliderMount, layout, showDebugTrack.checked, BezierSlider, activeControl);
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
            createSlider(true);
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

    async function applySavedPreset(preset) {
        params = deepClone(preset.params);
        syncParamsForm(paramsForm, params, PARAM_SCHEMA);

        if (preset.bgUrl) {
            bgNaturalSize = { ...preset.bgNaturalSize };
            await applyBackground(preset.bgUrl, preset.bgFileName || '已存背景');
        } else {
            bgNaturalSize = preset.bgNaturalSize
                ? { ...preset.bgNaturalSize }
                : { ...DEFAULT_BG_NATURAL };
            await applyBackground(null);
        }

        updateParamsPreview();
        createSlider(true);
    }

    function handleDeleteSavedPreset(preset) {
        removeSavedPreset(preset.id);
        geometryBarApi.refresh();
    }

    function handleSavePreset() {
        const defaultLabel = customBgUrl
            ? (bgFileName.textContent || '我的配置')
            : `配置 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const label = window.prompt('为当前配置命名', defaultLabel);
        if (label == null || !label.trim()) return;

        try {
            const snapshot = buildPresetSnapshot({
                label: label.trim(),
                params,
                bgUrl: customBgUrl,
                bgFileName: bgFileName.textContent,
                bgNaturalSize
            });
            savePresetSnapshot(snapshot);
            geometryBarApi.refresh();

            if (snapshot.bgOmitted && customBgUrl) {
                window.alert('配置已保存。背景图过大未写入本地，加载该预设后请重新上传背景图。');
            }
        } catch (err) {
            window.alert(err.message || '保存失败');
        }
    }

    const unbindPanel = bindParamsPanel(paramsForm, {
        getParams: () => params,
        onParamChange: handleParamChange,
        onControlPointAdjustStart: setActiveControl,
        onControlPointAdjustEnd: () => setActiveControl(null),
        schema: PARAM_SCHEMA
    });
    const geometryBarApi = bindGeometryPresetBar(geometryPresetBar, {
        onPreset: handleGeometryPreset,
        onSavedPreset: applySavedPreset,
        onDeleteSaved: handleDeleteSavedPreset
    });
    const unbindReset = bindResetButton(paramsReset, handleReset);
    paramsSave?.addEventListener('click', handleSavePreset);
    const unbindCopy = bindCopyButton(codeCopyBtn, () => getPlainCodeText(codeContent));

    applyDisplayLayout();
    applyBgLayer(carouselBg, null);
    updateLegendExtra();
    updateParamsPreview();
    createSlider(false);

    codeTabButtons.forEach((btn) => {
        btn.addEventListener('click', () => setCodeTab(btn.dataset.code));
    });

    codeLangToggle?.addEventListener('change', () => {
        setCodeLang(codeLangToggle.checked ? 'ts' : 'js');
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
        refreshDebugOverlay();
    });

    window.addEventListener('resize', () => {
        displaySize = fitImageDisplaySize(bgNaturalSize.width, bgNaturalSize.height);
        applyDisplayLayout();
        slider?.initLayout();
        updateParamsPreview();
    });

    window.addEventListener('beforeunload', () => {
        unbindPanel();
        geometryBarApi.destroy();
        unbindReset();
        unbindCopy();
        slider?.destroy();
    });
});
