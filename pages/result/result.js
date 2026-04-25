// pages/result/result.js
const { getCompanyName, getStateInfo } = require('../../utils/constants.js')

Page({
  data: {
    nu: '',
    comName: '',
    stateName: '',
    stateTag: '',
    traces: [],
    shareTitle: '',
    latestTrace: '',
    latestTime: ''
  },

  onLoad(options) {
    if (options.nu) {
      try {
        const data = wx.getStorageSync('__temp_result')
        wx.removeStorageSync('__temp_result')
        const nu = decodeURIComponent(options.nu)
        if (data && data.nu === nu) {
          this._renderResult(data)
        } else {
          wx.showToast({ title: '数据异常', icon: 'none' })
        }
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
      traces: traces,
      shareTitle: shareTitle,
      latestTrace: traces.length > 0 ? traces[0].context : '',
      latestTime: traces.length > 0 ? (traces[0].ftime || traces[0].time || '') : ''
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
