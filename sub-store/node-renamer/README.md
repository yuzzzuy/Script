# Sub-Store Node Renamer 参数说明书

这个脚本用于统一 Sub-Store 节点名称。它会先从原始节点名和节点对象里解析出标准字段，再用 `format` 组装最终名称。

默认输出格式：

```text
{prefix} {region} {serial} {route} {rate} ({type}) {ability} {tags}
```

默认排序和编号依据：

```text
sort=prefix,region
serialBy=prefix,region
```

字段为空时会自动跳过。例如没有 `type` 时，`({type})` 会整块跳过，不会留下空括号。

## 标准字段

| Field | 含义 | 来源 | 示例 |
| --- | --- | --- | --- |
| `prefix` | 自定义前缀 | 参数 `prefix` | `VIP` |
| `region` | 国家/地区显示 | 节点名识别 + 参数 `region` | `🇭🇰 香　港（HK）` |
| `serial` | 编号 | 参数 `serial` / `serialBy` | `01` |
| `route` | 线路描述 | 节点名识别 + 参数 `route` | `家宽` |
| `rate` | 倍率 | 节点名识别 + 参数 `rate` | `2×` |
| `type` | 协议类型 | 节点对象 `type` / `protocol` / `proxy-type` | `vless` |
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
| `sort` | `prefix,region` | 控制最终节点排序 |
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
prefix,type,region,route,rate,ability,tags,name
```

### `route`

控制线路描述字段，默认 `zh`。

| 值 | 说明 |
| --- | --- |
| `zh` | 中文线路描述，例如 `家宽`、`游戏`、`专线` |
| `en` | 英文缩写，例如 `Fam`、`Game`、`Zx` |
| `off` | 不显示线路描述 |

`IPLC`、`IEPL`、`LB`、`CF`、`UDP`、`UDPN` 这类常见缩写在中文模式下也保留缩写。

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
{prefix} {region} {serial} {route} {rate} ({type}) {ability} {tags}
```

示例：

```text
#format={prefix}%20{region}%20{serial}%20{route}%20{rate}%20({type})%20{ability}%20{tags}
```

### `sort`

控制最终节点排序，默认 `prefix,region`。支持多个字段组合排序，类似 SQL 的 `ORDER BY`。

```text
#sort=prefix,region,route,rate,ability,tags,name
```

可用字段：

```text
prefix,type,region,serial,route,rate,ability,tags,name
```

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
#prefix=VIP&match=auto&region=all&serial=always&serialBy=prefix,region&route=zh&rate=plain&tags=流媒体>流媒+晚高峰>晚峰&format={prefix}%20{region}%20{serial}%20{route}%20{rate}%20({type})%20{ability}%20{tags}&sort=prefix,region,route,rate,ability,tags,name&special=特殊
```

输入节点：

| 原始名称 | type | 说明 |
| --- | --- | --- |
| `DIRECT` | 空 | 直连节点 |
| `Korea 家宽 6x 原生 GPT 流媒体` | `trojan` | 韩国、家宽、6 倍、原生、GPT、自定义标签 |
| `Korea 家宽 AI 晚高峰` | `vless` | 韩国、家宽、AI、自定义标签 |
| `Hong Kong IPLC 2x 原生` | `vless` | 香港、IPLC、2 倍、原生 |
| `TW 游戏 3x GPT` | `ss` | 台湾省、游戏、3 倍、GPT |
| `Fast-B1-1` | `ss` | 无法识别国家/地区 |

输出示例：

```text
DIRECT
VIP 🇭🇰 香　港（HK） 01 IPLC 2× (vless) 原生
VIP 🇰🇷 韩　国（KR） 01 家宽 6× (trojan) 原生 GPT 流媒
VIP 🇰🇷 韩　国（KR） 02 家宽 (vless) AI 晚峰
VIP 🇨🇳 台　湾（TW） 01 游戏 3× (ss) GPT
特殊 Fast-B1-1
```

说明：

- `DIRECT` 固定排最前。
- 香港、韩国、台湾省按地区排序并正常重命名。
- 韩国两个节点同属 `prefix + region`，所以编号连续为 `01`、`02`。
- `route=zh` 输出 `家宽`、`游戏` 这类中文线路描述。
- `rate=plain` 输出 `2×`、`3×`、`6×`。
- `type` 用 `({type})` 包起来；没有 `type` 时整块跳过。
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
