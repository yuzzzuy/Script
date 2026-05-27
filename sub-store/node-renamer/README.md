# Sub-Store Node Renamer 参数说明书

这个脚本用于统一 Sub-Store 节点名称。它会先从原始节点名和节点对象里解析出标准字段，再用 `format` 组装最终名称。

默认输出格式：

```text
{prefix} {region} ({type}) {serial} [{rate}] {route} {ability} {tags}
```

默认排序和编号依据：

```text
sort=prefix,region,type,extra,rate,detail,route,ability,tags,name
serialBy=prefix,region
```

字段为空时会自动跳过。例如没有 `type` 或 `rate` 时，`({type})`、`[{rate}]` 会整块跳过，不会留下空括号或空中括号。

## 标准字段

| Field | 含义 | 来源 | 示例 |
| --- | --- | --- | --- |
| `prefix` | 自定义前缀 | 参数 `prefix` | `VIP` |
| `region` | 国家/地区显示 | 节点名识别 + 参数 `region` | `🇭🇰 香　港（HK）` |
| `serial` | 编号 | 参数 `serial` / `serialBy` | `01` |
| `route` | 线路描述，支持多个 | 节点名识别 + 参数 `route` | `IPLC 游戏 专线` |
| `rate` | 倍率 | 节点名识别 + 参数 `rate` | `2×` |
| `type` | 协议类型，会自动简写常见长类型 | 节点对象 `type` / `protocol` / `proxy-type` | `vless` / `hy2` |
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
| `sort` | `prefix,region,type,extra,rate,detail,route,ability,tags,name` | 控制最终节点排序 |
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
| `all` | `🇭🇰 香　港（HK）` |
| `flag-name` | `🇭🇰 香　港` |
| `flag` | `🇭🇰` |
| `name` | `香　港` |
| `code` | `HK` |
| `full` | `Hong Kong` |
| `name-code` | `香　港（HK）` |

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

自定义关键词保留/替换。内置能力信息 `原生`、`GPT`、`AI` 会进入 `ability` 字段；`tags` 只处理你自己配置的规则。

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
{prefix} {region} ({type}) {serial} [{rate}] {route} {ability} {tags}
```

示例：

```text
#format={prefix}%20{region}%20({type})%20{serial}%20[{rate}]%20{route}%20{ability}%20{tags}
```

默认结构是：前缀、国家/地区、类型、编号、倍率、额外信息。倍率默认用 `[{rate}]` 包起来，例如 `[2×]`；线路、能力、自定义标签属于后面的额外信息。

脚本会按当前输出批次自动做类似表格的左对齐：每个有值的 `format` 片段都会按同列最大宽度补空格，中文按双宽字符计算；空字段会跳过，不会为了空倍率列把后面的线路描述推远。

常见长协议类型会自动简写，例如 `shadowsocks -> ss`、`hysteria2 -> hy2`、`wireguard -> wg`、`shadowtls -> stls`。

### `sort`

控制最终节点排序，默认 `prefix,region,type,extra,rate,detail,route,ability,tags,name`。支持多个字段组合排序，类似 SQL 的 `ORDER BY`。

默认排序可以理解为：

```text
先按 prefix / region / type 分组
再把没有额外信息的基础节点放前面
再按倍率数值排序，没有倍率按 1 倍处理
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

- `DIRECT` / `direct` 永远排最前。
- 正常可识别地区的节点排中间。
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
#prefix=VIP&match=auto&region=all&serial=always&serialBy=prefix,region&route=zh&rate=plain&tags=流媒体>流媒+晚高峰>晚峰&format={prefix}%20{region}%20({type})%20{serial}%20[{rate}]%20{route}%20{ability}%20{tags}&sort=prefix,region,type,extra,rate,detail,route,ability,tags,name&special=特殊
```

输入节点：

| 原始名称 | type | 说明 |
| --- | --- | --- |
| `DIRECT` | 空 | 直连节点 |
| `Korea` | `trojan` | 韩国基础节点 |
| `Korea 2x` | `trojan` | 韩国、2 倍 |
| `Korea 家宽 6x 原生 GPT 流媒体` | `trojan` | 韩国、家宽、6 倍、原生、GPT、自定义标签 |
| `Korea 家宽 AI 晚高峰` | `vless` | 韩国、家宽、AI、自定义标签 |
| `Hong Kong` | `vless` | 香港基础节点 |
| `Hong Kong IPLC 2x 原生` | `vless` | 香港、IPLC、2 倍、原生 |
| `TW 游戏 3x GPT` | `ss` | 台湾省、游戏、3 倍、GPT |
| `Fast-B1-1` | `ss` | 无法识别国家/地区 |

输出示例：

```text
DIRECT
VIP 🇭🇰 香　港（HK） (vless)  01
VIP 🇭🇰 香　港（HK） (vless)  02 [2×] IPLC 原生
VIP 🇰🇷 韩　国（KR） (trojan) 01
VIP 🇰🇷 韩　国（KR） (trojan) 02 [2×]
VIP 🇰🇷 韩　国（KR） (trojan) 03 [6×] 家宽 原生 GPT 流媒
VIP 🇰🇷 韩　国（KR） (vless)  04 家宽 AI   晚峰
VIP 🇨🇳 台　湾（TW） (ss)     01 [3×] 游戏 GPT
特殊 Fast-B1-1
```

说明：

- `DIRECT` 固定排最前。
- 香港、韩国、台湾省按地区排序并正常重命名。
- 同地区内会先按 `type` 聚合，再按基础节点、倍率、额外信息长度排序。
- 韩国节点同属 `prefix + region`，所以编号按最终排序结果连续递增。
- `route=zh` 输出 `家宽`、`游戏` 这类中文线路描述。
- 默认 `format` 使用 `[{rate}]`，所以 `rate=plain` 会显示为 `[2×]`、`[3×]`、`[6×]`。
- `type` 放在地区后面并用 `({type})` 包起来；没有 `type` 时整块跳过。
- `原生`、`GPT`、`AI` 自动进入 `ability`。
- `流媒体`、`晚高峰` 根据 `tags` 映射为 `流媒`、`晚峰`。
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
