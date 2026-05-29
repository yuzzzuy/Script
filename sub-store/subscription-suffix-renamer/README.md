# Sub-Store Subscription Suffix Renamer 参数说明书

这个脚本用于给 Sub-Store 节点名追加订阅来源后缀，后缀统一输出为 `[后缀]`。

典型用途：

- 多个订阅合并后，给每个节点标记来源订阅。
- 给整组节点追加固定标签，例如 `[主力]`、`[备用]`。
- 按订阅名映射不同后缀，例如 `Alpha` 输出 `[主力]`，`Beta` 输出 `[备用]`。

## 脚本地址

```text
https://raw.githubusercontent.com/yuzzzuy/Script/refs/heads/main/sub-store/subscription-suffix-renamer/rename.js
```

## 参数总览

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `suffix` | 空 | 给所有节点追加固定后缀 |
| `map` / `suffixMap` | 空 | 按订阅名映射后缀 |
| `field` / `sourceField` | 自动探测 | 指定订阅名字段 |
| `separator` | 空格 | 节点名与后缀之间的分隔符 |

## 固定后缀

```text
#suffix=主力
```

输出示例：

```text
HK 01 [主力]
JP 01 [主力]
```

`suffix` 可以写成 `主力` 或 `[主力]`，脚本都会统一输出为 `[主力]`。

## 按订阅名映射

```text
#map=Alpha=主力,Beta=备用
```

当节点对象里的订阅名字段为 `Alpha` 时输出 `[主力]`，为 `Beta` 时输出 `[备用]`，没有命中映射的节点保持原名。

支持的分隔符：

```text
Alpha=主力,Beta=备用
Alpha:主力;Beta:备用
Alpha：主力，Beta：备用
```

## 指定订阅字段

默认会依次尝试以下字段读取订阅名：

```text
subName, subscription, subscriptionName, subscription_name, source, sourceName, source_name, collection, collectionName, collection_name, provider, _subName, _subscription
```

如果你的 Sub-Store 节点对象使用了自定义字段，可以指定：

```text
#field=provider&map=机场A=A,机场B=B
```

## 幂等处理

如果节点名已经以相同后缀结尾，脚本不会重复追加。

```text
HK 01 [主力]
```

再次处理后仍然是：

```text
HK 01 [主力]
```

## 本地验证

```bash
node sub-store/subscription-suffix-renamer/test/run.js
node --check sub-store/subscription-suffix-renamer/rename.js
```
