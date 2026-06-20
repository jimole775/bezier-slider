import { deepClone } from './param-utils.js';

export const SAVED_PRESETS_STORAGE_KEY = 'bezier-slider-demo-saved-presets';
const MAX_SAVED_COUNT = 16;
const MAX_BG_DATA_URL_LENGTH = 900_000;

export function loadSavedPresets() {
    try {
        const raw = localStorage.getItem(SAVED_PRESETS_STORAGE_KEY);
        if (!raw) return [];
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeSavedPresets(list) {
    localStorage.setItem(SAVED_PRESETS_STORAGE_KEY, JSON.stringify(list));
}

export function removeSavedPreset(id) {
    const next = loadSavedPresets().filter((item) => item.id !== id);
    writeSavedPresets(next);
    return next;
}

export function buildPresetSnapshot({
    label,
    params,
    bgUrl,
    bgFileName,
    bgNaturalSize
}) {
    const includeBg = typeof bgUrl === 'string'
        && bgUrl.length > 0
        && bgUrl.length <= MAX_BG_DATA_URL_LENGTH;

    return {
        id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: label.trim(),
        savedAt: Date.now(),
        params: deepClone(params),
        bgUrl: includeBg ? bgUrl : null,
        bgFileName: includeBg ? (bgFileName || '') : '',
        bgNaturalSize: deepClone(bgNaturalSize),
        bgOmitted: Boolean(bgUrl && !includeBg)
    };
}

export function savePresetSnapshot(snapshot) {
    const list = loadSavedPresets();
    if (list.length >= MAX_SAVED_COUNT) {
        throw new Error(`最多保存 ${MAX_SAVED_COUNT} 个配置，请先点击快捷按钮右上角删除旧配置`);
    }

    list.push(snapshot);

    try {
        writeSavedPresets(list);
    } catch {
        throw new Error('保存失败：浏览器存储空间不足，请删除部分已存配置或减少背景图大小');
    }

    return list;
}
