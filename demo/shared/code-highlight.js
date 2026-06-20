import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);

const CODE_TAB_LANGUAGES = {
    native: 'html',
    react: 'javascript',
    vue: 'xml'
};

function ensureCodeElement(container) {
    let codeEl = container.querySelector('code');
    if (!codeEl) {
        container.textContent = '';
        codeEl = document.createElement('code');
        container.appendChild(codeEl);
    }
    return codeEl;
}

export function getCodeTabLanguage(tab) {
    return CODE_TAB_LANGUAGES[tab] ?? 'javascript';
}

export function renderHighlightedCode(container, source, language) {
    const codeEl = ensureCodeElement(container);
    const lang = hljs.getLanguage(language) ? language : 'javascript';

    codeEl.removeAttribute('data-highlighted');
    codeEl.className = `hljs language-${lang}`;
    codeEl.textContent = source;

    if (source.trim()) {
        hljs.highlightElement(codeEl);
    }

    return source;
}

export function getPlainCodeText(container) {
    return container.querySelector('code')?.textContent ?? container.textContent ?? '';
}
