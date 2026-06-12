import { PARAM_SCHEMA } from './constants.js';
import { getByPath, paramFieldId } from './param-utils.js';

export function bindParamsPanel(paramsForm, {
    getParams,
    onParamChange,
    schema = PARAM_SCHEMA,
    fadeSectionTitle = '动画',
    animationCheckboxes = [
        { path: 'fadeEnabled', id: 'param-fadeEnabled', label: '滑动渐隐效果' },
        { path: 'centerGlowEnabled', id: 'param-centerGlowEnabled', label: '当前图标高亮背光' }
    ]
} = {}) {
    if (!paramsForm) {
        return () => {};
    }

    const sections = new Map();

    schema.forEach((field) => {
        if (!sections.has(field.section)) {
            const wrap = document.createElement('div');
            wrap.className = 'param-section';
            wrap.innerHTML = `<div class="param-section-title">${field.section}</div>`;
            sections.set(field.section, wrap);
            paramsForm.appendChild(wrap);
        }

        const row = document.createElement('div');
        row.className = 'param-row';
        const id = paramFieldId(field.path);
        const val = getByPath(getParams(), field.path);

        row.innerHTML = `
            <label for="${id}">${field.label}</label>
            <input type="range" id="${id}" min="${field.min}" max="${field.max}" step="${field.step}" value="${val}" />
            <output for="${id}">${val}</output>
        `;

        const input = row.querySelector('input');
        const output = row.querySelector('output');

        input.addEventListener('input', () => {
            const num = field.step >= 1
                ? Math.round(Number(input.value))
                : Number(input.value);
            onParamChange(field.path, num);
            output.textContent = String(num);
        });

        sections.get(field.section).appendChild(row);
    });

    const fadeWrap = document.createElement('div');
    fadeWrap.className = 'param-section';
    fadeWrap.innerHTML = `<div class="param-section-title">${fadeSectionTitle}</div>`;
    animationCheckboxes.forEach(({ path, id, label }) => {
        const fadeLabel = document.createElement('label');
        fadeLabel.className = 'param-check';
        fadeLabel.innerHTML = `<input type="checkbox" id="${id}" ${getParams()[path] ? 'checked' : ''} /> ${label}`;
        fadeLabel.querySelector('input').addEventListener('change', (e) => {
            onParamChange(path, e.target.checked);
        });
        fadeWrap.appendChild(fadeLabel);
    });
    paramsForm.appendChild(fadeWrap);

    return () => {
        paramsForm.innerHTML = '';
    };
}
