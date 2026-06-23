import { DEFAULT_COLORS } from './defaults.js';
import { darkenColor } from './utils.js';

function isImageSource(value) {
    if (typeof value !== 'string' || !value) return false;
    return /^data:image\//i.test(value)
        || /\.(png|jpe?g|gif|webp|bmp|ico)(\?.*)?$/i.test(value)
        || /\.svg(\?.*)?$/i.test(value)
        || /^(\.\/|\.\.\/|\/|https?:)/i.test(value);
}

function isSvgUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    return /\.svg(\?.*)?$/i.test(value) || /^data:image\/svg\+xml/i.test(value);
}

function parseUnicode(value) {
    if (value == null) return '';
    if (typeof value === 'number') {
        return String.fromCodePoint(value);
    }
    const str = String(value).trim();
    if (/^\\u[0-9a-fA-F]{4}$/.test(str)) {
        return String.fromCharCode(parseInt(str.slice(2), 16));
    }
    if (/^(0x[0-9a-fA-F]+|U\+[0-9a-fA-F]+)$/i.test(str)) {
        const hex = str.replace(/^U\+/i, '').replace(/^0x/i, '');
        return String.fromCodePoint(parseInt(hex, 16));
    }
    if (/^&#x[0-9a-fA-F]+;$/i.test(str)) {
        return String.fromCodePoint(parseInt(str.slice(3, -1), 16));
    }
    if (/^&#\d+;$/.test(str)) {
        return String.fromCodePoint(parseInt(str.slice(2, -1), 10));
    }
    if (/^\d+$/.test(str)) {
        return String.fromCodePoint(parseInt(str, 10));
    }
    return str;
}

export function resolveIconContent(icon, index) {
    if (typeof icon === 'number' || typeof icon === 'string') {
        if (typeof icon === 'string' && isImageSource(icon)) {
            const type = isSvgUrl(icon) ? 'svg-url' : 'image';
            return { type, value: icon };
        }
        const value = String(icon);
        return { type: 'text', value };
    }

    const imageSrc = icon.image ?? icon.src ?? icon.img;
    if (imageSrc) {
        const type = isSvgUrl(imageSrc) ? 'svg-url' : 'image';
        return { type, value: imageSrc };
    }

    const svgUrl = icon.svgUrl ?? icon.svgSrc;
    if (svgUrl) {
        return { type: 'svg-url', value: svgUrl };
    }
    if (typeof icon.svg === 'string' && isImageSource(icon.svg)) {
        return { type: 'svg-url', value: icon.svg };
    }

    const pathValue = icon.svgPath ?? icon.path ?? icon.svg?.path ?? icon.svg?.d;
    if (pathValue) {
        return {
            type: 'svg-path',
            value: pathValue,
            viewBox: icon.viewBox ?? icon.svg?.viewBox ?? '0 0 24 24',
            fill: icon.iconFill ?? icon.fill ?? icon.svg?.fill ?? 'currentColor',
            stroke: icon.iconStroke ?? icon.stroke ?? icon.svg?.stroke,
            strokeWidth: icon.iconStrokeWidth ?? icon.strokeWidth ?? icon.svg?.strokeWidth
        };
    }

    const fontValue = icon.fontIcon ?? icon.unicode ?? icon.iconCode ?? icon.charCode;
    if (fontValue != null) {
        return {
            type: 'font',
            value: parseUnicode(fontValue),
            fontFamily: icon.fontFamily,
            fontClass: icon.fontClass ?? icon.iconClass
        };
    }

    const text = icon.emoji ?? icon.label ?? icon.text ?? String(index + 1);
    return { type: 'text', value: text };
}

function getIconDisplayLabel(name, content) {
    if (content.type === 'text' || content.type === 'font') {
        return content.value;
    }
    return name;
}

export function normalizeIcons(icons, defaultCount) {
    const source = icons && icons.length > 0
        ? icons
        : Array.from({ length: defaultCount }, (_, i) => i + 1);

    return source.map((icon, index) => {
        const name = typeof icon === 'object' && icon !== null
            ? (icon.name ?? String(index + 1))
            : String(typeof icon === 'number' ? icon : (icon || index + 1));
        const color = typeof icon === 'object' && icon !== null
            ? (icon.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length])
            : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        const content = resolveIconContent(icon, index);
        const displayLabel = getIconDisplayLabel(name, content);

        return {
            name,
            color,
            content,
            displayLabel,
            emoji: displayLabel
        };
    });
}

export function iconBackground(iconData) {
    const isMedia = iconData.content.type === 'image' || iconData.content.type === 'svg-url';
    if (isMedia && iconData.content.type === 'image') {
        return `linear-gradient(145deg, ${iconData.color} 0%, ${darkenColor(iconData.color, 30)} 100%)`;
    }
    if (isMedia) {
        return `linear-gradient(145deg, ${iconData.color}22 0%, ${darkenColor(iconData.color, 10)}33 100%)`;
    }
    return `linear-gradient(145deg, ${iconData.color} 0%, ${darkenColor(iconData.color, 30)} 100%)`;
}
