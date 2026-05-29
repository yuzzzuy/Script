/**
 * Sub-Store 节点重命名脚本
 *
 * 参数说明：
 * - 参数以 # 开头，多个参数用 & 连接，例如：#region=all&rate=sup&route=zh
 * - 命名先解析为 prefix/type/region/serial/route/rate/ability/tags 字段，再由 format 组装
 * - format 中字段为空会自动跳过，不留下多余分隔符
 * - sort 控制最终排序字段，默认按 prefix + region 分组，再按倍率和额外信息排序
 * - serialBy 控制编号分组字段，默认按 prefix + region 分组
 * - route 控制线路描述语言或开关，默认中文，可切换为英文缩写或关闭
 * - match 控制地区识别输入格式，默认自动识别；region/rate/route/serial/tags 控制各字段显示
 *
 * 维护说明：
 * - 国家/地区数组的顺序就是映射关系，不能单独调整其中一个数组
 * - 正则匹配统一通过 regexTest / regexReplace，避免 global/sticky 正则的 lastIndex 串味
 */

/* global $arguments */

const inArg =
  typeof $arguments === "object" && $arguments !== null ? $arguments : {};
const FIELD_SEPARATOR = " ";
const CONFIG = {
  defaults: {
    format:
      "{prefix} {region} {serial} [{type}][{rate}][{route}][{ability}][{tags}]",
    route: "zh",
    rate: "plain",
    special: "特殊",
    sort: [
      "prefix",
      "region",
      "extra",
      "rate",
      "type",
      "detail",
      "route",
      "ability",
      "tags",
      "name",
    ],
    serialBy: ["prefix", "region"],
  },
  magneticFields: ["type", "rate", "route", "ability", "tags"],
  typeRules: [
    { regex: /\bvless\b|vless:\/\//i, value: "vless" },
    { regex: /\btrojan\b|trojan:\/\//i, value: "trojan" },
    { regex: /\bvmess\b|vmess:\/\//i, value: "vmess" },
    { regex: /\bshadowsocks\b|shadowsocks:\/\//i, value: "shadowsocks" },
    { regex: /\bssr\b|ssr:\/\//i, value: "ssr" },
    { regex: /\bss\b|ss:\/\//i, value: "ss" },
    { regex: /\bhysteria2\b|hy2:\/\//i, value: "hysteria2" },
    { regex: /\bhysteria\b|hy:\/\//i, value: "hysteria" },
    { regex: /\btuic\b|tuic:\/\//i, value: "tuic" },
    { regex: /\bwireguard\b|\bwg\b/i, value: "wireguard" },
    { regex: /\bshadowtls\b|shadowtls:\/\//i, value: "shadowtls" },
    { regex: /\banytls\b|anytls:\/\//i, value: "anytls" },
    { regex: /\bnaive\b|naiveproxy|naive:\/\//i, value: "naive" },
    { regex: /\bsocks5?\b|socks5?:\/\//i, value: "socks" },
    { regex: /\bhttps?\b|https?:\/\//i, value: "http" },
  ],
  matchInputAliases: {
    cn: "cn",
    zh: "cn",
    abbr: "us",
    code: "us",
    us: "us",
    en: "us",
    full: "quan",
    quan: "quan",
    gq: "gq",
    flag: "gq",
  },
  regionStyleAliases: {
    cn: "name",
    zh: "name",
    abbr: "code",
    us: "code",
    en: "code",
    quan: "full",
    gq: "flag",
    cnabbr: "name-code",
    "cn-abbr": "name-code",
    namecode: "name-code",
    "name-code": "name-code",
    standard: "flag-name",
    "flag-name": "flag-name",
  },
  regionStyles: [
    "all",
    "flag",
    "name",
    "code",
    "full",
    "name-code",
    "flag-name",
  ],
  abilityRules: [
    { regex: /原生|\bnative\b/i, value: "原生" },
    { regex: /\bgpt\b|chatgpt|openai/i, value: "GPT" },
    { regex: /\bai\b|人工智能/i, value: "AI" },
    { regex: /\bclaude\b|\banthropic\b/i, value: "Claude" },
    { regex: /\bgemini\b|\bbard\b/i, value: "Gemini" },
    { regex: /\bgrok\b|\bxai\b/i, value: "Grok" },
    { regex: /\bpoe\b/i, value: "Poe" },
    { regex: /\bsora\b/i, value: "Sora" },
    { regex: /\bcopilot\b/i, value: "Copilot" },
    { regex: /\bperplexity\b/i, value: "Perplexity" },
    { regex: /\bmidjourney\b/i, value: "Midjourney" },
  ],
  tagRules: [
    {
      regex: /no[\s-]*geo[\s-]*tag|cross[\s-]*region[\s-]*cluster/i,
      value: "跨区集群",
    },
    { regex: /\bfixed\b|fixed[\s-]*ip/i, value: "固定IP" },
    { regex: /\bx2\b|2x[\s-]*traffic[\s-]*billing/i, value: "2倍计费" },
    { regex: /\bipv6\b|dedicated[\s-]*ipv6/i, value: "独享IPv6" },
    { regex: /\bfast\b|speed[\s-]*priority/i, value: "速度优先" },
    {
      regex: /\bbalancer\b|availability[\s-]*priority/i,
      value: "可用性优先",
    },
    { regex: /\bnetflix\b|netflix[\s-]*supported/i, value: "奈飞" },
    {
      regex: /\bdedicated\b(?![\s-]*ipv6)|baremetal[\s-]*server/i,
      value: "独立服务器",
    },
    { regex: /\bd[12]\b|no[\s-]*rate[\s-]*limiting/i, value: "不限速" },
    { regex: /\bdisney(?:\+|[\s-]*plus)?\b/i, value: "迪士尼" },
    { regex: /\byoutube\b|\byt\b/i, value: "YouTube" },
    { regex: /\btiktok\b/i, value: "TikTok" },
    { regex: /\bspotify\b/i, value: "Spotify" },
    { regex: /\bhulu\b/i, value: "Hulu" },
    { regex: /\bapple[\s-]*tv\+?\b|\bappletv\b/i, value: "Apple TV" },
    { regex: /\bpeacock\b/i, value: "Peacock" },
    { regex: /\bparamount(?:\+|[\s-]*plus)?\b/i, value: "Paramount" },
    { regex: /\bcrunchyroll\b/i, value: "Crunchyroll" },
    { regex: /\bu[\s-]*next\b/i, value: "U-NEXT" },
    { regex: /\bviu\b/i, value: "Viu" },
    { regex: /\btvb\b|mytv[\s-]*super/i, value: "TVB" },
    { regex: /\bbilibili\b|哔哩|嗶哩|b站/i, value: "Bilibili" },
    { regex: /\biqiyi\b|爱奇艺|愛奇藝/i, value: "爱奇艺" },
    { regex: /\btelegram\b/i, value: "Telegram" },
    { regex: /\bsteam\b/i, value: "Steam" },
    { regex: /\btwitch\b/i, value: "Twitch" },
    { regex: /\bhbo\b|hbo[\s-]*max/i, value: "HBO" },
    { regex: /\bprime[\s-]*video\b|\bamazon[\s-]*prime\b/i, value: "Prime" },
    { regex: /\bdazn\b/i, value: "DAZN" },
    { regex: /bahamut|baha|巴哈姆特|巴哈/i, value: "巴哈" },
    { regex: /\babema\b/i, value: "Abema" },
    { regex: /动画疯/i, value: "动画疯" },
    { regex: /\bstreaming\b|\bmedia[\s-]*unlock\b|\bunlock\b|解锁|流媒体/i, value: "流媒" },
    { regex: /\bpremium\b|\bvip\b/i, value: "高级" },
    { regex: /\breality\b/i, value: "Reality" },
    { regex: /\bxtls\b/i, value: "XTLS" },
    { regex: /\btls\b/i, value: "TLS" },
    { regex: /\bwebsocket\b|\bws\b/i, value: "WS" },
    { regex: /\bgrpc\b/i, value: "gRPC" },
    { regex: /\bh2\b|http[\s/.-]*2/i, value: "H2" },
    { regex: /\bhttp3\b|\bh3\b|\bquic\b/i, value: "QUIC" },
    { regex: /\bbbr\b|\bbbr[\s-]*plus\b/i, value: "BBR" },
    { regex: /晚高峰|晚峰|peak[\s-]*time/i, value: "晚峰" },
    { regex: /low[\s-]*latency|低延迟/i, value: "低延迟" },
    { regex: /\bstable\b|\bstability\b|稳定/i, value: "稳定" },
    { regex: /住宅|家宽IP|\bresidential\b/i, value: "住宅" },
    { regex: /商宽IP|\bbusiness[\s-]*broadband\b/i, value: "商宽" },
    { regex: /落地|出口|\bexit\b/i, value: "出口" },
    { regex: /入口|\bentry\b|\bingress\b/i, value: "入口" },
    { regex: /绿云|\bgreencloud\b/i, value: "绿云" },
    { regex: /软银|\bsoftbank\b/i, value: "软银" },
    { regex: /CDN[\s-]*优选|cdn[\s-]*preferred|cdn[\s-]*optimized/i, value: "CDN优选" },
    { regex: /中国电信|(^|[^中华])电信(?!讯)|\bchina[\s-]*telecom\b|\bctgnet\b/i, value: "电信" },
    { regex: /中国联通|联通|\bchina[\s-]*unicom\b|\bcucn\b/i, value: "联通" },
    { regex: /中国移动|移动(?!端)|\bchina[\s-]*mobile\b|\bcmcc\b/i, value: "移动" },
    { regex: /三网优化|三网精品|三网回程/i, value: "三网优化" },
    { regex: /三网(?!优化|精品|回程)|三網/i, value: "三网" },
    { regex: /双网|双線|双线|dual[\s-]*isp/i, value: "双网" },
    { regex: /\bhkt\b/i, value: "HKT" },
    { regex: /\bpccw\b/i, value: "PCCW" },
    { regex: /\bhkbn\b/i, value: "HKBN" },
    { regex: /\bhgc\b/i, value: "HGC" },
    { regex: /\bwtt\b/i, value: "WTT" },
    { regex: /\bctm\b|澳门电讯|澳門電訊/i, value: "CTM" },
    { regex: /\bhinet\b|中华电信|中華電信/i, value: "HiNet" },
    { regex: /\bseednet\b/i, value: "Seednet" },
    { regex: /\btfn\b|台湾固网|台灣固網/i, value: "TFN" },
    { regex: /\baptg\b|亚太电信|亞太電信/i, value: "APTG" },
    { regex: /\bkddi\b/i, value: "KDDI" },
    { regex: /\bntt\b/i, value: "NTT" },
    { regex: /\biij\b/i, value: "IIJ" },
    { regex: /\bkt\b|korea[\s-]*telecom/i, value: "KT" },
    { regex: /\bsk\b|sk[\s-]*telecom/i, value: "SK" },
    { regex: /\blg[\s-]*u\+?\b/i, value: "LG U+" },
    { regex: /\baws\b|amazon[\s-]*(web[\s-]*services|ec2)/i, value: "AWS" },
    { regex: /\bazure\b|microsoft[\s-]*azure/i, value: "Azure" },
    { regex: /\bgcp\b|google[\s-]*cloud/i, value: "GCP" },
    { regex: /\boci\b|oracle[\s-]*cloud/i, value: "OCI" },
    { regex: /阿里云|\baliyun\b|\balibaba[\s-]*cloud\b|\bali[\s-]*cloud\b/i, value: "阿里云" },
    { regex: /腾讯云|\btencent[\s-]*cloud\b/i, value: "腾讯云" },
    { regex: /\bleaseweb\b/i, value: "LeaseWeb" },
    { regex: /\bsoftlayer\b|\bibm[\s-]*cloud\b/i, value: "SoftLayer" },
    { regex: /\bdmit\b/i, value: "DMIT" },
    { regex: /\blayerstack\b/i, value: "LayerStack" },
    { regex: /\bsunny[\s-]*vision\b|\bsunnyvision\b/i, value: "SunnyVision" },
    { regex: /\bvultr\b/i, value: "Vultr" },
    { regex: /\blinode\b/i, value: "Linode" },
    { regex: /\bdigital[\s-]*ocean\b/i, value: "DigitalOcean" },
    { regex: /\bovh\b/i, value: "OVH" },
    { regex: /\bhetzner\b/i, value: "Hetzner" },
  ],
  routeRules: [
    { regex: /\bIPLC\b/i, zh: "IPLC", en: "IPLC" },
    { regex: /\bIEPL\b/i, zh: "IEPL", en: "IEPL" },
    { regex: /\bMPLS\b/i, zh: "MPLS", en: "MPLS" },
    { regex: /精品网|精品线路|\bpremium[\s-]*route\b/i, zh: "精品", en: "Premium" },
    { regex: /核心/, zh: "核心", en: "Kern" },
    { regex: /边缘/, zh: "边缘", en: "Edge" },
    { regex: /高级/, zh: "高级", en: "Pro" },
    { regex: /标准/, zh: "标准", en: "Std" },
    { regex: /实验/, zh: "实验", en: "Exp" },
    { regex: /商宽/, zh: "商宽", en: "Biz" },
    { regex: /家宽/, zh: "家宽", en: "Fam" },
    { regex: /游戏|\bgame\b/i, zh: "游戏", en: "Game" },
    { regex: /购物/, zh: "购物", en: "Buy" },
    { regex: /专线/, zh: "专线", en: "Zx" },
    { regex: /中转|\brelay\b|\btransfer\b/i, zh: "中转", en: "Relay" },
    { regex: /隧道|\btunnel\b/i, zh: "隧道", en: "Tunnel" },
    { regex: /直连|\bdirect\b/i, zh: "直连", en: "Direct" },
    { regex: /\bBGP\b/i, zh: "BGP", en: "BGP" },
    { regex: /\bCTGNet\b/i, zh: "CTGNet", en: "CTGNet" },
    { regex: /\bCN2\b/i, zh: "CN2", en: "CN2" },
    { regex: /\bGIA\b/i, zh: "GIA", en: "GIA" },
    { regex: /\bGT\b/i, zh: "GT", en: "GT" },
    { regex: /\b163\b/, zh: "163", en: "163" },
    { regex: /\bCMIN2\b/i, zh: "CMIN2", en: "CMIN2" },
    { regex: /\bCMI\b/i, zh: "CMI", en: "CMI" },
    { regex: /\bCUG\b/i, zh: "CUG", en: "CUG" },
    { regex: /\bCUII\b|\bCUVIP\b|\bCU[\s-]*VIP\b/i, zh: "CUVIP", en: "CUVIP" },
    { regex: /AS4837|\b4837\b/, zh: "4837", en: "4837" },
    { regex: /AS4134|\b4134\b/, zh: "4134", en: "4134" },
    { regex: /AS9929|\b9929\b/, zh: "9929", en: "9929" },
    { regex: /\bDIA\b|dedicated[\s-]*internet[\s-]*access/i, zh: "DIA", en: "DIA" },
    { regex: /\banycast\b/i, zh: "Anycast", en: "Anycast" },
    { regex: /专用|\bdedicated\b(?![\s-]*ipv6)/i, zh: "专用", en: "Dedicated" },
    { regex: /\bLB\b/, zh: "LB", en: "LB" },
    { regex: /\bcloudflare\b/i, zh: "CF", en: "CF" },
    { regex: /\budp\b/i, zh: "UDP", en: "UDP" },
    { regex: /udpn\b/i, zh: "UDPN", en: "UDPN" },
  ],
  countryAliases: [
    { name: "GB", regex: /UK/g },
    { name: "B-G-P", regex: /BGP/g },
    { name: "Russia Moscow", regex: /Moscow/g },
    { name: "Korea Chuncheon", regex: /Chuncheon|Seoul/g },
    { name: "Hong Kong", regex: /Hongkong|HONG KONG/gi },
    { name: "United Kingdom London", regex: /London|Great Britain/g },
    { name: "Dubai United Arab Emirates", regex: /United Arab Emirates/g },
    {
      name: "Taiwan TW 台湾 🇹🇼",
      regex: /(台|Tai\s?wan|TW).*?🇨🇳|🇨🇳.*?(台|Tai\s?wan|TW)/g,
    },
    {
      name: "United States",
      regex: /USA|Los Angeles|San Jose|Silicon Valley|Michigan/g,
    },
    { name: "澳大利亚", regex: /澳洲|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/g },
    { name: "德国", regex: /(深|沪|呼|京|广|杭)德(?!.*(I|线))|法兰克福|滬德/g },
    { name: "香港", regex: /(深|沪|呼|京|广|杭)港(?!.*(I|线))/g },
    { name: "日本", regex: /(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))|东京|大坂/g },
    { name: "新加坡", regex: /狮城|(深|沪|呼|京|广|杭)新/g },
    {
      name: "美国",
      regex: /(深|沪|呼|京|广|杭)美|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|芝加哥/g,
    },
    { name: "波斯尼亚和黑塞哥维那", regex: /波黑共和国/g },
    { name: "印尼", regex: /印度尼西亚|雅加达/g },
    { name: "印度", regex: /孟买/g },
    { name: "阿联酋", regex: /迪拜|阿拉伯联合酋长国/g },
    { name: "孟加拉国", regex: /孟加拉/g },
    { name: "捷克", regex: /捷克共和国/g },
    { name: "台湾", regex: /新台|新北|台(?!.*线)/g },
    { name: "Taiwan", regex: /Taipei/g },
    { name: "韩国", regex: /春川|韩|首尔/g },
    { name: "Japan", regex: /Tokyo|Osaka/g },
    { name: "英国", regex: /伦敦/g },
    { name: "India", regex: /Mumbai/g },
    { name: "Germany", regex: /Frankfurt/g },
    { name: "Switzerland", regex: /Zurich/g },
    { name: "俄罗斯", regex: /莫斯科/g },
    { name: "土耳其", regex: /伊斯坦布尔/g },
    { name: "泰国", regex: /泰國|曼谷/g },
    { name: "法国", regex: /巴黎/g },
    { name: "United States", regex: /New York|Seattle|Dallas|Miami|Ashburn|Phoenix|Denver/g },
    { name: "Canada", regex: /Toronto|Vancouver|Montreal/g },
    { name: "Singapore", regex: /Singapore|狮城/g },
    { name: "Japan", regex: /Narita|Saitama|Yokohama|名古屋|大阪/g },
    { name: "Korea", regex: /Busan|Incheon|首尔|釜山/g },
    { name: "United Kingdom", regex: /Manchester|英国/g },
    { name: "Netherlands", regex: /Amsterdam|荷兰/g },
    { name: "Malaysia", regex: /Kuala[\s-]*Lumpur|吉隆坡/g },
    { name: "Philippines", regex: /Manila|马尼拉/g },
    { name: "Vietnam", regex: /Ho[\s-]*Chi[\s-]*Minh|Hanoi|胡志明|河内/g },
    { name: "G", regex: /\d\s?GB/gi },
    { name: "Esnc", regex: /esnc/gi },
  ],
  infoKeywords: [
    "套餐",
    "到期",
    "有效",
    "剩余",
    "版本",
    "已用",
    "过期",
    "失联",
    "测试",
    "官方",
    "网址",
    "备用",
    "群",
    "TEST",
    "客服",
    "网站",
    "获取",
    "订阅",
    "流量",
    "机场",
    "下次",
    "重置",
    "建议",
    "提示",
    "公告",
    "通知",
    "官址",
    "联系",
    "邮箱",
    "工单",
    "学术",
    "官网",
    "官方地址",
    "教程",
    "说明",
    "帮助",
    "频道",
    "TG群",
    "群组",
    "邀请",
    "返利",
    "余额",
    "账户",
    "账号",
    "更新",
    "刷新",
    "维护",
    "节点状态",
    "过期时间",
    "重置时间",
    "Traffic",
    "Reset",
    "Notice",
    "Website",
    "Official",
    "Support",
    "Channel",
    "USE",
    "USED",
    "TOTAL",
    "EXPIRE",
    "EMAIL",
    "距离下次重置",
    "剩余天数",
    "剩余流量",
  ],
};

const parsedFormat = parseFormat(inArg.format);
const parsedRoute = parseRouteOption(inArg.route);
const DEFAULT_SORT_FIELDS = CONFIG.defaults.sort;
const DEFAULT_SERIAL_BY_FIELDS = CONFIG.defaults.serialBy;
const MAGNETIC_FORMAT_FIELDS = listToLookup(CONFIG.magneticFields);

const options = {
  prefix: inArg.prefix === undefined ? "" : safeDecode(inArg.prefix),
  formatTokens: parseFormatTokens(parsedFormat),
  sort: parseSortFields(inArg.sort),
  serialBy: parseSerialByFields(inArg.serialBy),
  serial: parseSerialStyle(inArg.serial),
  routeEnabled: parsedRoute.enabled,
  routeLanguage: parsedRoute.lang,
  rate: parseRateStyle(inArg.rate),
  tags: inArg.tags === undefined ? "" : safeDecode(inArg.tags),
  special: parseSpecialLabel(inArg.special, inArg.unresolved),
};

function parseRegionStyle(value) {
  const style = value === undefined ? "all" : String(value).toLowerCase();
  const aliases = CONFIG.regionStyleAliases;
  const normalized = aliases[style] || style;
  const allowed = CONFIG.regionStyles;
  return allowed.indexOf(normalized) === -1 ? "all" : normalized;
}

function parseFormat(value) {
  if (value === undefined) {
    return CONFIG.defaults.format;
  }

  const format = safeDecode(value).trim();
  return format === "" ? CONFIG.defaults.format : format;
}

function parseFormatTokens(format) {
  return String(format)
    .trim()
    .split(/\s+/)
    .filter(function keepToken(token) {
      return token !== "";
    })
    .map(function parseToken(token) {
      const exactMatch = token.match(/^\{([A-Za-z][A-Za-z0-9_]*)\}$/);
      if (exactMatch) {
        return {
          exactField: exactMatch[1],
          fieldNames: [exactMatch[1]],
          template: token,
        };
      }

      const fieldNames = [];
      token.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, function collectField(
        match,
        fieldName
      ) {
        fieldNames.push(fieldName);
        return match;
      });

      return {
        exactField: "",
        fieldNames: fieldNames,
        magnetic: isMagneticFormatToken(token),
        template: token,
      };
    });
}

function parseSortFields(value) {
  return parseFieldList(value, DEFAULT_SORT_FIELDS);
}

function parseSerialByFields(value) {
  return parseFieldList(value, DEFAULT_SERIAL_BY_FIELDS, function allowField(
    field
  ) {
    return field !== "serial";
  });
}

function parseFieldList(value, defaults, allowField) {
  const source =
    value === undefined || String(value).trim() === ""
      ? defaults
      : safeDecode(value).split(/[\s,+|>]+/);
  const fields = [];

  source.forEach(function addField(item) {
    const field = normalizeSortField(item);
    if (
      field &&
      (!allowField || allowField(field)) &&
      fields.indexOf(field) === -1
    ) {
      fields.push(field);
    }
  });

  return fields.length ? fields : defaults.slice();
}

function normalizeSortField(value) {
  const field = String(value).replace(/[{}]/g, "").trim().toLowerCase();
  const aliases = {
    country: "region",
    area: "region",
    region: "region",
    prefix: "prefix",
    type: "type",
    protocol: "type",
    route: "route",
    line: "route",
    desc: "route",
    description: "route",
    rate: "rate",
    multiplier: "rate",
    ability: "ability",
    capability: "ability",
    tag: "tags",
    tags: "tags",
    extra: "extra",
    extras: "extra",
    detail: "detail",
    details: "detail",
    length: "detail",
    complexity: "detail",
    serial: "serial",
    number: "serial",
    name: "name",
  };
  return aliases[field] || "";
}

function parseSerialStyle(value) {
  const style =
    value === undefined ? "always" : String(value).trim().toLowerCase();
  if (style === "off" || style === "none" || style === "false") {
    return "off";
  }
  if (style === "auto") {
    return "auto";
  }
  return "always";
}

function parseRouteOption(value) {
  const style =
    value === undefined
      ? CONFIG.defaults.route
      : String(value).trim().toLowerCase();

  if (style === "off" || style === "none" || style === "false") {
    return { enabled: false, lang: "zh" };
  }
  if (style === "en" || style === "us" || style === "english") {
    return { enabled: true, lang: "en" };
  }
  if (style === "zh" || style === "cn" || style === "chinese") {
    return { enabled: true, lang: "zh" };
  }

  return { enabled: true, lang: "zh" };
}

function parseRateStyle(value) {
  const style =
    value === undefined
      ? CONFIG.defaults.rate
      : String(value).trim().toLowerCase();
  if (style === "off" || style === "none" || style === "false") {
    return "off";
  }
  if (style === "plain") {
    return "plain";
  }
  if (style === "paren") {
    return "paren";
  }
  return "sup";
}

function parseSpecialLabel(value, legacyValue) {
  if (value !== undefined) {
    return safeDecode(value);
  }
  if (legacyValue !== undefined) {
    return safeDecode(legacyValue);
  }
  return CONFIG.defaults.special;
}

const inputName =
  CONFIG.matchInputAliases[
    inArg.match === undefined
      ? inArg.input === undefined
        ? inArg.in
        : inArg.input
      : inArg.match
  ] || "";
const regionStyle = parseRegionStyle(inArg.region);
const serialBaseNames = new WeakMap();
const proxyRanks = new WeakMap();
const proxySortKeys = new WeakMap();
const proxySerialKeys = new WeakMap();
const proxyFields = new WeakMap();
const NORMAL_RANK = 1;
const UNRESOLVED_RANK = 2;
const superscriptNumberMap = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  ".": "·",
};

// prettier-ignore
const FG = ['🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇫','🇦🇱','🇩🇿','🇦🇴','🇦🇷','🇦🇲','🇦🇹','🇦🇿','🇧🇭','🇧🇩','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇫🇯','🇫🇮','🇬🇦','🇬🇲','🇬🇪','🇬🇭','🇬🇷','🇬🇱','🇬🇹','🇬🇳','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇨🇮','🇯🇲','🇯🇴','🇰🇿','🇰🇪','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇹','🇱🇺','🇲🇰','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇷','🇲🇺','🇲🇽','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇰🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇦','🇵🇾','🇵🇪','🇵🇭','🇵🇹','🇵🇷','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇸🇲','🇸🇦','🇸🇳','🇷🇸','🇸🇱','🇸🇰','🇸🇮','🇸🇴','🇿🇦','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇯','🇹🇿','🇹🇭','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇻🇮','🇺🇬','🇺🇦','🇺🇾','🇺🇿','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼','🇦🇩','🇷🇪','🇵🇱','🇬🇺','🇻🇦','🇱🇮','🇨🇼','🇸🇨','🇦🇶','🇬🇮','🇨🇺','🇫🇴','🇦🇽','🇧🇲','🇹🇱'];
// prettier-ignore
const EN = ['HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AF','AL','DZ','AO','AR','AM','AT','AZ','BH','BD','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CO','KM','CG','CD','CR','HR','CY','CZ','DK','DJ','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','GA','GM','GE','GH','GR','GL','GT','GN','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','CI','JM','JO','KZ','KE','KW','KG','LA','LV','LB','LS','LR','LY','LT','LU','MK','MG','MW','MY','MV','ML','MT','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NP','NL','NZ','NI','NE','NG','KP','NO','OM','PK','PA','PY','PE','PH','PT','PR','QA','RO','RU','RW','SM','SA','SN','RS','SL','SK','SI','SO','ZA','ES','LK','SD','SR','SZ','SE','CH','SY','TJ','TZ','TH','TG','TO','TT','TN','TR','TM','VI','UG','UA','UY','UZ','VE','VN','YE','ZM','ZW','AD','RE','PL','GU','VA','LI','CW','SC','AQ','GI','CU','FO','AX','BM','TL'];
// prettier-ignore
const ZH = ['香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','阿富汗','阿尔巴尼亚','阿尔及利亚','安哥拉','阿根廷','亚美尼亚','奥地利','阿塞拜疆','巴林','孟加拉国','白俄罗斯','比利时','伯利兹','贝宁','不丹','玻利维亚','波斯尼亚和黑塞哥维那','博茨瓦纳','巴西','英属维京群岛','文莱','保加利亚','布基纳法索','布隆迪','柬埔寨','喀麦隆','加拿大','佛得角','开曼群岛','中非共和国','乍得','智利','哥伦比亚','科摩罗','刚果(布)','刚果(金)','哥斯达黎加','克罗地亚','塞浦路斯','捷克','丹麦','吉布提','多米尼加共和国','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚','埃塞俄比亚','斐济','芬兰','加蓬','冈比亚','格鲁吉亚','加纳','希腊','格陵兰','危地马拉','几内亚','圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印尼','伊朗','伊拉克','爱尔兰','马恩岛','以色列','意大利','科特迪瓦','牙买加','约旦','哈萨克斯坦','肯尼亚','科威特','吉尔吉斯斯坦','老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','立陶宛','卢森堡','马其顿','马达加斯加','马拉维','马来','马尔代夫','马里','马耳他','毛利塔尼亚','毛里求斯','墨西哥','摩尔多瓦','摩纳哥','蒙古','黑山共和国','摩洛哥','莫桑比克','缅甸','纳米比亚','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚','朝鲜','挪威','阿曼','巴基斯坦','巴拿马','巴拉圭','秘鲁','菲律宾','葡萄牙','波多黎各','卡塔尔','罗马尼亚','俄罗斯','卢旺达','圣马力诺','沙特阿拉伯','塞内加尔','塞尔维亚','塞拉利昂','斯洛伐克','斯洛文尼亚','索马里','南非','西班牙','斯里兰卡','苏丹','苏里南','斯威士兰','瑞典','瑞士','叙利亚','塔吉克斯坦','坦桑尼亚','泰国','多哥','汤加','特立尼达和多巴哥','突尼斯','土耳其','土库曼斯坦','美属维尔京群岛','乌干达','乌克兰','乌拉圭','乌兹别克斯坦','委内瑞拉','越南','也门','赞比亚','津巴布韦','安道尔','留尼汪','波兰','关岛','梵蒂冈','列支敦士登','库拉索','塞舌尔','南极','直布罗陀','古巴','法罗群岛','奥兰群岛','百慕达','东帝汶'];
// prettier-ignore
const QC = ['Hong Kong','Macao','Taiwan','Japan','Korea','Singapore','United States','United Kingdom','France','Germany','Australia','Dubai','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Virgin Islands','Brunei','Bulgaria','Burkina-faso','Burundi','Cambodia','Cameroon','Canada','CapeVerde','CaymanIslands','Central African Republic','Chad','Chile','Colombia','Comoros','Congo-Brazzaville','Congo-Kinshasa','CostaRica','Croatia','Cyprus','Czech Republic','Denmark','Djibouti','Dominican Republic','Ecuador','Egypt','EISalvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','Gabon','Gambia','Georgia','Ghana','Greece','Greenland','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Isle of Man','Israel','Italy','Ivory Coast','Jamaica','Jordan','Kazakstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar(Burma)','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','NorthKorea','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Portugal','PuertoRico','Qatar','Romania','Russia','Rwanda','SanMarino','SaudiArabia','Senegal','Serbia','SierraLeone','Slovakia','Slovenia','Somalia','SouthAfrica','Spain','SriLanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syria','Tajikstan','Tanzania','Thailand','Togo','Tonga','TrinidadandTobago','Tunisia','Turkey','Turkmenistan','U.S.Virgin Islands','Uganda','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Andorra','Reunion','Poland','Guam','Vatican','Liechtensteins','Curacao','Seychelles','Antarctica','Gibraltar','Cuba','Faroe Islands','Ahvenanmaa','Bermuda','Timor-Leste'];

const typeRules = CONFIG.typeRules.map(normalizeRule);
const abilityRules = CONFIG.abilityRules.map(normalizeRule);
const builtinTagRules = CONFIG.tagRules.map(normalizeRule);
const infoNodeRegex = buildKeywordRegex(CONFIG.infoKeywords);
const rateRegex =
  /((倍率|X|x|×)\D?((\d{1,3}\.)?\d+)\D?)|((\d{1,3}\.)?\d+)(倍|X|x|×)/g;

// 根据参数预构建匹配表，后续每个节点直接复用，避免重复拼装国家/地区映射。
const countryEntries = buildCountryEntries();
const aliasEntries = buildAliasEntries();
const routeEntries = buildRouteEntries();

function operator(proxies) {
  if (!Array.isArray(proxies)) {
    return [];
  }

  let result = proxies.filter(isProxyObject);
  const tagRules = parseTagRules(options.tags);

  result.forEach(function renameProxy(proxy) {
    const originalName = stringify(proxy.name);
    const bracketTags = collectBracketSuffixes(originalName);
    const baseName = stripBracketSuffixes(originalName);
    const parseName = baseName.trim() === "" ? originalName : baseName;

    if (parseName.trim() === "") {
      proxy.name = null;
      return;
    }

    if (isInfoNode(parseName)) {
      proxy.name = null;
      return;
    }

    if (isDirectName(parseName)) {
      proxy.name = null;
      return;
    }

    let workingName = normalizeAliases(parseName);
    const searchName = parseName + " " + workingName;
    const type = getProxyType(proxy, searchName);
    const ability = collectAbility(searchName);
    const tags = collectTags(searchName, tagRules);
    bracketTags.forEach(function appendBracketTag(tag) {
      pushUnique(tags, tag);
    });
    const route = options.routeEnabled ? findRoute(workingName) : "";
    const rate = options.rate === "off" ? "" : findRate(workingName);
    const matchedCountry = findCountry(workingName, route, tags);

    if (matchedCountry) {
      const fields = buildMatchedFields(
        matchedCountry,
        type,
        ability,
        tags,
        rate,
        route
      );
      proxyFields.set(proxy, fields);
      proxy.name = stringify(originalName);
      proxySortKeys.set(
        proxy,
        buildProxySortKey(fields, matchedCountry, originalName)
      );
      proxySerialKeys.set(
        proxy,
        buildProxySerialKey(fields, matchedCountry, originalName)
      );
      return;
    }

    proxy.name = buildSpecialName(parseName, rate, route, ability, tags);
    proxyRanks.set(proxy, UNRESOLVED_RANK);
  });

  result = result.filter(function hasName(proxy) {
    return proxy.name !== null;
  });

  result = sortPinnedProxies(result);

  if (options.serial !== "off") {
    appendSerialNumbers(result);
    if (options.serial === "auto") {
      removeSingletonSerial(result);
    }
  }

  renderFinalNames(result);

  return result;
}

function renderFinalNames(proxies) {
  const records = proxies
    .filter(function hasFields(proxy) {
      return getProxyRank(proxy) === NORMAL_RANK && proxyFields.has(proxy);
    })
    .map(function toRecord(proxy) {
      const fields = proxyFields.get(proxy);
      return {
        proxy: proxy,
        parts: buildFormatParts(fields),
      };
    });
  const columnWidths = buildFormatColumnWidths(records);

  records.forEach(function renderRecord(record) {
    record.proxy.name = renderFormatParts(record.parts, columnWidths);
  });
}

function isDirectName(name) {
  return /^direct$/i.test(name.trim());
}

function isInfoNode(name) {
  return regexTest(infoNodeRegex, name);
}

function isProxyObject(proxy) {
  return proxy !== null && typeof proxy === "object";
}

function buildSpecialName(originalName, rate, route, ability, tags) {
  const labels = [];
  collectFieldValues(labels, rate);
  collectFieldValues(labels, route);
  collectFieldValues(labels, ability);
  collectFieldValues(labels, tags);

  if (labels.length === 0) {
    return originalName;
  }

  return joinName([
    options.special,
    originalName,
    labels
      .map(function wrap(value) {
        return "[" + value + "]";
      })
      .join(""),
  ]);
}

// 保持数组顺序：先按输入格式识别，再映射到输出格式。
function buildCountryEntries() {
  const entries = [];
  const inputLists = inputName ? [getList(inputName)] : [ZH, FG, QC, EN];

  inputLists.forEach(function addList(list) {
    const inputType = getCountryInputType(list);
    list.forEach(function addEntry(value, index) {
      entries.push({
        input: value,
        inputType: inputType,
        regex: buildCountryInputRegex(value, inputType),
        index: index,
      });
    });
  });

  return entries;
}

function getCountryInputType(list) {
  if (list === EN) {
    return "code";
  }
  if (list === QC) {
    return "full";
  }
  if (list === FG) {
    return "flag";
  }
  return "name";
}

function buildCountryInputRegex(value, inputType) {
  const text = stringify(value);
  if (!text) {
    return /a^/;
  }

  if (inputType === "code") {
    return new RegExp(
      "(^|[^A-Za-z0-9])" + escapeRegex(text) + "(?=$|[^A-Za-z0-9])",
      "i"
    );
  }

  if (inputType === "full") {
    return new RegExp(keywordToRegexSource(text), "i");
  }

  return new RegExp(escapeRegex(text), inputType === "flag" ? "" : "i");
}

function buildAliasEntries() {
  return CONFIG.countryAliases.map(function mapAlias(item) {
    return {
      name: item.name,
      regex: compileRuleRegex(item),
    };
  });
}

function buildRouteEntries() {
  return CONFIG.routeRules.map(function mapRoute(item) {
    return {
      regex: compileRuleRegex(item),
      zh: item.zh,
      en: item.en,
    };
  });
}

function collectBracketSuffixes(name) {
  const values = [];
  const regex = /\[([^\[\]]+)\]/g;
  let match = regex.exec(name);

  while (match) {
    pushUnique(values, match[1].trim());
    match = regex.exec(name);
  }

  return values;
}

function stripBracketSuffixes(name) {
  return name.replace(/\s*\[[^\[\]]+\]\s*/g, " ").replace(/\s+/g, " ").trim();
}

// 把常见别名和城市名归一化，提升后续国家/地区识别命中率。
function normalizeAliases(name) {
  let normalized = name;
  aliasEntries.forEach(function replaceAlias(item) {
    if (regexTest(item.regex, normalized)) {
      normalized = regexReplace(normalized, item.regex, item.name);
    }
  });
  return normalized;
}

function getProxyType(proxy, name) {
  const explicitType = stringify(
    proxy.type || proxy.protocol || proxy["proxy-type"]
  ).trim();
  if (explicitType !== "") {
    return explicitType;
  }

  for (let index = 0; index < typeRules.length; index++) {
    if (ruleMatches(typeRules[index], name)) {
      return typeRules[index].value;
    }
  }

  return "";
}

// ability 只收集内置能力标签，例如原生、GPT、AI。
function collectAbility(name) {
  const retained = [];
  abilityRules.forEach(function collectBuiltin(item) {
    if (ruleMatches(item, name)) {
      pushUnique(retained, item.value);
    }
  });
  return pruneContainedValues(retained);
}

// tags 合并内置标签和自定义 source>display 规则。
function collectTags(name, tagRules) {
  const retained = [];
  builtinTagRules.forEach(function collectBuiltin(item) {
    if (ruleMatches(item, name)) {
      pushUnique(retained, item.value);
    }
  });

  tagRules.forEach(function collect(item) {
    if (!item.source || !regexTest(item.regex, name)) {
      return;
    }
    const value = item.replacement || item.source;
    pushUnique(retained, value);
  });
  return pruneContainedValues(retained);
}

function parseTagRules(value) {
  if (!value) {
    return [];
  }

  return value
    .split("+")
    .map(function parseItem(item) {
      const parts = item.split(">");
      const source = parts[0].trim();
      return {
        source: source,
        regex: buildLiteralRuleRegex(source),
        replacement: parts.slice(1).join(">").trim(),
      };
    })
    .filter(function hasSource(item) {
      return item.source !== "";
    });
}

// route 线路属性按配置顺序收集，支持 IPLC + 游戏 + 专线 这类多标签组合。
function findRoute(name) {
  const routes = [];
  for (let index = 0; index < routeEntries.length; index++) {
    if (regexTest(routeEntries[index].regex, name)) {
      const value = getRouteValue(routeEntries[index]);
      pushUnique(routes, value);
    }
  }
  return pruneContainedValues(routes);
}

function getRouteValue(entry) {
  if (options.routeLanguage === "en") {
    return entry.en;
  }
  return entry.zh;
}

// rate 倍率只保留非 1 倍标记，显示样式由 rate 参数控制。
function findRate(name) {
  resetRegex(rateRegex);
  let match = rateRegex.exec(name);

  while (match) {
    const numberMatch = match[0].match(/(\d[\d.]*)/);
    if (numberMatch && Number(numberMatch[0]) !== 1) {
      return formatRate(numberMatch[0]);
    }
    match = rateRegex.exec(name);
  }

  return "";
}

// 国家/地区识别依赖 countryEntries 的顺序，不能改成无序查找。
function findCountry(name, route, tags) {
  for (let index = 0; index < countryEntries.length; index++) {
    const entry = countryEntries[index];
    if (
      regexTest(entry.regex, name) &&
      !isCountryCodeShadowedByLabels(entry, route, tags)
    ) {
      return entry;
    }
  }
  return null;
}

function isCountryCodeShadowedByLabels(country, route, tags) {
  if (country.inputType !== "code") {
    return false;
  }

  const labels = [];
  collectFieldValues(labels, route);
  collectFieldValues(labels, tags);
  return labels.indexOf(country.input) !== -1;
}

// 按 format 组装标准字段，字段为空时跳过，不留下多余分隔符。
function buildMatchedFields(country, type, ability, tags, rate, route) {
  return {
    prefix: options.prefix,
    type: type,
    region: buildCountryDisplay(country),
    serial: "",
    route: route,
    rate: rate,
    ability: ability,
    tags: tags,
  };
}

function buildFormatColumnWidths(records) {
  const widths = {};

  records.forEach(function collectWidths(record) {
    record.parts.forEach(function collect(part) {
      const width = getDisplayWidth(part.text);
      widths[part.column] = Math.max(widths[part.column] || 0, width);
    });
  });

  return widths;
}

function renderFormat(fields, columnWidths) {
  return renderFormatParts(buildFormatParts(fields), columnWidths);
}

function renderFormatParts(parts, columnWidths) {
  const rendered = [];

  parts.forEach(function renderPart(part) {
    const width = columnWidths ? columnWidths[part.column] || 0 : 0;
    rendered.push(padDisplay(part.text, width));
  });

  return joinName(rendered).replace(/\s+$/, "");
}

function buildFormatParts(fields) {
  const parts = [];

  options.formatTokens.forEach(function renderToken(token) {
    if (token.exactField) {
      addFormatValueParts(parts, token.exactField, fields[token.exactField]);
      return;
    }

    const text = renderTemplateToken(token, fields);

    const hasValue =
      token.fieldNames.length === 0 ||
      token.fieldNames[token.magnetic ? "some" : "every"](function hasValue(
        fieldName
      ) {
        return !isEmptyField(fields[fieldName]);
      });
    if (hasValue && text !== "") {
      parts.push({
        column: getFormatColumnKey(token.template, 0),
        text: text,
      });
    }
  });

  return parts;
}

function isMagneticFormatToken(token) {
  const pattern = /\[\{([A-Za-z][A-Za-z0-9_]*)\}\]|\{([A-Za-z][A-Za-z0-9_]*)\}/g;
  let match = pattern.exec(token);
  let cursor = 0;
  let count = 0;

  while (match) {
    const fieldName = match[1] || match[2];
    if (
      match.index !== cursor ||
      !MAGNETIC_FORMAT_FIELDS[fieldName] ||
      match[0] === ""
    ) {
      return false;
    }
    cursor += match[0].length;
    count += 1;
    match = pattern.exec(token);
  }

  return count > 1 && cursor === token.length;
}

function renderTemplateToken(token, fields) {
  if (token.magnetic) {
    return renderMagneticToken(token, fields);
  }

  return token.template
    .replace(/\[\{([A-Za-z][A-Za-z0-9_]*)\}\]/g, function replaceWrapped(
      match,
      fieldName
    ) {
      return isEmptyField(fields[fieldName])
        ? ""
        : "[" + stringifyField(fields[fieldName]) + "]";
    })
    .replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, function replaceField(
      match,
      fieldName
    ) {
      return stringifyField(fields[fieldName]);
    });
}

function renderMagneticToken(token, fields) {
  const values = [];
  token.template.replace(
    /\[\{([A-Za-z][A-Za-z0-9_]*)\}\]|\{([A-Za-z][A-Za-z0-9_]*)\}/g,
    function collect(match, wrappedFieldName, fieldName) {
      collectUniqueFieldValues(values, fields[wrappedFieldName || fieldName]);
      return match;
    }
  );

  return values
    .filter(function keepValue(value) {
      return value !== "";
    })
    .map(function wrap(value) {
      return "[" + value + "]";
    })
    .join("");
}

function collectFieldValues(result, value) {
  if (Array.isArray(value)) {
    value.forEach(function collectNested(item) {
      collectFieldValues(result, item);
    });
    return;
  }

  if (!isEmptyField(value)) {
    result.push(String(value));
  }
}

function collectUniqueFieldValues(result, value) {
  if (Array.isArray(value)) {
    value.forEach(function collectNested(item) {
      collectUniqueFieldValues(result, item);
    });
    return;
  }

  if (!isEmptyField(value)) {
    pushUnique(result, String(value));
  }
}

function pushUnique(list, value) {
  if (value !== "" && list.indexOf(value) === -1) {
    list.push(value);
  }
}

function pruneContainedValues(values) {
  return values.filter(function keepValue(value, index) {
    const current = String(value);
    return !values.some(function hasLongerValue(other, otherIndex) {
      const candidate = String(other);
      return (
        otherIndex !== index &&
        candidate.length > current.length &&
        candidate.indexOf(current) !== -1
      );
    });
  });
}

function addFormatValueParts(parts, fieldName, value) {
  if (Array.isArray(value)) {
    value.forEach(function addNested(item, index) {
      addFormatPart(parts, fieldName, index, item);
    });
    return;
  }

  addFormatPart(parts, fieldName, 0, value);
}

function addFormatPart(parts, fieldName, index, value) {
  if (isEmptyField(value)) {
    return;
  }

  parts.push({
    column: getFormatColumnKey(fieldName, index),
    text: stringifyField(value),
  });
}

function getFormatColumnKey(name, index) {
  return name + ":" + index;
}

function stringifyField(value) {
  if (Array.isArray(value)) {
    return value
      .filter(function keepPart(part) {
        return !isEmptyField(part);
      })
      .join(FIELD_SEPARATOR);
  }
  return isEmptyField(value) ? "" : String(value);
}

function padDisplay(value, width) {
  const text = stringifyField(value);
  const diff = width - getDisplayWidth(text);
  return diff > 0 ? text + " ".repeat(diff) : text;
}

function getDisplayWidth(value) {
  return stringifyField(value).replace(/[^\x00-\xff]/g, "xx").length;
}

function isEmptyField(value) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.every(isEmptyField))
  );
}

function buildCountryDisplay(country) {
  switch (regionStyle) {
    case "flag":
      return getCountryFlag(country.index);
    case "name":
      return formatCountryName(ZH[country.index]);
    case "code":
      return EN[country.index];
    case "full":
      return QC[country.index];
    case "name-code":
      return formatNameWithCode(country.index);
    case "flag-name":
      return [
        getCountryFlag(country.index),
        formatCountryName(ZH[country.index]),
      ];
    default:
      return [getCountryFlag(country.index), formatNameWithCode(country.index)];
  }
}

function getCountryFlag(index) {
  return FG[index] === "🇹🇼" ? "🇨🇳" : FG[index];
}

function formatNameWithCode(index) {
  return formatCountryName(ZH[index]) + "（" + EN[index] + "）";
}

function formatCountryName(countryName) {
  return countryName;
}

function formatRate(value) {
  if (options.rate === "plain") {
    return value + "×";
  }

  if (options.rate === "paren") {
    return "(" + value + "×)";
  }

  return toSuperscriptRate(value);
}

function toSuperscriptRate(value) {
  return (
    "ˣ" +
    value
      .split("")
      .map(function mapNumber(char) {
        return superscriptNumberMap[char] || char;
      })
      .join("")
  );
}

function appendSerialNumbers(proxies) {
  const groupsBySerialKey = new Map();
  const groups = [];
  const leadingPinned = [];
  const trailingPinned = [];

  proxies.forEach(function addProxy(proxy) {
    const rank = getProxyRank(proxy);
    if (rank !== NORMAL_RANK) {
      if (rank < NORMAL_RANK) {
        leadingPinned.push(proxy);
      } else {
        trailingPinned.push(proxy);
      }
      return;
    }

    const serialKey = getProxySerialKey(proxy);
    let group = groupsBySerialKey.get(serialKey);
    if (!group) {
      group = { key: serialKey, items: [] };
      groupsBySerialKey.set(serialKey, group);
      groups.push(group);
    }

    const serial = group.items.length + 1;
    const fields = proxyFields.get(proxy);
    if (fields) {
      serialBaseNames.set(proxy, getSerialBaseNameFromFields(fields));
      fields.serial = pad2(serial);
    }
    group.items.push(proxy);
  });

  const flattened = leadingPinned.slice();
  groups.forEach(function addGroup(group) {
    group.items.forEach(function addItem(item) {
      flattened.push(item);
    });
  });
  trailingPinned.forEach(function addPinned(proxy) {
    flattened.push(proxy);
  });

  proxies.splice.apply(proxies, [0, proxies.length].concat(flattened));
  return proxies;
}

function removeSingletonSerial(proxies) {
  const groups = new Map();

  proxies.forEach(function groupProxy(proxy) {
    if (getProxyRank(proxy) !== NORMAL_RANK) {
      return;
    }

    const serialKey = getProxySerialKey(proxy);
    if (!groups.has(serialKey)) {
      groups.set(serialKey, []);
    }
    groups.get(serialKey).push(proxy);
  });

  groups.forEach(function removeOne(items) {
    if (items.length === 1 && hasFirstSerial(items[0])) {
      const fields = proxyFields.get(items[0]);
      if (fields) {
        fields.serial = "";
      }
    }
  });

  return proxies;
}

function getSerialBaseName(proxy) {
  return serialBaseNames.get(proxy) || stringify(proxy.name);
}

function getSerialBaseNameFromFields(fields) {
  const serial = fields.serial;
  fields.serial = "";
  const name = renderFormat(fields);
  fields.serial = serial;
  return name;
}

function hasFirstSerial(proxy) {
  if (serialBaseNames.has(proxy)) {
    return proxy.name !== getSerialBaseName(proxy);
  }

  return /(?:^|[^0-9])01$/.test(proxy.name);
}

function sortPinnedProxies(proxies) {
  return proxies
    .map(function withIndex(proxy, index) {
      const rank = getProxyRank(proxy);
      return {
        proxy: proxy,
        index: index,
        rank: rank,
        sortKey: rank === NORMAL_RANK ? getProxySortKey(proxy) : "",
      };
    })
    .sort(function sortByRank(a, b) {
      const rankDiff = a.rank - b.rank;
      if (rankDiff) {
        return rankDiff;
      }

      if (a.rank === NORMAL_RANK) {
        const keyDiff = a.sortKey.localeCompare(b.sortKey);
        if (keyDiff) {
          return keyDiff;
        }
      }

      return a.index - b.index;
    })
    .map(function unwrap(item) {
      return item.proxy;
    });
}

function getProxyRank(proxy) {
  return proxyRanks.has(proxy) ? proxyRanks.get(proxy) : NORMAL_RANK;
}

function buildProxySortKey(fields, country, originalName) {
  const sortValues = buildSortValues(fields, country, originalName);
  const keys = options.sort.map(function getValue(field) {
    return sortValues[field] || "";
  });

  keys.push(stringify(originalName));
  return keys.join("\u0000");
}

function buildProxySerialKey(fields, country, originalName) {
  const sortValues = buildSortValues(fields, country, originalName);
  const keys = options.serialBy.map(function getValue(field) {
    return sortValues[field] || "";
  });
  return keys.join("\u0000");
}

function buildSortValues(fields, country, originalName) {
  return {
    prefix: stringifyField(fields.prefix),
    type: stringifyField(fields.type),
    region: getList("us")[country.index],
    serial: "",
    route: stringifyField(fields.route),
    rate: getRateSortValue(fields.rate),
    ability: stringifyField(fields.ability),
    tags: stringifyField(fields.tags),
    extra: getExtraSortValue(fields),
    detail: getDetailSortValue(fields),
    name: stringify(originalName),
  };
}

function getExtraSortValue(fields) {
  return hasExtraFields(fields) ? "1" : "0";
}

function hasExtraFields(fields) {
  return (
    !isEmptyField(fields.rate) ||
    !isEmptyField(fields.route) ||
    !isEmptyField(fields.ability) ||
    !isEmptyField(fields.tags)
  );
}

function getDetailSortValue(fields) {
  const parts = [
    stringifyField(fields.rate),
    stringifyField(fields.route),
    stringifyField(fields.ability),
    stringifyField(fields.tags),
  ].filter(function keepPart(part) {
    return part !== "";
  });
  const text = parts.join(FIELD_SEPARATOR);
  return padSortNumber(parts.length, 3) + ":" + padSortNumber(text.length, 4);
}

function getRateSortValue(value) {
  const text = stringifyField(value);
  const numberMatch = text.match(/(\d[\d.]*)/);
  const rate = numberMatch ? Number(numberMatch[0]) : 1;
  return padSortNumber(isFinite(rate) ? rate : 1, 8);
}

function padSortNumber(value, width) {
  const scaled = Math.round(Number(value) * 1000);
  const text = String(scaled);
  return text.length >= width ? text : "0".repeat(width - text.length) + text;
}

function getProxySortKey(proxy) {
  return proxySortKeys.has(proxy) ? proxySortKeys.get(proxy) : stringify(proxy.name);
}

function getProxySerialKey(proxy) {
  return proxySerialKeys.has(proxy) ? proxySerialKeys.get(proxy) : proxy.name;
}

function joinName(parts) {
  return parts
    .filter(function keepPart(part) {
      return !isEmptyField(part);
    })
    .map(stringifyField)
    .join(FIELD_SEPARATOR);
}

function regexTest(regex, value) {
  resetRegex(regex);
  return regex.test(value);
}

function regexReplace(value, regex, replacement) {
  resetRegex(regex);
  return value.replace(regex, replacement);
}

function resetRegex(regex) {
  if (regex.global || regex.sticky) {
    regex.lastIndex = 0;
  }
}

function listToLookup(list) {
  const lookup = {};
  list.forEach(function add(item) {
    lookup[item] = true;
  });
  return lookup;
}

function buildKeywordRegex(keywords) {
  return new RegExp(
    keywords
      .slice()
      .sort(function sortByLength(a, b) {
        return String(b).length - String(a).length;
      })
      .map(keywordToRegexSource)
      .join("|"),
    "i"
  );
}

function ruleMatches(rule, value) {
  return regexTest(compileRuleRegex(rule), value);
}

function normalizeRule(rule) {
  return {
    regex: compileRuleRegex(rule),
    value: rule.value,
  };
}

function compileRuleRegex(rule) {
  if (rule.regex) {
    return rule.regex;
  }

  const match = Array.isArray(rule.match)
    ? rule.match
    : rule.match
    ? [rule.match]
    : [];
  return match.length ? buildKeywordRegex(match) : /a^/;
}

function buildLiteralRuleRegex(value) {
  const text = stringify(value);
  return text ? new RegExp(keywordToRegexSource(text), "i") : /a^/;
}

function keywordToRegexSource(value) {
  const text = stringify(value);
  const source = escapeRegex(text).replace(/\s+/g, "[\\s-]*");
  if (/[A-Za-z0-9]/.test(text) && !/[\u4e00-\u9fff]/.test(text)) {
    return "(^|[^A-Za-z0-9])" + source + "(?=$|[^A-Za-z0-9])";
  }
  return source;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stringify(value) {
  return value === undefined || value === null ? "" : String(value);
}

function safeDecode(value) {
  const text = stringify(value);
  try {
    return decodeURI(text);
  } catch (error) {
    return text;
  }
}

function pad2(value) {
  return value < 10 ? "0" + value : String(value);
}

// prettier-ignore
function getList(arg) { switch (arg) { case "us": return EN; case "gq": return FG; case "quan": return QC; default: return ZH; } }

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    operator: operator,
    __test: {
      normalizeAliases: normalizeAliases,
      collectTags: collectTags,
      parseTagRules: parseTagRules,
      renderFormat: renderFormat,
      joinName: joinName,
    },
  };
}
