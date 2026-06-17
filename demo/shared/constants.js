export const ICONS = [
    { name: '首页', emoji: '🏠', color: '#8b5cf6' },
    { name: '搜索', emoji: '🔍', color: '#ec4899' },
    { name: '消息', emoji: '💬', color: '#06b6d4' },
    { name: '设置', emoji: '⚙️', color: '#22c55e' }
];

export const PARAM_SCHEMA = [
    { section: '布局', path: 'centerT', label: '中心位置', min: 0, max: 1, step: 0.01 },
    { section: '布局', path: 'tStep', label: '图标间距', min: 0.01, max: 0.99, step: 0.01 },
    { section: '布局', path: 'trackScale', label: '轨迹长度', min: 0.5, max: 2, step: 0.01 },
    { section: '布局', path: 'initialIndex', label: '初始索引', min: 0, max: 10, step: 1 },
    { section: '布局', path: 'visibleIconCount', label: '可见数量', min: 1, max: 10, step: 1 },
    { section: '交互', path: 'sensitivity', label: '拖动灵敏度', min: 0.001, max: 0.02, step: 0.001 },
    { section: '交互', path: 'snapDuration', label: '吸附时长(ms)', min: 100, max: 1000, step: 50 },
    { section: '交互', path: 'rubberBandLimit', label: '拉扯限制', min: 0.1, max: 1, step: 0.05 },
    { section: '交互', path: 'rubberBandDuration', label: '回弹时长(ms)', min: 200, max: 1000, step: 50 },
    { section: '弧度', path: 'bezier.curveSmooth', label: '曲线平滑', min: -1, max: 2, step: 0.05 },
    { section: '弧度', path: 'bezier.rightTilt', label: '右侧倾斜', min: -1, max: 2, step: 0.05 },
    { section: '弧度', path: 'bezier.rightEndOffset', label: '右端偏移', min: -0.5, max: 0.5, step: 0.005 },
    { section: '弧度', path: 'bezier.localBend.t', label: '弯曲位置', min: 0, max: 1, step: 0.01 },
    { section: '弧度', path: 'bezier.localBend.degrees', label: '弯曲角度', min: -180, max: 180, step: 1 },
    { section: '弧度', path: 'bezier.leftEndBend.degrees', label: '左末弯曲', min: -90, max: 90, step: 1 },
    { section: '控制点 P0', path: 'bezier.fitted.p0.x', label: '起点 X', min: -1, max: 2, step: 0.005 },
    { section: '控制点 P0', path: 'bezier.fitted.p0.y', label: '起点 Y', min: -1, max: 2, step: 0.01 },
    { section: '控制点 P1', path: 'bezier.fitted.p1.x', label: '控制点 X', min: -1, max: 2, step: 0.01 },
    { section: '控制点 P1', path: 'bezier.fitted.p1.y', label: '控制点 Y', min: -1, max: 3, step: 0.01 },
    { section: '控制点 P2', path: 'bezier.fitted.p2.x', label: '终点 X', min: -1, max: 2, step: 0.005 },
    { section: '控制点 P2', path: 'bezier.fitted.p2.y', label: '终点 Y', min: -1, max: 2, step: 0.01 }
];

export const RESET_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
</svg>`;

export const COPY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
</svg>`;

export const COPIED_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
</svg>`;
