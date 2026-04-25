Page({
  data: {
    companyCode: 'yunda',
    companyName: '韵达快递',
    companyIntro: '韵达快递是国内主流快递企业之一，网络覆盖广泛，提供快递、物流、配送等综合服务。',
    numFormat: '单号通常为13位纯数字，以31开头。',
    phone: '95546',
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
      path: `/pages/company/yunda`
    }
  }
})
