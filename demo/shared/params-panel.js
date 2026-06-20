import { PARAM_SCHEMA } from './constants.js';
import { getByPath, paramFieldId } from './param-utils.js';
import { parseControlPointPath } from './track-helpers.js';

function parseParamValue(raw, field) {
    const num = Number(raw);
    return field.step >= 1 ? Math.round(num) : num;
}

function clampParamValue(value, field) {
    const num = parseParamValue(value, field);
    return Math.min(field.max, Math.max(field.min, num));
}

function formatParamOutput(value, field) {
    const num = parseParamValue(value, field);
    if (field.step >= 1) return String(num);
    const stepText = String(field.step);
    const decimals = stepText.includes('.') ? stepText.split('.')[1].length : 0;
    return String(Number(num.toFixed(decimals)));
}

function applyParamInput(input, output, field, value, onParamChange) {
    const num = clampParamValue(value, field);
    input.value = String(num);
    output.textContent = formatParamOutput(num, field);
    onParamChange(field.path, num);
}

const STEP_HOLD_DELAY_MS = 400;
const STEP_REPEAT_INTERVAL_MS = 80;

function bindStepButtonHold(btn, stepOnce, { onHoldStart, onHoldEnd } = {}) {
    let delayTimer = null;
    let repeatTimer = null;
    let holding = false;

    const clearTimers = () => {
        if (delayTimer != null) {
            clearTimeout(delayTimer);
            delayTimer = null;
        }
        if (repeatTimer != null) {
            clearInterval(repeatTimer);
            repeatTimer = null;
        }
    };

    const stopHold = () => {
        if (!holding) return;
        holding = false;
        clearTimers();
        onHoldEnd?.();
    };

    btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        btn.setPointerCapture(event.pointerId);
        holding = true;
        onHoldStart?.();
        stepOnce();
        clearTimers();
        delayTimer = setTimeout(() => {
            repeatTimer = setInterval(stepOnce, STEP_REPEAT_INTERVAL_MS);
        }, STEP_HOLD_DELAY_MS);
    });

    btn.addEventListener('pointerup', stopHold);
    btn.addEventListener('pointercancel', stopHold);
    btn.addEventListener('lostpointercapture', stopHold);
}

export function bindParamsPanel(paramsForm, {
    getParams,
    onParamChange,
    onControlPointAdjustStart,
    onControlPointAdjustEnd,
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
            <div class="param-stepper">
                <button type="button" class="param-step-btn" data-step="-1" aria-label="${field.label} 减小">−</button>
                <input type="range" id="${id}" min="${field.min}" max="${field.max}" step="${field.step}" value="${val}" />
                <button type="button" class="param-step-btn" data-step="1" aria-label="${field.label} 增大">+</button>
            </div>
            <output for="${id}">${formatParamOutput(val, field)}</output>
        `;

        const input = row.querySelector('input');
        const output = row.querySelector('output');
        const stepButtons = row.querySelectorAll('.param-step-btn');

        input.addEventListener('input', () => {
            applyParamInput(input, output, field, input.value, onParamChange);
        });

        const controlHint = parseControlPointPath(field.path);

        stepButtons.forEach((btn) => {
            const delta = Number(btn.dataset.step) * field.step;
            const stepOnce = () => {
                applyParamInput(input, output, field, Number(input.value) + delta, onParamChange);
            };

            const holdCallbacks = controlHint
                ? {
                    onHoldStart: () => onControlPointAdjustStart?.(controlHint),
                    onHoldEnd: () => onControlPointAdjustEnd?.()
                }
                : {};

            bindStepButtonHold(btn, stepOnce, holdCallbacks);
        });

        if (controlHint) {
            row.classList.add('param-row-cp');
            row.dataset.controlPoint = controlHint.point;
            row.dataset.controlAxis = controlHint.axis;

            const startControlAdjust = () => {
                onControlPointAdjustStart?.(controlHint);
                window.addEventListener('pointerup', () => {
                    onControlPointAdjustEnd?.();
                }, { once: true });
            };

            input.addEventListener('pointerdown', startControlAdjust);
        }

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
