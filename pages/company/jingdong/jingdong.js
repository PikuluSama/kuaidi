Page({
  data: {
    companyCode: 'jd',
    companyName: '京东物流',
    companyIntro: '京东物流是京东集团旗下物流服务商，以仓配一体化和极速配送著称。',
    numFormat: '单号通常以JD开头。',
    phone: '950616',
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
      path: `/pages/company/jingdong`
    }
  }
})
