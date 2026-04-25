// utils/storage.js — 本地存储（查询历史）

const HISTORY_KEY = 'query_history'
const MAX_HISTORY = 20

/**
 * 获取查询历史
 * @returns {Array} 历史记录列表
 */
function getHistory() {
  try {
    return wx.getStorageSync(HISTORY_KEY) || []
  } catch (e) {
    return []
  }
}

/**
 * 添加或更新一条历史记录
 * @param {Object} item { num, com, comName, state, stateName, lastTrace, queryTime }
 */
function addHistory(item) {
  const list = getHistory()
  // 移除同单号的旧记录
  const filtered = list.filter(h => h.num !== item.num)
  // 插入到最前面
  filtered.unshift(item)
  // 限制数量
  if (filtered.length > MAX_HISTORY) {
    filtered.length = MAX_HISTORY
  }
  try {
    wx.setStorageSync(HISTORY_KEY, filtered)
  } catch (e) { /* ignore */ }
}

/**
 * 删除一条历史记录
 * @param {string} num 快递单号
 */
function removeHistory(num) {
  const list = getHistory()
  const filtered = list.filter(h => h.num !== num)
  try {
    wx.setStorageSync(HISTORY_KEY, filtered)
  } catch (e) { /* ignore */ }
}

/**
 * 清空所有历史
 */
function clearHistory() {
  try {
    wx.setStorageSync(HISTORY_KEY, [])
  } catch (e) { /* ignore */ }
}

module.exports = {
  getHistory,
  addHistory,
  removeHistory,
  clearHistory
}
