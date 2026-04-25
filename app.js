// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'cloud1-d9g813a2l31df4cc0',
      traceUser: true
    })
  },
  globalData: {
    openid: '',
    dailyLimit: 10,
    dailyRemaining: 10
  }
})
