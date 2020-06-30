/**
 * 小程序本地数据库
 * @tutorial https://github.com/jin-yufeng/MpLocalDB
 * @author JinYufeng
 * @listens MIT
 */
var localDB, _dirty = false
// 异步写回本地缓存
function _write() {
  _dirty = true
  setTimeout(() => {
    if (_dirty) {
      _dirty = false
      wx.setStorage({
        data: localDB,
        key: 'localDB'
      })
    }
  }, 200)
}
// 更新记录
function _update(item, update) {
  for (var key in update)
    item[key] = typeof update[key] == "function" ? update[key](item[key]) : update[key]
}

// 集合
function Collection(data, root, options) {
  this.data = data
  this.options = options || {
    orderBy: []
  }
  this.root = root || data
}
/**
 * 添加一条记录
 * @param {Object} data 要添加的数据
 * @returns {String} 创建成功返回记录的 id，否则返回 null
 */
Collection.prototype.add = function (data) {
  var id = data._id || ''
  if (typeof data != 'object' || this.data[id]) return null
  data = JSON.parse(JSON.stringify(data))
  data._id = void 0
  while (!id || this.data[id]) {
    var map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    for (var i = 0; i < 4; i++)
      id += map[parseInt(Math.random() * 62)]
  }
  this.data[id] = data
  _write()
  return id
}
/**
 * 获取一条记录
 * @param {String} id 要获取记录的 id
 * @returns {Object} 返回一个 document 对象
 */
Collection.prototype.doc = function (id) {
  var data = this.data[id]
  return {
    get: () => {
      var res = JSON.parse(JSON.stringify(data))
      res._id = id
      return res
    },
    update: (newVal) => {
      if (typeof newVal != 'object') return false
      _update(data, newVal)
      _write()
      return true
    },
    remove: () => (this.data[id] = void 0, true)
  }
}
/**
 * 查询记录
 * @param {Object} obj 查询条件
 * @returns 返回找到的集合
 */
Collection.prototype.where = function (obj) {
  const query = (obj, key) => {
    for (var item in obj) {
      var val = item == '_id' ? key : this.data[key][item]
      if (obj[item] instanceof Command || obj[item] instanceof RegExp) {
        if (!obj[item].exec(val))
          return false
      } else if (obj[item] != val)
        return false
    }
    return true
  }
  var res = {}
  for (var key in this.data) {
    if (obj.type == 'or') {
      for (var i = 0; i < obj.arr.length; i++) {
        if (query(obj.arr[i], key)) {
          res[key] = this.data[key]
          break
        }
      }
    } else if (query(obj, key))
      res[key] = this.data[key]
  }
  return new Collection(res, this.root, this.options)
}
/**
 * 指定查询结果集数量上限
 * @param {Number} limit 数量上限
 * @returns {Collection} 返回设置后的集合
 */
Collection.prototype.limit = function (limit) {
  var options = JSON.parse(JSON.stringify(this.options))
  options.limit = limit
  return new Collection(this.data, this.root, options)
}
/**
 * 指定查询返回结果时从指定序列后的结果开始返回
 * @param {Number} skip 开始返回的位置
 * @returns {Collection} 返回设置后的集合
 */
Collection.prototype.skip = function (skip) {
  var options = JSON.parse(JSON.stringify(this.options))
  options.skip = skip
  return new Collection(this.data, this.root, options)
}
/**
 * 指定查询排序条件
 * @param {String} field 排序字段
 * @param {('asc'|'desc')} order 升序或降序
 * @returns {Collection} 返回设置后的集合
 */
Collection.prototype.orderBy = function (field, order = 'asc') {
  var options = JSON.parse(JSON.stringify(this.options))
  options.orderBy.push({
    field,
    order
  })
  return new Collection(this.data, this.root, options)
}
/**
 * 统计匹配查询条件的记录的条数
 * @returns {Number} 记录的条数
 */
Collection.prototype.count = function () {
  var count = 0
  for (var key in this.data)
    if (this.data[key]) count++
  return count
}
/**
 * 获取集合数据
 * @returns {Array} 集合数据
 */
Collection.prototype.get = function () {
  var res = [],
    add = key => {
      var item = this.data[key]
      if (item) {
        item = JSON.parse(JSON.stringify(item))
        item._id = key
        res.push(item)
      }
    }
  if (this.options.orderBy.length) {
    for (let key in this.data)
      add(key)
    res.sort((a, b) => {
      for (var i = 0, item;
        (item = this.options.orderBy[i]); i++)
        if (a[item.field] != b[item.field])
          return (item.order == 'desc' ? -1 : 1) * (a[item.field] - b[item.field])
      return 0
    })
    if (this.options.skip) res = res.slice(this.options.skip)
    if (this.options.limit) res = res.slice(0, this.options.limit)
  } else {
    var i
    for (let key in this.data) {
      if (!this.options.skip || i >= this.options.skip) {
        add(key)
        if (i + 1 - (this.options.skip || 0) == this.options.limit) break
      }
      i++
    }
  }
  return res
}
/**
 * 更新多条记录
 * @param {Object} newVal 更新内容
 */
Collection.prototype.update = function (newVal) {
  if (typeof newVal != 'object') return false
  for (var key in this.data)
    _update(this.data[key], newVal)
  _write()
  return true
}
/**
 * 删除多条记录
 */
Collection.prototype.remove = function () {
  for (var key in this.data)
    this.root[key] = void 0
  _write()
}

// 查询指令
function Command(func) {
  this.exec = func
}
/**
 * 与查询
 * @param {Command} 下一条查询指令
 * @returns {Command} 与查询指令
 */
Command.prototype.and = function (cmd) {
  return new Command(val => this.exec(val) && cmd.exec(val))
}
/**
 * 或查询
 * @param {Command} 下一条查询指令
 * @returns {Command} 或查询指令
 */
Command.prototype.or = function (cmd) {
  return new Command(val => this.exec(val) || cmd.exec(val))
}

module.exports = {
  /**
   * 初始化数据库
   */
  init() {
    if (!localDB)
      localDB = wx.getStorageSync('localDB') || {}
  },
  /**
   * 创建一个集合
   * @param {String} name 要创建的集合名称
   * @returns {Collection} 创建成功返回集合对象，否则返回 false
   */
  createCollection(name) {
    if (!localDB) return console.warn('请先初始化'), false
    if (localDB[name]) return false
    localDB[name] = {}
    _write()
    return new Collection(localDB[name])
  },
  /**
   * 移除一个集合
   * @param {String} name 要移除的集合名称
   */
  removeCollection(name) {
    if (!localDB) return console.warn('请先初始化')
    localDB[name] = void 0
    _write()
  },
  /**
   * 获取一个集合对象
   * @param {String} name 集合名称
   * @returns {Collection} 存在则返回集合对象，否则返回 null
   */
  collection(name) {
    if (!localDB) return console.warn('请先初始化'), false
    return localDB[name] ? new Collection(localDB[name]) : null
  },
  command: {
    // 查询指令
    eq: query => new Command(val => val == query),
    neq: query => new Command(val => val != query),
    lt: query => new Command(val => val < query),
    lte: query => new Command(val => val <= query),
    gt: query => new Command(val => val > query),
    gte: query => new Command(val => val >= query),
    in: query => new Command(val => query.includes(val)),
    nin: query => new Command(val => !query.includes(val)),
    exists: query => new Command(val => val == void 0 ? !query : query),
    or: (...arr) => ({
      type: 'or',
      arr: arr[0] instanceof Array ? arr[0] : arr
    }),
    // 更新指令
    set: val => JSON.parse(JSON.stringify(val)),
    remove: () => void 0,
    inc: diff => (val => val += diff),
    mul: diff => (val => val *= diff),
    push: diff => (val => (val.push(diff), val)),
    pop: () => (val => (val.pop(), val)),
    shift: () => (val => (val.shift(), val)),
    unshift: diff => (val => (val.unshift(diff), val))
  }
}