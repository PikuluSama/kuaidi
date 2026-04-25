Page({
  data: {
    companyCode: 'yuantong',
    companyName: '圆通速递',
    companyIntro: '圆通速递是国内大型快递企业，拥有自建航空机队，物流网络遍布全国。',
    numFormat: '单号通常以YT开头，或为10-18位纯数字。',
    phone: '95554',
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
      path: `/pages/company/yuantong`
    }
  }
})
