# MpLocalDB

> 微信小程序本地数据库

## 使用方法 ##
1. 复制 `localDB.js`（`6.70KB`，`min` 版本 `3.97KB`）到 `utils` 目录下
2. 在需要使用的页面的 `js` 文件中添加  

   ```javascript
   const localDB = require('utils/localDB.js')
   const _ = localDB.command
   ```

例程一：增删改查
```javascript
localDB.init() // 初始化
var collection = localDB.collection('test')
if(!collection) {
  collection = localDB.createCollection('test')
  console.log('创建一张名为 test 的表', collection)
  for (var i = 0; i < 100; i++) {
    // 增加
    collection.add({
      xxx: i,
      yyy: [i],
      zzz: i % 2 ? 'aa' : 'bb'
    })
  }
  console.log('插入 100 条随机数据', collection.get())
}
// 查询
console.log('查询 xxx 在 10-20 之间的数据', collection.where({
  xxx: _.gte(10).and(_.lte(20))
}).get())
console.log('正则查询 zzz: /a+/', collection.where({
  zzz: /a+/
}).get())
console.log('结果降序排序', collection.orderBy('xxx', 'desc').get())
// 修改
collection.update({
  yyy: _.push(100)
})
console.log('更新数据 yyy 增加一个 100', collection.get())
// 删除
collection.where({
  xxx: _.gte(50)
}).remove()
console.log('删除 xxx 大于 50 的记录', collection.get())
```

例程二：设置过期时间
```javascript
localDB.init()
// 添加测试数据
var collection = localDB.createCollection('article')
for (var i = 0; i < 100; i++)
  collection.add({
    content: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    _timeout: Date.now() + i * 1000 // 设置过期时间
  })
// 模拟定期清理
setTimeout(() => {
  localDB.collection('article').where({
    _timeout: _.exists(true).and(_.lt(Date.now())) // 清除所有超时时间小于当前的记录
  }).remove()
}, 5000)
```

## api ##
### db ###
  
| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| init | / | / | 初始化数据库 |
| createCollection | name | Collection | 创建一个名称为 name 的集合 |
| removeCollection | name | / | 移除名称为 name 的集合 |
| collection | name | Collection | 获取名称为 name 的集合 |

### collection ###

| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| add | data | id | 向集合中添加一条数据 |
| doc | id | document | 获取一条记录 |
| where | query | collection | 进行条件查询 |
| limit | num | collection | 指定查询结果集数量上限 |
| skip | num | collection | 指定查询返回结果时从指定序列后的结果开始返回 |
| orderBy | field, order | collection | 指定查询排序条件 |
| get | / | array | 获取集合数据 |
| update | val | / | 更新多条数据 |
| remove | / | / | 删除多条数据 |

附：`limit` 和 `skip` 仅对 `get` 有效

### document ###

| 名称 | 输入值 | 返回值 | 功能 |
|:---:|:---:|:---:|:---:|
| get | / | data | 获取记录数据 |
| update | data | / | 更新记录数据 |
| remove | / | / | 删除该记录 |

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

还可以通过 `or` 和 `and` 进行组合，如  
```javascript
_.gt(30).and(_.lt(70)) // 大于 30 且小于 70
_.eq(0).or(_.eq(100)) // 等于 0 或等于 100
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