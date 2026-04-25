// cloudfunctions/query/index.js — 快递查询云函数
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const DAILY_LIMIT = 10
const MAX_REWARDS = 3
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

// 快递100 API 凭证
const KUAIDI100_CUSTOMER = '0B1B0EDBDA8BD3B730143FC08EA8ED92'
const KUAIDI100_KEY = 'KcQmHmlC3285'

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { num, com = 'auto', phone = '' } = event

  // 1. 参数校验
  if (!num || !/^[A-Za-z0-9\-]{6,30}$/.test(num)) {
    return { code: 'INVALID_PARAM', message: '快递单号格式不正确' }
  }

  const today = new Date().toISOString().slice(0, 10)
  const now = Date.now()

  // 2. 查询或创建 rate_limit 记录
  let rateRes = await db.collection('rate_limit')
    .where({ _openid: OPENID, date: today })
    .get()

  let rateId
  if (rateRes.data.length === 0) {
    const addRes = await db.collection('rate_limit').add({
      data: {
        _openid: OPENID,
        date: today,
        count: 0,
        bonus: 0,
        rewardCount: 0,
        lastQueryTime: 0
      }
    })
    rateId = addRes._id
    rateRes = { data: [{ count: 0, bonus: 0, rewardCount: 0 }] }
  } else {
    rateId = rateRes.data[0]._id
  }

  const rate = rateRes.data[0]

  // 3. 检查次数
  if (rate.count >= DAILY_LIMIT + rate.bonus) {
    return { code: 'LIMIT_EXCEEDED', message: '今日查询次数已用完' }
  }

  // 4. 检查单号级缓存
  const cacheKey = num.toUpperCase()
  let cachedResult = null

  try {
    const cacheDoc = await db.collection('query_cache').doc(cacheKey).get()
    if (cacheDoc.data && (now - cacheDoc.data.createdAt < CACHE_TTL)) {
      cachedResult = cacheDoc.data.result
    }
  } catch (e) {
    // 缓存不存在，继续查询
  }

  let queryResult

  if (cachedResult) {
    queryResult = cachedResult
  } else {
    // 5. 调用快递100 API
    try {
      const paramObj = { com, num }
      if (phone) paramObj.phone = phone
      const param = JSON.stringify(paramObj)
      const sign = crypto.createHash('md5')
        .update(param + KUAIDI100_KEY + KUAIDI100_CUSTOMER)
        .digest('hex')
        .toUpperCase()

      const body = `customer=${encodeURIComponent(KUAIDI100_CUSTOMER)}&sign=${encodeURIComponent(sign)}&param=${encodeURIComponent(param)}`
      queryResult = await httpPost('https://poll.kuaidi100.com/poll/query.do', body)
    } catch (e) {
      return { code: 'QUERY_ERROR', message: '查询服务暂时不可用，请稍后再试' }
    }
  }

  // 6. 检查快递100返回结果
  if (!queryResult || queryResult.status !== '200' || queryResult.message !== 'ok') {
    if (queryResult && queryResult.returnCode === '408') {
      return { code: 'PHONE_REQUIRED', message: '该快递需要手机号后4位验证' }
    }
    const msg = (queryResult && queryResult.message) || '未查询到物流信息'
    return { code: 'QUERY_ERROR', message: msg }
  }

  // 7. 更新 rate_limit
  await db.collection('rate_limit').doc(rateId).update({
    data: { count: _.inc(1), lastQueryTime: now }
  })

  // 8. 写入缓存
  if (!cachedResult) {
    try {
      await db.collection('query_cache').add({
        data: {
          _id: cacheKey,
          result: queryResult,
          com: queryResult.com,
          state: queryResult.state,
          createdAt: now
        }
      })
    } catch (e) {
      // 已存在则更新
      try {
        await db.collection('query_cache').doc(cacheKey).update({
          data: { result: queryResult, com: queryResult.com, state: queryResult.state, createdAt: now }
        })
      } catch (e2) { /* ignore */ }
    }
  }

  // 9. 返回结果
  return {
    code: 'OK',
    data: {
      nu: queryResult.nu,
      com: queryResult.com,
      state: queryResult.state,
      status: queryResult.status,
      traces: queryResult.data || []
    },
    remaining: DAILY_LIMIT + rate.bonus - rate.count - 1
  }
}
