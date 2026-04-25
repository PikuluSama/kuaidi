Page({
  data: {
    companyCode: 'shunfeng',
    companyName: '顺丰速运',
    companyIntro: '顺丰速运成立于1993年，是国内领先的综合物流服务商，以时效快、服务好著称。',
    numFormat: '单号以SF开头，通常为12-15位。',
    phone: '95338',
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
      path: `/pages/company/shunfeng`
    }
  }
})
