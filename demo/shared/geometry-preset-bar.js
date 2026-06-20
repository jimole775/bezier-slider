import { GEOMETRY_PRESETS } from './geometry-presets.js';
import { DELETE_ICON_SVG } from './constants.js';
import { loadSavedPresets } from './saved-presets.js';
export function bindGeometryPresetBar(container, {
    presets = GEOMETRY_PRESETS,
    getSavedPresets = loadSavedPresets,
    onPreset,
    onSavedPreset,
    onDeleteSaved
} = {}) {
    if (!container) {
        return { refresh() {}, destroy() {} };
    }

    const render = () => {
        container.innerHTML = '';

        presets.forEach((preset) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'geometry-preset-btn';
            btn.dataset.preset = preset.id;
            btn.textContent = preset.label;
            btn.addEventListener('click', () => onPreset?.(preset));
            container.appendChild(btn);
        });

        const savedList = typeof getSavedPresets === 'function' ? getSavedPresets() : [];
        if (savedList.length === 0) {
            return;
        }

        const divider = document.createElement('span');
        divider.className = 'geometry-preset-divider';
        divider.setAttribute('aria-hidden', 'true');
        container.appendChild(divider);

        savedList.forEach((preset) => {
            const wrap = document.createElement('div');
            wrap.className = 'geometry-preset-saved-item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'geometry-preset-btn geometry-preset-btn-saved';
            btn.dataset.preset = preset.id;
            btn.textContent = preset.label;
            btn.title = preset.bgOmitted
                ? '点击加载（背景图未存入，需重新上传）'
                : '点击加载';
            btn.addEventListener('click', () => onSavedPreset?.(preset));

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'geometry-preset-delete';
            deleteBtn.innerHTML = DELETE_ICON_SVG;
            deleteBtn.setAttribute('aria-label', `删除 ${preset.label}`);
            deleteBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteSaved?.(preset);
            });

            wrap.appendChild(btn);
            wrap.appendChild(deleteBtn);
            container.appendChild(wrap);
        });    };

    render();

    return {
        refresh: render,
        destroy() {
            container.innerHTML = '';
        }
    };
}
