Page({
  data: {
    companyCode: 'ems',
    companyName: 'EMS',
    companyIntro: 'EMS是中国邮政旗下快递品牌，覆盖范围全国最广，可达偏远地区和乡镇。',
    numFormat: '单号通常为13位，由2位字母+9位数字+2位字母组成（如EM123456789CN）。',
    phone: '11183',
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
      path: `/pages/company/ems`
    }
  }
})
