Page({
  data: {
    companyCode: 'jtexpress',
    companyName: '极兔速递',
    companyIntro: '极兔速递是一家全球化发展的快递企业，2020年进入中国市场后发展迅速。',
    numFormat: '单号通常以JT开头。',
    phone: '956025',
    num: ''
  },
  onNumInput(e) {
    this.setData({ num: e.detail.value })
  },
  onQuery() {
    const num = (this.data.num || '').trim()
    if (!num || !/^[A-Za-z0-9\-]{6,30}$/.test(num)) {
      wx.showToast({ title: '请输入正确的快递单号', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/index/index?num=${encodeURIComponent(num)}&com=${this.data.companyCode}`
    })
  },
  onShareAppMessage() {
    return {
      title: `${this.data.companyName}查询 - 快递查询助手`,
      path: `/pages/company/jitu`
    }
  }
})
