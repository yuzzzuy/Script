# Sub-Store Node Renamer

一个用于 Sub-Store 的节点重命名脚本。脚本会先把节点名解析成标准字段，再通过 `format` 模板组装最终名称，适合需要统一地区、编号、线路属性、倍率和自定义标签的订阅整理场景。

## Features

- 支持自动识别中文名、英文缩写、英文全名和国旗地区。
- 支持按标准字段组装节点名：`prefix`、`region`、`serial`、`route`、`rate`、`tags`。
- 支持 `format` 自定义字段顺序，字段为空时自动跳过，不留下多余分隔符。
- 支持两字中文地区名视觉对齐，例如 `香　港`、`日　本`、`美　国`。
- 支持倍率显示为上标、普通文本或括号样式。
- 支持提取线路属性，例如 `IPLC`、`IEPL`、`家宽`、`Game`、`GPT`。
- 支持保留内部编号节点并放到末尾，例如 `Fast-B1-1`、`JP-Dedicated-F3-1`。
- 支持将 `DIRECT` / `direct` 直连节点固定放到最前。
- 台湾省显示为中国国旗。

## Usage

在 Sub-Store 的脚本操作中添加 `rename.optimized.js`，参数以 `#` 开头，多个参数使用 `&` 连接。

```text
#region=all&rate=sup&route=auto
```

完整示例：

```text
#prefix=VIP&region=all&route=auto&rate=sup&tags=A>原生+GPT&format={prefix}%20{region}%20{serial}%20{route}%20{rate}%20{tags}
```

示例输出：

```text
VIP 🇭🇰 香　港（HK） 01 IPLC ˣ² 原生 GPT
```

## Naming Model

脚本会把每个节点解析为以下标准字段：

| Field | Description | Example |
| --- | --- | --- |
| `prefix` | 自定义前缀，默认空 | `VIP` |
| `region` | 地区显示 | `🇭🇰 香　港（HK）` |
| `serial` | 编号 | `01` |
| `route` | 线路属性 | `IPLC` |
| `rate` | 倍率 | `ˣ²` |
| `tags` | 保留标签 | `原生 GPT` |

默认模板：

```text
{prefix} {region} {serial} {route} {rate} {tags}
```

如果某个字段为空，会自动跳过。例如 `prefix` 和 `tags` 为空时：

```text
🇭🇰 香　港（HK） 01 IPLC ˣ²
```

## Parameters

### `prefix`

自定义前缀，默认空。

```text
#prefix=VIP
```

### `input`

控制地区输入识别格式，默认自动识别。

| Value | Description |
| --- | --- |
| `auto` | 自动识别中文名、国旗、英文全名、英文缩写 |
| `name` / `cn` / `zh` | 只按中文地区名识别 |
| `code` / `abbr` / `us` | 只按英文缩写识别 |
| `full` / `quan` | 只按英文全名识别 |
| `flag` / `gq` | 只按国旗识别 |

### `region`

控制地区字段的显示样式。

| Value | Example |
| --- | --- |
| `all` | `🇭🇰 香　港（HK）` |
| `flag-name` | `🇭🇰 香　港` |
| `flag` | `🇭🇰` |
| `name` | `香　港` |
| `code` | `HK` |
| `full` | `Hong Kong` |
| `name-code` | `香　港（HK）` |

默认值：`all`。

### `serial`

控制编号字段。

| Value | Description |
| --- | --- |
| `always` | 总是显示编号，默认值 |
| `auto` | 仅同名节点重复时显示编号 |
| `off` | 不显示编号 |

### `route`

控制线路属性字段。

| Value | Description |
| --- | --- |
| `auto` | 自动提取线路属性，默认值 |
| `off` | 不显示线路属性 |

常见线路属性包括：`IPLC`、`IEPL`、`Kern`、`Edge`、`Pro`、`Std`、`Exp`、`Biz`、`Fam`、`Game`、`Buy`、`Zx`、`LB`、`CF`、`UDP`、`GPT`、`UDPN`。

### `rate`

控制倍率字段。

| Value | Example |
| --- | --- |
| `sup` | `ˣ²` |
| `plain` | `2×` |
| `paren` | `(2×)` |
| `off` | 不显示倍率 |

默认值：`sup`。

### `tags`

控制保留标签。使用 `+` 分隔多个规则，使用 `source>display` 设置替换显示。

```text
#tags=原生+GPT+A>高级
```

含义：

- 节点名包含 `原生` 时，输出 `原生`
- 节点名包含 `GPT` 时，输出 `GPT`
- 节点名包含 `A` 时，输出 `高级`

### `format`

控制最终字段顺序。字段为空时自动跳过。

```text
#format={prefix}%20{region}%20{serial}%20{route}%20{rate}%20{tags}
```

把编号放到最后：

```text
#format={prefix}%20{region}%20{route}%20{rate}%20{tags}%20{serial}
```

### `unresolved`

控制未解析内部编号节点的前置标识，默认值为 `特殊`。

```text
#unresolved=未识别
```

内部编号节点不会参与地区、线路、倍率解析，会保留原始名称并放到正常节点后面：

```text
特殊 Fast-B1-1
特殊 JP-Dedicated-F3-1
特殊 SG-X5-1
```

`DIRECT` / `direct` 直连节点会保留原名并固定放到列表最前：

```text
DIRECT
direct
```

### Other Options

这些参数保留为过滤或节点配置用途：

| Parameter | Description |
| --- | --- |
| `clear` | 过滤套餐、到期、流量、官网、客服等信息节点 |
| `nx` | 过滤倍率节点 |
| `blnx` | 只保留高倍率节点 |
| `key` | 使用脚本内置关键地区和编号规则过滤节点 |
| `blpx` | 将带倍率或线路属性的节点归组排序 |
| `blockquic=on` | 设置节点 `block-quic` 为 `on` |
| `blockquic=off` | 设置节点 `block-quic` 为 `off` |
| `nm` | 地区识别失败时仍保留节点 |
| `fgf` | 字段分隔符，默认空格 |

## Examples

默认风格：

```text
#region=all&route=auto&rate=sup
```

```text
🇭🇰 香　港（HK） 01 IPLC ˣ²
```

只显示地区缩写：

```text
#region=code&route=off&rate=off
```

```text
HK 01
```

自定义顺序：

```text
#prefix=VIP&region=all&route=auto&rate=plain&tags=原生&format={region}%20{route}%20{rate}%20{tags}%20{serial}%20{prefix}
```

```text
🇭🇰 香　港（HK） IPLC 2× 原生 01 VIP
```

重复节点自动编号：

```text
#serial=auto&region=all&route=auto&rate=sup
```

```text
🇭🇰 香　港（HK） 01 IPLC ˣ²
🇭🇰 香　港（HK） 02 IPLC ˣ²
```

单个节点在 `serial=auto` 时不显示编号：

```text
🇭🇰 香　港（HK） IPLC ˣ²
```

## Development

语法检查：

```bash
node --check sub-store/node-renamer/rename.optimized.js
```

快速行为验证：

```bash
node -e 'global.$arguments={region:"all",route:"auto",rate:"sup"}; const {operator}=require("./sub-store/node-renamer/rename.optimized.js"); console.log(operator([{name:"Hong Kong 2x IPLC"}]));'
```
