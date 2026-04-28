/**
 * HTML Cleaner for Google Docs
 * Specifically tailored for simplified "Specific" HTML output
 */

const REGEX = {
    BODY: /<body[^>]*>([\s\S]*)<\/body>/i,
    METADATA: /<!--StartFragment-->|<!--EndFragment-->|<meta[^>]*>/gi,
    STYLED_SPAN: /<span\b([^>]*)>(.*?)<\/span>/gis,
    STYLE_ATTRIBUTE: /style=(['"])(.*?)\1/i,
    FONT_WEIGHT_BOLD: /font-weight:\s*(bold|700)\b/i,
    WRAPPERS: /<\/?(span|div|section|article)[^>]*>/gi,
    TAG_ATTRIBUTES: /<([a-z1-6]+)\b[^>]*>/gi,
    P_OPEN: /<p>/gi,
    P_CLOSE: /<\/p>/gi,
    LIST_BR: /<br>\s*<\/li>/gi,
        BLOCK_TAGS_BEFORE: /(<br>\s*)+(?=<ol|<ul|<h[1-6]|<blockquote|<hr|<table)/gi,
        BLOCK_TAGS_AFTER: /(<\/ol>|<\/ul>|<\/h[1-6]>|<\/blockquote>|<\/table>|<hr>)\s*(<br>\s*)+/gi,
    NBSP: /&nbsp;/g,
    TRAILING_BR: /(<br>\s*)+$/gi,
    BR_SPACING: /\s*<br>\s*/gi
};

export class GoogleDocsCleaner {
    /**
     * Основной метод очистки
     * @param {string} dirtyHtml 
     * @param {Object} options
     * @returns {string}
     */
    static clean(dirtyHtml, options = {}) {
        let content = this._extractBody(dirtyHtml);
        content = this._removeMetadata(content);
        
        let cleaned = this._convertSemanticTags(content);
        cleaned = this._removeWrappers(cleaned, options.keepSpans);
        cleaned = this._stripAttributes(cleaned);
        cleaned = this._flattenParagraphs(cleaned);
        cleaned = this._finalCleanup(cleaned);
        
        return cleaned;
    }

    static _extractBody(html) {
        const match = html.match(REGEX.BODY);
        return match ? match[1] : html;
    }

    static _removeMetadata(html) {
        return html.replace(REGEX.METADATA, '');
    }

    static _convertSemanticTags(html) {
        return html.replace(REGEX.STYLED_SPAN, (match, attributes, content) => {
            const styleMatch = attributes.match(REGEX.STYLE_ATTRIBUTE);

            if (!styleMatch) {
                return match;
            }

            const style = styleMatch[2].toLowerCase();
            let result = content;

            if (style.includes('font-style:italic') || style.includes('font-style: italic')) {
                result = `<em>${result}</em>`;
            }

            if (REGEX.FONT_WEIGHT_BOLD.test(style)) {
                result = `<strong>${result}</strong>`;
            }

            if (style.includes('text-decoration:line-through') || style.includes('text-decoration: line-through')) {
                result = `<s>${result}</s>`;
            }

            return result;
        });
    }

    static _removeWrappers(html, keepSpans = false) {
        const pattern = keepSpans ? /<\/?(div|section|article)[^>]*>/gi : REGEX.WRAPPERS;
        return html.replace(pattern, '');
    }

    static _stripAttributes(html) {
        return html.replace(REGEX.TAG_ATTRIBUTES, (match, tagName) => {
            const tag = tagName.toLowerCase();
            if (tag === 'a') {
                const hrefMatch = match.match(/href=(["'])(.*?)\1/i);
                return hrefMatch ? `<a href="${hrefMatch[2]}">` : '<a>';
            }
            if (tag === 'img') {
                const srcMatch = match.match(/src=(["'])(.*?)\1/i);
                return srcMatch ? `<img src="${srcMatch[2]}">` : '<img>';
            }
            return `<${tag}>`;
        });
    }

    static _flattenParagraphs(html) {
        return html
            .replace(REGEX.P_OPEN, '')
            .replace(REGEX.P_CLOSE, '<br><br>');
    }

    static _finalCleanup(html) {
        return html
            .replace(REGEX.LIST_BR, '</li>')
            .replace(REGEX.BLOCK_TAGS_BEFORE, '')
            .replace(REGEX.BLOCK_TAGS_AFTER, '$1')
            .replace(REGEX.NBSP, ' ')
            .trim()
            .replace(REGEX.TRAILING_BR, '')
            .replace(REGEX.BR_SPACING, '<br>');
    }
}

/**
 * Класс управления интерфейсом
 */
class App {
    constructor() {
        this.elements = {
            convertBtn: document.getElementById('convertBtn'),
            copyBtn: document.getElementById('copyBtn'),
            dirtyHtml: document.getElementById('dirtyHtml'),
            cleanHtml: document.getElementById('cleanHtml'),
            copySuccess: document.getElementById('copy-success'),
            keepSpans: document.getElementById('keepSpans')
        };
        
        if (this._validateElements()) {
            this.init();
        }
    }

    _validateElements() {
        return Object.values(this.elements).every(el => el !== null);
    }

    init() {
        this.elements.convertBtn.addEventListener('click', () => this.handleConvert());
        this.elements.copyBtn.addEventListener('click', () => this.handleCopy());
        this.elements.dirtyHtml.addEventListener('paste', (e) => this.handlePaste(e));
    }

    handleConvert() {
        const dirty = this.elements.dirtyHtml.value;
        const options = {
            keepSpans: this.elements.keepSpans.checked
        };
        this.elements.cleanHtml.value = GoogleDocsCleaner.clean(dirty, options);
        this.elements.copySuccess.textContent = '';
    }

    handleCopy() {
        const text = this.elements.cleanHtml.value;
        if (!text) {
            this.showMessage('Нечего копировать!', 'text-red-600');
            return;
        }
        
        this.elements.cleanHtml.select();
        try {
            document.execCommand('copy');
            this.showMessage('Скопировано!', 'text-green-600');
        } catch (err) {
            this.showMessage('Ошибка при копировании', 'text-red-600');
        }
    }

    handlePaste(event) {
        event.preventDefault();
        const html = (event.clipboardData || window.clipboardData).getData('text/html');
        
        if (html) {
            this.elements.dirtyHtml.value = html;
            this.handleConvert();
        } else {
            this.elements.dirtyHtml.value = (event.clipboardData || window.clipboardData).getData('text/plain');
        }
    }

    showMessage(msg, className) {
        const el = this.elements.copySuccess;
        el.textContent = msg;
        el.className = `text-center font-medium mt-4 h-5 ${className}`;
        setTimeout(() => {
            if (el.textContent === msg) el.textContent = '';
        }, 2000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => new App());
