'use strict';

/**
 * 使用 wx.createCanvasContext 绘制默认滑轨（微信原生小程序）
 * @param {WechatMiniprogram.Component.TrivialInstance} component 组件实例
 * @param {string} canvasId canvas-id
 * @param {object} layout engine.getLayoutState() 返回值
 */
function drawDefaultTrackOnCanvas(component, canvasId, layout) {
    if (!layout?.bezier || typeof wx === 'undefined' || !wx.createCanvasContext) {
        return;
    }

    const { bezier, width, height, fillBottom } = layout;
    const ctx = wx.createCanvasContext(canvasId, component);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(bezier.p0.x, bezier.p0.y);
    ctx.quadraticCurveTo(bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y);
    ctx.lineTo(bezier.p2.x, fillBottom);
    ctx.lineTo(bezier.p0.x, fillBottom);
    ctx.closePath();
    ctx.setFillStyle('rgba(255, 180, 120, 0.18)');
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bezier.p0.x, bezier.p0.y);
    ctx.quadraticCurveTo(bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y);
    ctx.setStrokeStyle('rgba(255, 230, 180, 0.85)');
    ctx.setLineWidth(3);
    ctx.setLineCap('round');
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bezier.p0.x, bezier.p0.y);
    ctx.quadraticCurveTo(bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y);
    ctx.setStrokeStyle('rgba(255, 220, 150, 0.45)');
    ctx.setLineWidth(1.5);
    ctx.stroke();

    ctx.draw();
}

module.exports = {
    drawDefaultTrackOnCanvas
};
