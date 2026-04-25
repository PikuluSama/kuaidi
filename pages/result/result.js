// pages/result/result.js
const { getCompanyName, getStateInfo } = require('../../utils/constants.js')

Page({
  data: {
    nu: '',
    comName: '',
    stateName: '',
    stateTag: '',
    stateIcon: '',
    traces: [],
    shareTitle: ''
  },

  onLoad(options) {
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data))
        this._renderResult(data)
      } catch (e) {
        wx.showToast({ title: '数据异常', icon: 'none' })
      }
    }
  },

  _renderResult(data) {
    const stateInfo = getStateInfo(data.state)
    const traces = data.traces || []

    // 分享标题：用最新物流状态
    let shareTitle = '快递查询'
    if (traces.length > 0) {
      shareTitle = traces[0].context
    } else {
      shareTitle = getCompanyName(data.com) + ' 快递查询'
    }

    this.setData({
      nu: data.nu,
      comName: getCompanyName(data.com),
      stateName: stateInfo.name,
      stateTag: stateInfo.tagClass,
      stateIcon: stateInfo.icon,
      traces: traces,
      shareTitle: shareTitle
    })
  },

  // 复制单号
  onCopyNum() {
    wx.setClipboardData({
      data: this.data.nu,
      success() {
        wx.showToast({ title: '已复制', icon: 'success', duration: 1000 })
      }
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: this.data.shareTitle,
      path: `/pages/index/index?num=${this.data.nu}`
    }
  }
})
