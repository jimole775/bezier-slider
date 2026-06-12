import { COPY_ICON_SVG, COPIED_ICON_SVG } from './constants.js';

export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

export function bindCopyButton(btn, getText) {
    if (!btn) return () => {};

    const handleCopy = async () => {
        const success = await copyToClipboard(getText());
        if (!success) return;

        btn.classList.add('copied');
        btn.innerHTML = `${COPIED_ICON_SVG}已复制`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `${COPY_ICON_SVG}复制`;
        }, 2000);
    };

    btn.addEventListener('click', handleCopy);
    return () => btn.removeEventListener('click', handleCopy);
}

export function bindResetButton(btn, onReset) {
    if (!btn) return () => {};
    btn.addEventListener('click', onReset);
    return () => btn.removeEventListener('click', onReset);
}

export function bindCodePreview(codeEl, getText) {
    if (!codeEl) return () => {};

    const update = () => {
        codeEl.textContent = getText();
    };

    update();
    return update;
}
