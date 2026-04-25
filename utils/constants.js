// utils/constants.js — 快递公司代码映射

const COMPANIES = {
  shunfeng: {
    code: 'shunfeng',
    name: '顺丰速运',
    prefix: /^SF/i
  },
  zhongtong: {
    code: 'zhongtong',
    name: '中通快递',
    prefix: /^7\d{10}/
  },
  yuantong: {
    code: 'yuantong',
    name: '圆通速递',
    prefix: /^YT/i
  },
  yunda: {
    code: 'yunda',
    name: '韵达快递',
    prefix: /^31\d/
  },
  shentong: {
    code: 'shentong',
    name: '申通快递',
    prefix: /^77\d/
  },
  jitu: {
    code: 'jtexpress',
    name: '极兔速递',
    prefix: /^JT/i
  },
  jingdong: {
    code: 'jd',
    name: '京东物流',
    prefix: /^JD/i
  },
  ems: {
    code: 'ems',
    name: 'EMS',
    prefix: /^[A-Z]{2}\d{9}[A-Z]{2}$/i
  }
}

// 选择器列表（用于首页下拉选择）
const COMPANY_OPTIONS = [
  { code: 'auto', name: '自动识别' },
  { code: 'shunfeng', name: '顺丰速运' },
  { code: 'zhongtong', name: '中通快递' },
  { code: 'yuantong', name: '圆通速递' },
  { code: 'yunda', name: '韵达快递' },
  { code: 'shentong', name: '申通快递' },
  { code: 'jtexpress', name: '极兔速递' },
  { code: 'jd', name: '京东物流' },
  { code: 'ems', name: 'EMS' }
]

/**
 * 根据 code 获取快递公司名称
 * @param {string} code 快递公司代码
 * @returns {string} 公司名称
 */
function getCompanyName(code) {
  for (const key in COMPANIES) {
    if (COMPANIES[key].code === code) return COMPANIES[key].name
  }
  return code
}

/**
 * 前端预判是否为顺丰单号
 * @param {string} num 快递单号
 * @returns {boolean}
 */
function isShunfeng(num) {
  return /^SF/i.test(num)
}

/**
 * 物流状态映射
 * @param {string} state 快递100状态码
 * @returns {Object} { name, tagClass }
 */
function getStateInfo(state) {
  const map = {
    '0': { name: '运输中', tagClass: 'tag-transit' },
    '1': { name: '已退回', tagClass: 'tag-error' },
    '2': { name: '运输异常', tagClass: 'tag-error' },
    '3': { name: '已签收', tagClass: 'tag-signed' },
    '4': { name: '运输异常', tagClass: 'tag-error' }
  }
  return map[state] || { name: '查询中', tagClass: 'tag-transit' }
}

module.exports = {
  COMPANIES,
  COMPANY_OPTIONS,
  getCompanyName,
  isShunfeng,
  getStateInfo
}
