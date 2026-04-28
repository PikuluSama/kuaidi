// pages/index/index.js
const storage = require('../../utils/storage.js')
const { detectCompany } = require('../../utils/constants.js')

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
    history: [],
    clipboardTip: '',
    clipboardHasContent: false
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

  onQuery() {
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

    const com = this.companyParam || detectCompany(num) || 'auto'
    const phoneParam = showPhoneInput ? phone : ''

    wx.navigateTo({
      url: `/pages/result/result?nu=${encodeURIComponent(num)}&com=${encodeURIComponent(com)}&phone=${encodeURIComponent(phoneParam)}`
    })
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
  }
})
