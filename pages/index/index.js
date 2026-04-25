// pages/index/index.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const { COMPANY_OPTIONS, isShunfeng, getCompanyName, getStateInfo } = require('../../utils/constants.js')

Page({
  data: {
    trackingNum: '',
    phone: '',
    companyOptions: COMPANY_OPTIONS,
    companyIndex: 0,
    selectedCompany: 'auto',
    showPhoneInput: false,
    loading: false,
    history: [],
    clipboardTip: '',
    remainingTip: ''
  },

  onLoad(options) {
    // 从分享/专题页跳转时预填参数
    if (options.num) {
      this.setData({ trackingNum: options.num })
    }
    if (options.com) {
      const idx = COMPANY_OPTIONS.findIndex(c => c.code === options.com)
      if (idx > 0) {
        this.setData({ companyIndex: idx, selectedCompany: options.com })
        if (options.com === 'shunfeng') {
          this.setData({ showPhoneInput: true })
        }
      }
    }
  },

  onShow() {
    this._loadHistory()
    this._checkClipboard()
  },

  _loadHistory() {
    this.setData({ history: storage.getHistory() })
  },

  _checkClipboard() {
    const self = this
    wx.getClipboardData({
      success(res) {
        const text = (res.data || '').trim()
        if (/^[A-Za-z0-9\-]{6,30}$/.test(text)) {
          self.setData({ clipboardTip: text })
        }
      },
      fail() { /* ignore */ }
    })
  },

  onTapClipboard() {
    const num = this.data.clipboardTip
    this.setData({ trackingNum: num, clipboardTip: '' })
    if (isShunfeng(num)) {
      const idx = COMPANY_OPTIONS.findIndex(c => c.code === 'shunfeng')
      this.setData({ companyIndex: idx, selectedCompany: 'shunfeng', showPhoneInput: true })
    }
  },

  onDismissClipboard() {
    this.setData({ clipboardTip: '' })
  },

  onNumInput(e) {
    const num = e.detail.value
    this.setData({ trackingNum: num })
    // 实时检测顺丰单号
    if (this.data.selectedCompany === 'auto') {
      this.setData({ showPhoneInput: isShunfeng(num) })
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onCompanyChange(e) {
    const idx = e.detail.value
    const company = COMPANY_OPTIONS[idx]
    this.setData({
      companyIndex: idx,
      selectedCompany: company.code,
      showPhoneInput: company.code === 'shunfeng' || (company.code === 'auto' && isShunfeng(this.data.trackingNum))
    })
  },

  async onQuery() {
    const { trackingNum, selectedCompany, phone, showPhoneInput } = this.data
    const num = (trackingNum || '').trim()

    if (!num || !/^[A-Za-z0-9\-]{6,30}$/.test(num)) {
      wx.showToast({ title: '请输入正确的快递单号', icon: 'none' })
      return
    }

    if (showPhoneInput && !/^\d{4}$/.test(phone)) {
      wx.showToast({ title: '请填写手机号后4位', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await api.queryExpress(num, selectedCompany, showPhoneInput ? phone : '')

      this.setData({ loading: false })

      if (result.code === 'OK') {
        const stateInfo = getStateInfo(result.data.state)
        const traces = result.data.traces || []
        storage.addHistory({
          num: result.data.nu,
          com: result.data.com,
          comName: getCompanyName(result.data.com),
          state: result.data.state,
          stateName: stateInfo.name,
          lastTrace: traces.length > 0 ? traces[0].context : '暂无物流信息',
          queryTime: Date.now()
        })

        const remaining = result.remaining
        this.setData({
          remainingTip: remaining <= 2 ? `今日还可查询 ${remaining} 次` : '',
          history: storage.getHistory()
        })

        wx.navigateTo({
          url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(result.data))}`
        })
      } else if (result.code === 'LIMIT_EXCEEDED') {
        this._showLimitDialog()
      } else if (result.code === 'PHONE_REQUIRED') {
        const idx = COMPANY_OPTIONS.findIndex(c => c.code === 'shunfeng')
        this.setData({ companyIndex: idx, selectedCompany: 'shunfeng', showPhoneInput: true })
        wx.showToast({ title: '顺丰需要手机号后4位，请填写', icon: 'none', duration: 2500 })
      } else {
        wx.showToast({ title: result.message || '查询失败，请重试', icon: 'none', duration: 2500 })
      }
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '网络异常，请检查网络后重试', icon: 'none' })
    }
  },

  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item
    this.setData({ trackingNum: item.num })
    this.onQuery()
  },

  onHistoryDelete(e) {
    const num = e.currentTarget.dataset.num
    storage.removeHistory(num)
    this.setData({ history: storage.getHistory() })
  },

  onClearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清空所有查询历史？',
      success: (res) => {
        if (res.confirm) {
          storage.clearHistory()
          this.setData({ history: [] })
        }
      }
    })
  },

  _showLimitDialog() {
    wx.showModal({
      title: '今日查询次数已用完',
      content: '明天可继续使用，感谢理解',
      showCancel: false,
      confirmText: '知道了'
    })
  }

  // V2：广告功能（流量主资质满足后启用）
  // _showRewardedAd() { ... }
})
