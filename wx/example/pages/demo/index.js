Page({
  data: {
    icons: [
      { name: '首页', emoji: '🏠', color: '#8b5cf6' },
      { name: '搜索', emoji: '🔍', color: '#ec4899' },
      { name: '消息', emoji: '💬', color: '#06b6d4' },
      { name: '设置', emoji: '⚙️', color: '#22c55e' }
    ],
    bezier: {
      curveSmooth: 0.1,
      localBend: { t: 0.36, degrees: 38 }
    },
    selectedName: '首页',
    selectedEmoji: '🏠'
  },

  onSelect(event) {
    const { icon, index } = event.detail;
    this.setData({
      selectedName: icon.name,
      selectedEmoji: icon.emoji || icon.displayLabel || ''
    });
    console.log('select', icon.name, index);
  },

  onSlideEnd(event) {
    console.log('slide-end', event.detail.index);
  }
});
