Page({
  data: {
    companyCode: 'zhongtong',
    companyName: '中通快递',
    companyIntro: '中通快递是国内业务量领先的快递企业，服务网络覆盖全国，以高性价比著称。',
    numFormat: '单号通常为12-14位纯数字，以7开头。',
    phone: '95311',
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
      path: `/pages/company/zhongtong`
    }
  }
})
