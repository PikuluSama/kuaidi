// pages/index/index.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const { getCompanyName, getStateInfo, detectCompany } = require('../../utils/constants.js')

function formatQueryTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const timeStr = `${hour}:${minute}`

  const isToday = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()

  if (isToday) return timeStr

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate()

  if (isYesterday) return `昨天 ${timeStr}`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day} ${timeStr}`
}

Page({
  data: {
    trackingNum: '',
    phone: '',
    showPhoneInput: false,
    loading: false,
    history: [],
    clipboardTip: '',
    clipboardHasContent: false,
    remainingTip: ''
  },

  onLoad(options) {
    // 从分享/专题页跳转时预填参数
    if (options.num) {
      this.setData({ trackingNum: options.num })
    }
    if (options.com) {
      this.companyParam = options.com
    }
  },

  onShow() {
    this._loadHistory()
    this._checkClipboard()
  },

  _loadHistory() {
    const history = storage.getHistory().map(item => ({
      ...item,
      queryTimeText: formatQueryTime(item.queryTime)
    }))
    this.setData({ history })
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
  },

  onDismissClipboard() {
    this.setData({ clipboardTip: '' })
  },

  onNumInput(e) {
    this.setData({
      trackingNum: e.detail.value,
      clipboardHasContent: false
    })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onInputFocus() {
    if (this.data.trackingNum) return
    const self = this
    wx.getClipboardData({
      success(res) {
        const text = (res.data || '').trim()
        if (/^[A-Za-z0-9\-]{6,30}$/.test(text)) {
          self.setData({ clipboardHasContent: true })
        }
      },
      fail() { /* ignore */ }
    })
  },

  onPasteFromClipboard() {
    const self = this
    wx.getClipboardData({
      success(res) {
        const text = (res.data || '').trim()
        if (/^[A-Za-z0-9\-]{6,30}$/.test(text)) {
          self.setData({ trackingNum: text, clipboardHasContent: false })
        }
      }
    })
  },

  async onQuery() {
    const { trackingNum, phone, showPhoneInput } = this.data
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
      const result = await api.queryExpress(num, this.companyParam || detectCompany(num) || 'auto', showPhoneInput ? phone : '')

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
          stateTag: stateInfo.tagClass,
          lastTrace: traces.length > 0 ? traces[0].context : '暂无物流信息',
          queryTime: Date.now()
        })

        const remaining = result.remaining
        this.setData({
          remainingTip: remaining <= 2 ? `今日还可查询 ${remaining} 次` : ''
        })
        this._loadHistory()

        wx.setStorageSync('__temp_result', result.data)
        wx.navigateTo({
          url: `/pages/result/result?nu=${encodeURIComponent(result.data.nu)}`
        })
      } else if (result.code === 'LIMIT_EXCEEDED') {
        this._showLimitDialog()
      } else if (result.code === 'PHONE_REQUIRED') {
        this.setData({ showPhoneInput: true })
        wx.showToast({ title: '此快递需要手机号后4位，请填写', icon: 'none', duration: 2500 })
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
  },

  onHistoryDelete(e) {
    const num = e.currentTarget.dataset.num
    wx.showModal({
      title: '提示',
      content: '确定删除这条查询记录？',
      success: (res) => {
        if (res.confirm) {
          storage.removeHistory(num)
          this.setData({ history: storage.getHistory() })
        }
      }
    })
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
