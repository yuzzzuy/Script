# Sub-Store Node Renamer 参数说明书

这个脚本用于统一 Sub-Store 节点名称。它会先从原始节点名和节点对象里解析出标准字段，再用 `format` 组装最终名称。

默认输出格式：

```text
{prefix} {region} {serial} [{type}][{rate}][{route}][{ability}]
```

默认排序和编号依据：

```text
sort=prefix,region,extra,rate,type,detail,route,ability,tags,name
serialBy=prefix,region
```

字段为空时会自动跳过。例如没有 `type` 或标签信息时，`[{type}][{rate}][{route}][{ability}]` 会整块跳过，不会留下空中括号或多余空格。

## 标准字段

| Field | 含义 | 来源 | 示例 |
| --- | --- | --- | --- |
| `prefix` | 自定义前缀 | 参数 `prefix` | `VIP` |
| `region` | 国家/地区显示 | 节点名识别 + 参数 `region` | `🇭🇰 香港（HK）` |
| `serial` | 编号 | 参数 `serial` / `serialBy` | `01` |
| `route` | 线路描述，支持多个 | 节点名识别 + 参数 `route` | `IPLC 游戏 专线` |
| `rate` | 倍率 | 节点名识别 + 参数 `rate` | `2×` |
| `type` | 协议类型，保留节点对象原值 | 节点对象 `type` / `protocol` / `proxy-type` | `vless` / `hysteria2` |
| `ability` | 能力信息 | 内置识别 | `原生 GPT` |
| `tags` | 自定义保留标签 | 参数 `tags` | `流媒` |

## 参数总览

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `prefix` | 空 | 给所有正常节点添加前缀 |
| `match` | `auto` | 控制国家/地区识别使用的输入类型 |
| `region` | `all` | 控制地区字段显示样式 |
| `serial` | `always` | 控制编号是否显示 |
| `serialBy` | `prefix,region` | 控制编号按哪些字段分组 |
| `route` | `zh` | 控制线路描述语言或关闭线路描述 |
| `rate` | `plain` | 控制倍率显示样式 |
| `tags` | 空 | 自定义关键词保留/替换 |
| `format` | 见默认格式 | 控制最终字段顺序 |
| `sort` | `prefix,region,extra,rate,type,detail,route,ability,tags,name` | 控制最终节点排序 |
| `special` | `特殊` | 控制无法识别国家/地区节点的前置标识 |

## 参数详解

### `prefix`

自定义前缀，默认空。

```text
#prefix=VIP
```

### `match`

控制国家/地区识别使用的输入类型，默认 `auto`。

| 值 | 说明 |
| --- | --- |
| `auto` | 自动识别中文名、国旗、英文全名、英文缩写 |
| `name` | 只按中文地区名识别 |
| `code` | 只按英文缩写识别 |
| `full` | 只按英文全名识别 |
| `flag` | 只按国旗识别 |

### `region`

控制地区字段显示样式，默认 `all`。

| 值 | 示例 |
| --- | --- |
| `all` | `🇭🇰 香港（HK）` |
| `flag-name` | `🇭🇰 香港` |
| `flag` | `🇭🇰` |
| `name` | `香港` |
| `code` | `HK` |
| `full` | `Hong Kong` |
| `name-code` | `香港（HK）` |

台湾省的国旗会统一显示为中国国旗。

### `serial`

控制编号字段，默认 `always`。

| 值 | 说明 |
| --- | --- |
| `always` | 总是显示编号 |
| `auto` | 仅同组节点重复时显示编号 |
| `off` | 不显示编号 |

### `serialBy`

控制编号分组依据，默认 `prefix,region`。同一个前缀、同一个地区会连续编号，即使协议、线路、倍率不同，也继续递增。

```text
#serialBy=prefix,region
#serialBy=type,region
```

可用字段：

```text
prefix,type,region,extra,route,rate,ability,tags,name
```

通常保持默认 `prefix,region` 就行；如果你希望不同协议类型分别从 `01` 开始，可以设置为 `prefix,region,type`。

### `route`

控制线路描述字段，默认 `zh`。

| 值 | 说明 |
| --- | --- |
| `zh` | 中文线路描述，例如 `家宽`、`游戏`、`专线` |
| `en` | 英文缩写，例如 `Fam`、`Game`、`Zx` |
| `off` | 不显示线路描述 |

`IPLC`、`IEPL`、`LB`、`CF`、`UDP`、`UDPN` 这类常见缩写在中文模式下也保留缩写。
如果节点名同时包含多个线路描述，会按命中顺序全部输出并自动去重，例如 `IPLC游戏专线` 会输出 `IPLC 游戏 专线`。

### `rate`

控制倍率字段，默认 `plain`。

| 值 | 示例 |
| --- | --- |
| `plain` | `2×` |
| `sup` | `ˣ²` |
| `paren` | `(2×)` |
| `off` | 不显示倍率 |

### `tags`

自定义关键词保留/替换。内置能力信息 `原生`、`GPT`、`AI` 会进入 `ability` 字段；节点资源、兼容性、计费和优先级这类信息会进入 `tags` 字段。

内置 `tags` 字典：

| 命中关键词 | 中文标签 |
| --- | --- |
| `No Geo Tag` / `Cross-region cluster` | `跨区集群` |
| `Fixed` / `Fixed IP` | `固定IP` |
| `X2` / `2x traffic billing` | `2倍计费` |
| `IPv6` / `Dedicated IPv6` | `独享IPv6` |
| `Fast` / `Speed priority` | `速度优先` |
| `Balancer` / `Availability priority` | `可用性优先` |
| `Netflix` / `Netflix supported` | `奈飞` |
| `Dedicated` / `Baremetal server` | `独立服务器` |
| `D1` / `D2` / `No rate limiting` | `不限速` |

参数 `tags` 用来追加你自己的关键词规则。

规则格式：

```text
#tags=原关键词>输出标签+另一个关键词>另一个标签
```

示例：

```text
#tags=流媒体>流媒+晚高峰>晚峰
```

### `format`

控制最终字段顺序。字段为空会自动跳过。

默认值：

```text
{prefix} {region} {serial} [{type}][{rate}][{route}][{ability}]
```

示例：

```text
#format={prefix}%20{region}%20{serial}%20[{type}][{rate}][{route}][{ability}]
```

默认结构是：前缀、国家/地区、编号、类型/倍率/线路/能力标签组。`type`、`rate`、`route`、`ability`、`tags` 在同一个 `format` 片段里连续相邻时，会触发“磁吸”渲染，统一输出为连续中括号，例如 `[vless][2×][IPLC][原生]`。

自定义 `format` 仍然是最高优先级，使用原始字段即可，例如 `{type}`、`{rate}`、`{route}`、`{ability}`、`{tags}`。只有这些字段连续挨着时才会磁吸；如果中间有空格、文字或其他分隔符，就完全按你写的格式输出。默认格式不输出 `{tags}`，需要保留自定义标签时，可以在 `format` 里自行加入 `{tags}`。

```text
# 磁吸：输出 [vless][2×][IPLC][原生][奈飞]
#format={region}%20{serial}%20{type}{rate}{route}{ability}{tags}

# 不磁吸：输出 vless 2× IPLC 原生 奈飞
#format={region}%20{serial}%20{type}%20{rate}%20{route}%20{ability}%20{tags}
```

脚本会在最终列表生成后，按每个 `format` 片段所在列的最长显示宽度补齐；中文按双宽字符计算。空字段会跳过，不会为了空倍率列把后面的线路描述推远。

协议类型会保留节点对象里的原始值，不做缩写；例如 `trojan` 仍显示为 `trojan`，`vless` 仍显示为 `vless`。最终宽度按完整输出列表计算，长类型会参与对齐。

### `sort`

控制最终节点排序，默认 `prefix,region,extra,rate,type,detail,route,ability,tags,name`。支持多个字段组合排序，类似 SQL 的 `ORDER BY`。

默认排序可以理解为：

```text
先按 prefix / region 分组
再把没有额外信息的基础节点放前面
再按倍率数值排序，没有倍率按 1 倍处理
同倍率内再按 type 聚合
再按额外信息长度从短到长排序
最后按 route / ability / tags / 原始名称兜底排序
```

```text
#sort=prefix,region,route,rate,ability,tags,name
```

可用字段：

```text
prefix,type,region,extra,rate,detail,serial,route,ability,tags,name
```

其中 `extra` 只区分“是否有额外信息”，额外信息包含 `route`、`rate`、`ability`、`tags`；`detail` 用于让额外信息更短的节点排在更长的节点前面。

排序固定规则：

- `DIRECT` / `direct` 会被过滤。
- 正常可识别地区的节点排前面。
- 无法识别地区的节点排最后。

### `special`

控制无法识别国家/地区节点的前置标识，默认 `特殊`。

```text
#special=未识别
```

示例：

```text
特殊 Fast-B1-1
```

## 大用例

参数：

```text
#prefix=VIP&match=auto&region=all&serial=always&serialBy=prefix,region&route=zh&rate=plain&tags=流媒体>流媒+晚高峰>晚峰&format={prefix}%20{region}%20{serial}%20[{type}][{rate}][{route}][{ability}][{tags}]&sort=prefix,region,extra,rate,type,detail,route,ability,tags,name&special=特殊
```

输入节点：

| 原始名称 | type | 说明 |
| --- | --- | --- |
| `Korea` | `trojan` | 韩国基础节点 |
| `Korea X2` | `trojan` | 韩国、2 倍计费 |
| `Korea 家宽 6x 原生 GPT 流媒体` | `trojan` | 韩国、家宽、6 倍、原生、GPT、自定义标签 |
| `Korea 家宽 AI 晚高峰` | `vless` | 韩国、家宽、AI、自定义标签 |
| `Hong Kong` | `vless` | 香港基础节点 |
| `Hong Kong IPLC 2x 原生 Netflix` | `vless` | 香港、IPLC、2 倍、原生、奈飞 |
| `TW 游戏 3x GPT` | `ss` | 台湾省、游戏、3 倍、GPT |
| `Japan Dedicated IPv6 D1` | `hysteria2` | 日本、独享 IPv6、不限速 |
| `US Fast Balancer Fixed` | `vless` | 美国、速度优先、可用性优先、固定 IP |
| `Fast-B1-1` | `ss` | 无法识别国家/地区 |

输出示例：

```text
VIP 🇭🇰 香港（HK） 01 [vless]
VIP 🇭🇰 香港（HK） 02 [vless][2×][IPLC][原生][奈飞]
VIP 🇯🇵 日本（JP） 01 [hysteria2][独享IPv6][不限速]
VIP 🇰🇷 韩国（KR） 01 [trojan]
VIP 🇰🇷 韩国（KR） 02 [vless][家宽][AI][晚峰]
VIP 🇰🇷 韩国（KR） 03 [trojan][2×][2倍计费]
VIP 🇰🇷 韩国（KR） 04 [trojan][6×][家宽][原生][GPT][流媒]
VIP 🇨🇳 台湾（TW） 01 [ss][3×][游戏][GPT]
VIP 🇺🇸 美国（US） 01 [vless][固定IP][速度优先][可用性优先]
特殊 Fast-B1-1
```

说明：

- `DIRECT` 会被过滤，不进入最终列表。
- 香港、韩国、台湾省按地区排序并正常重命名。
- 同地区内会先放基础节点，再按倍率从低到高排序，同倍率内再按 `type` 聚合。
- 韩国节点同属 `prefix + region`，所以编号按最终排序结果连续递增。
- `route=zh` 输出 `家宽`、`游戏` 这类中文线路描述。
- 默认 `format` 让 `type`、`rate`、`route`、`ability` 连续相邻，所以会显示为 `[vless][2×][IPLC][原生]` 这种连续标签。
- `type` 保留节点对象原值；没有 `type` 时对应标签会自动跳过。
- `原生`、`GPT`、`AI` 自动进入 `ability`。
- `Fixed`、`Netflix`、`D1` 等内置字典会进入 `tags`；`流媒体`、`晚高峰` 根据参数 `tags` 映射为 `流媒`、`晚峰`。
- `Fast-B1-1` 无法识别国家/地区，所以加 `特殊` 并排最后。

## Development

语法检查：

```bash
node --check sub-store/node-renamer/rename.optimized.js
```

快速行为验证：

```bash
node -e 'global.$arguments={region:"all",route:"zh",rate:"plain"}; const {operator}=require("./sub-store/node-renamer/rename.optimized.js"); console.log(operator([{name:"Hong Kong 2x IPLC"}]));'
```
