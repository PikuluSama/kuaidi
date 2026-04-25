// cloudfunctions/reward/index.js — 广告奖励云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const BONUS_PER_REWARD = 5
const MAX_REWARDS = 3

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { nonce } = event

  if (!nonce) {
    return { code: 'INVALID_PARAM', message: '缺少 nonce 参数' }
  }

  const today = new Date().toISOString().slice(0, 10)

  // 1. 校验 nonce 防重放
  const nonceRes = await db.collection('reward_nonces')
    .where({ _id: nonce })
    .get()

  if (nonceRes.data.length > 0) {
    return { code: 'DUPLICATE_NONCE', message: '无效请求' }
  }

  // 2. 查询 rate_limit
  let rateRes = await db.collection('rate_limit')
    .where({ _openid: OPENID, date: today })
    .get()

  let rateId, rate
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
    rate = { count: 0, bonus: 0, rewardCount: 0 }
  } else {
    rateId = rateRes.data[0]._id
    rate = rateRes.data[0]
  }

  // 3. 检查奖励次数上限
  if (rate.rewardCount >= MAX_REWARDS) {
    return { code: 'REWARD_LIMIT', message: '今日广告奖励次数已用完' }
  }

  // 4. 记录 nonce
  await db.collection('reward_nonces').add({
    data: {
      _id: nonce,
      _openid: OPENID,
      createdAt: Date.now()
    }
  })

  // 5. 更新 bonus 和 rewardCount
  await db.collection('rate_limit').doc(rateId).update({
    data: {
      bonus: _.inc(BONUS_PER_REWARD),
      rewardCount: _.inc(1)
    }
  })

  const remaining = 10 + rate.bonus + BONUS_PER_REWARD - rate.count

  return {
    code: 'OK',
    remaining: remaining,
    bonus: BONUS_PER_REWARD
  }
}
