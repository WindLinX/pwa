export const expenseDefaults = [
  { name: '餐饮', icon: '🍜', children: [{ name: '早餐', icon: '🥣' }, { name: '午餐', icon: '🍱' }, { name: '晚餐', icon: '🍽️' }, { name: '夜宵', icon: '🌙' }, { name: '饮品', icon: '🧋' }] },
  { name: '交通', icon: '🚇', children: [{ name: '公交', icon: '🚌' }, { name: '地铁', icon: '🚇' }, { name: '打车', icon: '🚕' }, { name: '高铁', icon: '🚄' }, { name: '停车', icon: '🅿️' }] },
  { name: '购物', icon: '🛍️', children: [{ name: '日用品', icon: '🧻' }, { name: '服饰', icon: '👕' }, { name: '数码', icon: '💻' }, { name: '美妆', icon: '💄' }, { name: '礼物', icon: '🎁' }] },
  { name: '娱乐', icon: '🎮', children: [{ name: '电影', icon: '🎬' }, { name: '游戏', icon: '🎮' }, { name: '旅行', icon: '✈️' }, { name: '运动', icon: '⚽' }, { name: '会员', icon: '🎫' }] },
  { name: '医疗', icon: '💊', children: [{ name: '挂号', icon: '🏥' }, { name: '药品', icon: '💊' }, { name: '检查', icon: '🩺' }, { name: '保健', icon: '🧘' }] },
] as const

export const incomeDefaults = [
  { name: '工资', icon: '💰' },
  { name: '礼金', icon: '🧧' },
] as const
