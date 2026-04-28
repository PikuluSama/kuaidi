// pages/result/result.js
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const { getCompanyName, getStateInfo, detectCompany } = require('../../utils/constants.js')

Page({
  data: {
    nu: '',
    comName: '',
    stateName: '',
    stateTag: '',
    traces: [],
    shareTitle: '',
    shareImageUrl: '',
    latestTrace: '',
    latestTime: '',
    loading: false,
    errorCode: '',
    errorMsg: '',
    phone: ''
  },

  onLoad(options) {
    if (!options.nu) return

    const nu = decodeURIComponent(options.nu).trim()
    if (!/^[A-Za-z0-9\-]{6,30}$/.test(nu)) {
      wx.showToast({ title: '单号格式不正确', icon: 'none' })
      return
    }

    const com = options.com ? decodeURIComponent(options.com) : 'auto'
    const phone = options.phone ? decodeURIComponent(options.phone) : ''

    this.setData({ nu, loading: true })
    this._doQuery(nu, com, phone)
  },

  async _doQuery(num, com, phone) {
    try {
      const result = await api.queryExpress(num, com || 'auto', phone)

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

        this._renderResult(result.data)
      } else if (result.code === 'LIMIT_EXCEEDED') {
        this.setData({
          loading: false,
          errorCode: 'LIMIT_EXCEEDED',
          errorMsg: '今日查询次数已用完，明天可继续使用'
        })
      } else if (result.code === 'PHONE_REQUIRED') {
        this.setData({
          loading: false,
          errorCode: 'PHONE_REQUIRED',
          errorMsg: '此快递需要手机号后4位验证'
        })
      } else {
        this.setData({
          loading: false,
          errorCode: 'ERROR',
          errorMsg: result.message || '查询失败，请返回重试'
        })
      }
    } catch (e) {
      this.setData({
        loading: false,
        errorCode: 'ERROR',
        errorMsg: '网络异常，请检查网络后重试'
      })
    }
  },

  _renderResult(data) {
    const stateInfo = getStateInfo(data.state)
    const traces = data.traces || []

    // 根据物流状态生成引导性分享文案
    let shareTitle = ''
    const state = data.state

    if (state === '3') {
      shareTitle = '你的快递已签收！点击查看详情'
    } else if (state === '1') {
      shareTitle = '快递已退回，点击查看详情'
    } else if (state === '2' || state === '4') {
      shareTitle = '快递异常，快来看看怎么了'
    } else if (traces.length > 0) {
      const cityMatch = traces[0].context.match(/[\u4e00-\u9fa5]{2,}(?:市|站|区|中心|分拨)/)
      if (cityMatch) {
        shareTitle = `快递正在路上，已到【${cityMatch[0]}】点击查看实时物流`
      } else {
        shareTitle = '快递正在路上，点击查看实时物流'
      }
    } else {
      shareTitle = getCompanyName(data.com) + ' 快递物流查询'
    }

    this.setData({
      nu: data.nu,
      comName: getCompanyName(data.com),
      stateName: stateInfo.name,
      stateTag: stateInfo.tagClass,
      traces: traces,
      shareTitle: shareTitle,
      latestTrace: traces.length > 0 ? traces[0].context : '',
      latestTime: traces.length > 0 ? (traces[0].ftime || traces[0].time || '') : '',
      loading: false
    }, () => {
      this._generateShareImage()
    })
  },

  _generateShareImage() {
    const query = wx.createSelectorQuery()
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = 2
        canvas.width = 600 * dpr
        canvas.height = 480 * dpr
        ctx.scale(dpr, dpr)

        // 背景：品牌绿渐变
        const gradient = ctx.createLinearGradient(0, 0, 600, 480)
        gradient.addColorStop(0, '#1F6B45')
        gradient.addColorStop(1, '#145A38')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 600, 480)

        // 装饰圆
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.beginPath()
        ctx.arc(520, 80, 120, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(80, 400, 80, 0, Math.PI * 2)
        ctx.fill()

        // 状态标签
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        this._roundRect(ctx, 40, 40, 100, 36, 18)
        ctx.fill()
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(this.data.stateName, 90, 64)

        // 应用名
        ctx.font = '14px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.textAlign = 'right'
        ctx.fillText('快递查询助手', 560, 58)

        // 单号
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'left'
        const nu = this.data.nu || ''
        ctx.fillText(nu.length > 18 ? nu.slice(0, 18) + '...' : nu, 40, 140)

        // 分隔线
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(40, 165)
        ctx.lineTo(560, 165)
        ctx.stroke()

        // 最新轨迹
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = '18px sans-serif'
        const trace = this.data.latestTrace || '暂无物流信息'
        this._wrapText(ctx, trace, 40, 200, 520, 26)

        // 底部：公司名 + 最近更新
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'left'
        const bottomY = 430
        ctx.fillText(this.data.comName || '', 40, bottomY)
        if (this.data.latestTime) {
          ctx.textAlign = 'right'
          ctx.fillText(this.data.latestTime, 560, bottomY)
        }

        // 导出图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: (res) => {
            this.setData({ shareImageUrl: res.tempFilePath })
          }
        })
      })
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  },

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = ''
    let curY = y
    let lineCount = 0
    const maxLines = 3

    for (let i = 0; i < text.length; i++) {
      const testLine = line + text[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line) {
        lineCount++
        if (lineCount >= maxLines) {
          ctx.fillText(line.slice(0, -1) + '...', x, curY)
          return
        }
        ctx.fillText(line, x, curY)
        line = text[i]
        curY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, curY)
  },

  onCopyNum() {
    wx.setClipboardData({
      data: this.data.nu,
      success() {
        wx.showToast({ title: '已复制', icon: 'success', duration: 1000 })
      }
    })
  },

  onRetry() {
    wx.navigateBack()
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onPhoneSubmit() {
    const phone = (this.data.phone || '').trim()
    if (!/^\d{4}$/.test(phone)) {
      wx.showToast({ title: '请输入手机号后4位', icon: 'none' })
      return
    }
    this.setData({ loading: true, errorCode: '' })
    this._doQuery(this.data.nu, 'auto', phone)
  },

  onShareAppMessage() {
    return {
      title: this.data.shareTitle,
      path: `/pages/index/index?num=${this.data.nu}`,
      imageUrl: this.data.shareImageUrl || ''
    }
  },

  onShareTimeline() {
    return {
      title: this.data.shareTitle,
      query: `num=${this.data.nu}`,
      imageUrl: this.data.shareImageUrl || ''
    }
  }
})
