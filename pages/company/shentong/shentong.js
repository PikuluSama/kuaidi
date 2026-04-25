Page({
  data: {
    companyCode: 'shentong',
    companyName: '申通快递',
    companyIntro: '申通快递是国内老牌快递企业，服务网络遍布全国城乡，是阿里巴巴投资的重要物流伙伴。',
    numFormat: '单号通常以77开头，为12-14位数字。',
    phone: '95543',
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
      path: `/pages/company/shentong`
    }
  }
})
