import { GEOMETRY_PRESETS } from './geometry-presets.js';

export function bindGeometryPresetBar(container, {
    presets = GEOMETRY_PRESETS,
    onPreset
} = {}) {
    if (!container || typeof onPreset !== 'function') {
        return () => {};
    }

    container.innerHTML = '';
    presets.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'geometry-preset-btn';
        btn.dataset.preset = preset.id;
        btn.textContent = preset.label;
        btn.addEventListener('click', () => onPreset(preset));
        container.appendChild(btn);
    });

    return () => {
        container.innerHTML = '';
    };
}
