import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);

const CODE_TAB_LANGUAGES = {
    html: 'html',
    react: 'javascript',
    vue: 'xml',
    mp: 'xml'
};

const CODE_TAB_LANGUAGES_TS = {
    html: 'typescript',
    react: 'typescript',
    vue: 'xml',
    mp: 'xml'
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

export function getCodeTabLanguage(tab, lang = 'js') {
    const map = lang === 'ts' ? CODE_TAB_LANGUAGES_TS : CODE_TAB_LANGUAGES;
    return map[tab] ?? (lang === 'ts' ? 'typescript' : 'javascript');
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
