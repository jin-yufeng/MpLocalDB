# MpLocalDB

> 微信小程序本地数据库

## 使用方法 ##
1. 复制 `localDB.js`（`7.93KB`，`min` 版本 `4.24KB`）到 `utils` 目录下
2. 在需要使用的页面的 `js` 文件中添加  

   ```javascript
   const localDB = require('utils/localDB.js')
   const _ = localDB.command
   ```

## 示例程序 ##
```javascript
const localDB = require('utils/localDB.js')
const _ = localDB.command
localDB.init() // 初始化
var articles = localDB.collection('articles')
if(!articles)
  articles = localDB.createCollection('articles') // 不存在则先创建
// 按文章 id 查找
var doc = articles.doc('xxx')
if(doc) {
  var data = doc.get() // 取得数据
} else {
  // 网络请求获取 data
  data._timeout = Date.now() + 15 * 24 * 3600000 // 设置过期时间为 15 天
  articles.add(data) // 添加到本地数据库
}
// 按类型查找
var data = articles.where({
  type: 'xxx'
}).get()
// 正则查找
var data = articles.where({
  title: /xxx/ // 标题中含有 xxx 的
}).get()
// 分页查找
var page2 = articles.skip(10).limit(10).get()
// 按时间查找
var data = articles.where({
  date: _.gte('20200501').and(_.lte('20200510')) // 大于等于 20200501 小于等于 20200510
}).get()
// 结果排序
var data = articles.orderBy('date', 'desc').get() // 按日期降序排序
// 清理过期数据
articles.where({
  _timeout: _.lt(Date.now()) // 过期时间早于当前的
}).remove()
```

## api ##
### db ###
  
| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| init | / | / | 初始化数据库 |
| collection | name | Collection | 获取名称为 name 的集合 |
| createCollection | name | Collection | 创建一个名称为 name 的集合 |
| removeCollection | name | / | 移除名称为 name 的集合 |

### collection ###

| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| add | data | id | 向集合中添加一条数据 |
| count | / | number | 统计匹配查询条件的记录的条数 |
| doc | id | document | 获取一条记录 |
| get | / | array | 获取集合数据 |
| limit | number | collection | 指定查询结果集数量上限 |
| orderBy | field, order | collection | 指定查询排序条件 |
| remove | / | / | 删除多条数据 |
| skip | number | collection | 指定查询返回结果时从指定序列后的结果开始返回 |
| update | newVal | / | 更新多条数据 |
| where | query | collection | 进行条件查询 |

附：`limit` 和 `skip` 仅对 `get` 有效

### document ###

| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| get | / | data | 获取记录数据 |
| remove | / | / | 删除该记录 |
| update | newVal | / | 更新记录数据 |

### command ###

查询指令：

| 名称 | 功能 |
|:---:|:---:|
| eq | 等于 |
| neq | 不等于 |
| lt | 小于 |
| lte | 小于或等于 |
| gt | 大于 |
| gte | 大于或等于 |
| in | 字段值在给定数组中 |
| nin | 字段值不在给定数组中 |
| exists | 判断字段是否存在 |
| or | 多字段或查询 |

单个字段的条件之间还可以通过 `or` 和 `and` 进行组合，如  
```javascript
_.gt(30).and(_.lt(70)) // 大于 30 且小于 70
_.eq(0).or(_.eq(100)) // 等于 0 或等于 100
```

`or` 指令用于多字段或查询（默认是与查询）  
```javascript
// 查询 collection 表中 a 字段为 1 或 b 字段为 2 的记录
collection.where(_.or([{
  a: 1
}, {
  b: 2
}]))
```

更新指令：

| 名称 | 功能 |
|:---:|:---:|
| set | 设置字段为指定值 |
| remove | 删除字段 |
| inc | 原子自增字段值 |
| mul | 原子自乘字段值 |
| push | 如字段值为数组，往数组尾部增加指定值 |
| pop | 如字段值为数组，从数组尾部删除一个元素 |
| shift | 如字段值为数组，从数组头部删除一个元素 |
| unshift | 如字段值为数组，往数组头部增加指定值 |

## 注意事项 ##
1. 数据库存储在本地 `storage` 中，账号、设备之间 **存在隔离**；最大大小为 `10MB`；**请勿覆盖或删除** `key` 为 `localDB` 的 `storage`，否则可能造成数据丢失  
2. 使用前 **必须调用** `db.init` 方法（从 `storage` 中读取保存的数据，数据量较大的时候，需要选择一个合适的时机进行载入）  
3. 所有数据都在内存中，存取都较快，因此所有方法 **均为同步方法**，不返回 `Promise`  
4. 所有操作 **不可撤销和恢复**，尤其是 `remove` 方法需谨慎调用  
5. 集合名和一个集合内的 `_id`（可自动生成）**不可重复**，否则将无法创建  
6. 方法设置参考了云数据库的操作，关于各方法的详细信息可以直接参考 [云数据库的文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/Cloud.database.html)  

## 更新日志 ##
- 2020.6.30  
  1. `A` 增加 `or` 指令，可以实现多字段或查询  

- 2020.5.13  
  1. `U` 支持多字段排序（设置多个 `orderBy`）  
  2. `U` 同时设置 `orderBy` 和 `skip`、`limit` 时将先进行排序再执行 `skip` 和 `limit`

- 2020.5.9  
  1. `A` 添加了 `count` 方法