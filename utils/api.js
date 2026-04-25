// utils/api.js — 云函数调用封装

/**
 * 查询快递物流
 * @param {string} num 快递单号
 * @param {string} com 快递公司代码，默认 'auto'
 * @param {string} phone 手机号后4位（顺丰必填）
 */
function queryExpress(num, com = 'auto', phone = '') {
  return wx.cloud.callFunction({
    name: 'query',
    data: { num, com, phone }
  }).then(res => {
    if (res.errMsg !== 'cloud.callFunction:ok') {
      return { code: 'NETWORK_ERROR', message: '网络异常，请检查网络后重试' }
    }
    return res.result
  }).catch(() => {
    return { code: 'NETWORK_ERROR', message: '网络异常，请检查网络后重试' }
  })
}

/**
 * 领取广告奖励
 * @param {string} nonce 客户端生成的 UUID
 */
function claimReward(nonce) {
  return wx.cloud.callFunction({
    name: 'reward',
    data: { nonce }
  }).then(res => {
    if (res.errMsg !== 'cloud.callFunction:ok') {
      return { code: 'NETWORK_ERROR', message: '网络异常，请稍后再试' }
    }
    return res.result
  }).catch(() => {
    return { code: 'NETWORK_ERROR', message: '网络异常，请稍后再试' }
  })
}

/**
 * 生成 UUID nonce
 */
function generateNonce() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

module.exports = {
  queryExpress,
  claimReward,
  generateNonce
}
