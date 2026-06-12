export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function setByPath(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] == null) cur[keys[i]] = {};
        cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
}

export function createDefaultParams(defaults) {
    return {
        centerT: defaults.centerT,
        tStep: defaults.tStep,
        trackScale: defaults.trackScale,
        initialIndex: defaults.initialIndex,
        visibleIconCount: defaults.visibleIconCount,
        sensitivity: defaults.sensitivity,
        snapDuration: defaults.snapDuration,
        rubberBandLimit: defaults.rubberBandLimit,
        rubberBandDuration: defaults.rubberBandDuration,
        fadeEnabled: defaults.fadeEnabled,
        centerGlowEnabled: defaults.centerGlowEnabled,
        bezier: deepClone(defaults.bezier)
    };
}

export function buildSliderConfig(params) {
    return {
        centerT: params.centerT,
        tStep: params.tStep,
        trackScale: params.trackScale,
        initialIndex: Math.round(params.initialIndex),
        visibleIconCount: Math.round(params.visibleIconCount),
        sensitivity: params.sensitivity,
        snapDuration: Math.round(params.snapDuration),
        rubberBandLimit: params.rubberBandLimit,
        rubberBandDuration: Math.round(params.rubberBandDuration),
        fadeEnabled: params.fadeEnabled,
        centerGlowEnabled: params.centerGlowEnabled,
        bezier: deepClone(params.bezier)
    };
}

export function paramFieldId(path) {
    return `param-${path.replace(/\./g, '-')}`;
}

export function syncParamsForm(paramsForm, params, schema) {
    if (!paramsForm) return;

    schema.forEach((field) => {
        const id = paramFieldId(field.path);
        const input = paramsForm.querySelector(`#${id}`);
        const output = paramsForm.querySelector(`output[for="${id}"]`);
        if (!input) return;

        const val = getByPath(params, field.path);
        input.value = val;
        if (output) output.textContent = String(val);
    });

    const fadeEl = paramsForm.querySelector('#param-fadeEnabled');
    if (fadeEl) fadeEl.checked = params.fadeEnabled;

    const centerGlowEl = paramsForm.querySelector('#param-centerGlowEnabled');
    if (centerGlowEl) centerGlowEl.checked = params.centerGlowEnabled;
}
