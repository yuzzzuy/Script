/**
 * Sub-Store 节点重命名脚本
 *
 * 参数说明：
 * - 参数以 # 开头，多个参数用 & 连接，例如：#region=all&rate=sup&route=auto
 * - 命名先解析为 prefix/region/serial/route/rate/tags 字段，再由 format 组装
 * - format 中字段为空会自动跳过，不留下多余分隔符
 * - sort 控制最终排序字段，默认跟随 format 字段顺序，支持多个字段组合排序
 * - input 控制地区输入识别格式，默认为 auto；region/rate/route/serial/tags 控制各字段显示
 *
 * 维护说明：
 * - 国家/地区数组的顺序就是映射关系，不能单独调整其中一个数组
 * - 正则匹配统一通过 regexTest / regexReplace，避免 global/sticky 正则的 lastIndex 串味
 */

/* global $arguments */

const inArg =
  typeof $arguments === "object" && $arguments !== null ? $arguments : {};
const parsedFormat = parseFormat(inArg.format);

const options = {
  nx: !!inArg.nx,
  key: !!inArg.key,
  blpx: !!inArg.blpx,
  blnx: !!inArg.blnx,
  debug: !!inArg.debug,
  clear: !!inArg.clear,
  nm: !!inArg.nm,
  fgf: inArg.fgf === undefined ? " " : decodeURI(inArg.fgf),
  prefix: inArg.prefix === undefined ? "" : decodeURI(inArg.prefix),
  format: parsedFormat,
  sort: parseSortFields(inArg.sort, parsedFormat),
  serial: parseSerialStyle(inArg.serial),
  route: parseRouteStyle(inArg.route),
  rate: parseRateStyle(inArg.rate),
  tags: inArg.tags === undefined ? "" : decodeURI(inArg.tags),
  unresolved:
    inArg.unresolved === undefined ? "特殊" : decodeURI(inArg.unresolved),
  blockquic: inArg.blockquic === undefined ? "" : decodeURI(inArg.blockquic),
};

const nameMap = {
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
};

function parseRegionStyle(value) {
  const style = value === undefined ? "all" : String(value).toLowerCase();
  const aliases = {
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
  };
  const normalized = aliases[style] || style;
  const allowed = [
    "all",
    "flag",
    "name",
    "code",
    "full",
    "name-code",
    "flag-name",
  ];
  return allowed.indexOf(normalized) === -1 ? "all" : normalized;
}

function parseFormat(value) {
  const defaultFormat = "{prefix} {region} {serial} {route} {rate} {tags}";
  if (value === undefined) {
    return defaultFormat;
  }

  const format = decodeURI(value).trim();
  return format === "" ? defaultFormat : format;
}

function parseSortFields(value, format) {
  const source =
    value === undefined || String(value).trim() === ""
      ? extractFormatFields(format)
      : decodeURI(value).split(/[\s,+|>]+/);
  const fields = [];

  source.forEach(function addSortField(item) {
    const field = normalizeSortField(item);
    if (field && fields.indexOf(field) === -1) {
      fields.push(field);
    }
  });

  if (fields.length) {
    return fields;
  }

  return value === undefined
    ? ["prefix", "region", "serial", "route", "rate", "tags"]
    : parseSortFields(undefined, format);
}

function extractFormatFields(format) {
  const fields = [];
  String(format).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, function collect(
    match,
    fieldName
  ) {
    fields.push(fieldName);
    return match;
  });
  return fields;
}

function normalizeSortField(value) {
  const field = String(value).replace(/[{}]/g, "").toLowerCase();
  const aliases = {
    country: "region",
    area: "region",
    region: "region",
    prefix: "prefix",
    route: "route",
    line: "route",
    desc: "route",
    description: "route",
    rate: "rate",
    multiplier: "rate",
    tag: "tags",
    tags: "tags",
    serial: "serial",
    number: "serial",
    name: "name",
  };
  return aliases[field] || "";
}

function parseSerialStyle(value) {
  const style = value === undefined ? "always" : String(value).toLowerCase();
  if (style === "off" || style === "none" || style === "false") {
    return "off";
  }
  if (style === "auto") {
    return "auto";
  }
  return "always";
}

function parseRouteStyle(value) {
  const style = value === undefined ? "auto" : String(value).toLowerCase();
  return style === "off" || style === "none" || style === "false" ? "off" : "auto";
}

function parseRateStyle(value) {
  const style = value === undefined ? "sup" : String(value).toLowerCase();
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

const inputName =
  nameMap[inArg.input === undefined ? inArg.in : inArg.input] || "";
const regionStyle = parseRegionStyle(inArg.region);
const SERIAL_PLACEHOLDER = "\u0000SERIAL\u0000";
const serialBaseNames = new WeakMap();
const proxyRanks = new WeakMap();
const proxySortKeys = new WeakMap();
const DIRECT_RANK = 0;
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

const specialRegex = [
  /(\d\.)?\d+×|ˣ[⁰¹²³⁴⁵⁶⁷⁸⁹·]+/,
  /IPLC|IEPL|Kern|Edge|Pro|Std|Exp|Biz|Fam|Game|Buy|Zx|LB|Game/,
];
const nameclear =
  /(套餐|到期|有效|剩余|版本|已用|过期|失联|测试|官方|网址|备用|群|TEST|客服|网站|获取|订阅|流量|机场|下次|官址|联系|邮箱|工单|学术|USE|USED|TOTAL|EXPIRE|EMAIL)/i;
// prettier-ignore
const regexArray = [/ˣ²/, /ˣ³/, /ˣ⁴/, /ˣ⁵/, /ˣ⁶/, /ˣ⁷/, /ˣ⁸/, /ˣ⁹/, /ˣ¹⁰/, /ˣ²⁰/, /ˣ³⁰/, /ˣ⁴⁰/, /ˣ⁵⁰/, /IPLC/i, /IEPL/i, /核心/, /边缘/, /高级/, /标准/, /实验/, /商宽/, /家宽/, /游戏|game/i, /购物/, /专线/, /LB/, /cloudflare/i, /\budp\b/i, /\bgpt\b/i, /udpn\b/];
// prettier-ignore
const valueArray = ["2×","3×","4×","5×","6×","7×","8×","9×","10×","20×","30×","40×","50×","IPLC","IEPL","Kern","Edge","Pro","Std","Exp","Biz","Fam","Game","Buy","Zx","LB","CF","UDP","GPT","UDPN"];
const routeRegexStartIndex = 13;
const nameblnx = /(高倍|(?!1)2+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const namenx = /(高倍|(?!1)(0\.|\d)+(x|倍)|ˣ²|ˣ³|ˣ⁴|ˣ⁵|ˣ¹⁰)/i;
const keya =
  /港|Hong|HK|新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR|🇸🇬|🇭🇰|🇯🇵|🇺🇸|🇰🇷|🇹🇷/i;
const keyb =
  /(((1|2|3|4)\d)|(香港|Hong|HK) 0[5-9]|((新加坡|SG|Singapore|日本|Japan|JP|美国|United States|US|韩|土耳其|TR|Turkey|Korea|KR) 0[3-9]))/i;
const rurekey = {
  GB: /UK/g,
  "B-G-P": /BGP/g,
  "Russia Moscow": /Moscow/g,
  "Korea Chuncheon": /Chuncheon|Seoul/g,
  "Hong Kong": /Hongkong|HONG KONG/gi,
  "United Kingdom London": /London|Great Britain/g,
  "Dubai United Arab Emirates": /United Arab Emirates/g,
  "Taiwan TW 台湾 🇹🇼": /(台|Tai\s?wan|TW).*?🇨🇳|🇨🇳.*?(台|Tai\s?wan|TW)/g,
  "United States": /USA|Los Angeles|San Jose|Silicon Valley|Michigan/g,
  澳大利亚: /澳洲|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/g,
  德国: /(深|沪|呼|京|广|杭)德(?!.*(I|线))|法兰克福|滬德/g,
  香港: /(深|沪|呼|京|广|杭)港(?!.*(I|线))/g,
  日本: /(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))|东京|大坂/g,
  新加坡: /狮城|(深|沪|呼|京|广|杭)新/g,
  美国: /(深|沪|呼|京|广|杭)美|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|芝加哥/g,
  波斯尼亚和黑塞哥维那: /波黑共和国/g,
  印尼: /印度尼西亚|雅加达/g,
  印度: /孟买/g,
  阿联酋: /迪拜|阿拉伯联合酋长国/g,
  孟加拉国: /孟加拉/g,
  捷克: /捷克共和国/g,
  台湾: /新台|新北|台(?!.*线)/g,
  Taiwan: /Taipei/g,
  韩国: /春川|韩|首尔/g,
  Japan: /Tokyo|Osaka/g,
  英国: /伦敦/g,
  India: /Mumbai/g,
  Germany: /Frankfurt/g,
  Switzerland: /Zurich/g,
  俄罗斯: /莫斯科/g,
  土耳其: /伊斯坦布尔/g,
  泰国: /泰國|曼谷/g,
  法国: /巴黎/g,
  G: /\d\s?GB/gi,
  Esnc: /esnc/gi,
};

// 根据参数预构建匹配表，后续每个节点直接复用，避免重复拼装国家/地区映射。
const countryEntries = buildCountryEntries();

function operator(proxies) {
  if (!Array.isArray(proxies)) {
    return [];
  }

  let result = filterProxies(proxies);
  const tagRules = parseTagRules(options.tags);

  result.forEach(function renameProxy(proxy) {
    const originalName = stringify(proxy.name);

    applyBlockQuic(proxy);

    if (isDirectName(originalName)) {
      proxy.name = originalName;
      proxyRanks.set(proxy, DIRECT_RANK);
      return;
    }

    let workingName = normalizeAliases(originalName);
    const tags = collectTags(originalName + " " + workingName, tagRules);
    const route = options.route === "off" ? "" : findRoute(workingName);
    const rate = options.rate === "off" ? "" : findRate(workingName);
    const matchedCountry = findCountry(workingName);

    if (matchedCountry) {
      const fields = buildMatchedFields(matchedCountry, tags, rate, route);
      proxy.name = renderFormat(fields);
      proxySortKeys.set(
        proxy,
        buildProxySortKey(fields, matchedCountry, originalName)
      );
      return;
    }

    if (isInternalCodeName(originalName)) {
      proxy.name = joinName([options.unresolved, originalName]);
      proxyRanks.set(proxy, UNRESOLVED_RANK);
      return;
    }

    proxy.name = options.nm ? joinName([options.prefix, workingName]) : null;
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

  if (options.blpx) {
    result = sortSpecialGroups(result);
  }

  if (options.key) {
    result = result.filter(function keepKeyName(proxy) {
      return !keyb.test(proxy.name);
    });
  }

  return sortPinnedProxies(result);
}

function isDirectName(name) {
  return /^direct$/i.test(name.trim());
}

function isInternalCodeName(name) {
  return /^[A-Za-z]+(?:-[A-Za-z0-9]+)+-\d+$/.test(name.trim());
}

// 保持数组顺序：先按输入格式识别，再映射到输出格式。
function buildCountryEntries() {
  const entries = [];
  const inputLists = inputName ? [getList(inputName)] : [ZH, FG, QC, EN];

  inputLists.forEach(function addList(list) {
    list.forEach(function addEntry(value, index) {
      entries.push({
        input: value,
        index: index,
      });
    });
  });

  return entries;
}

// 过滤阶段只处理会删除节点的参数，重命名逻辑留给 operator 的主流程。
function filterProxies(proxies) {
  if (!(options.clear || options.nx || options.blnx || options.key)) {
    return proxies;
  }

  return proxies.filter(function shouldKeep(proxy) {
    const proxyName = stringify(proxy.name);
    return (
      !(options.clear && nameclear.test(proxyName)) &&
      !(options.nx && namenx.test(proxyName)) &&
      !(options.blnx && !nameblnx.test(proxyName)) &&
      !(options.key && !(keya.test(proxyName) && /2|4|6|7/i.test(proxyName)))
    );
  });
}

// 把常见别名和城市名归一化，提升后续国家/地区识别命中率。
function normalizeAliases(name) {
  let normalized = name;
  Object.keys(rurekey).forEach(function replaceAlias(aliasName) {
    const regex = rurekey[aliasName];
    if (regexTest(regex, normalized)) {
      normalized = regexReplace(normalized, regex, aliasName);
    }
  });
  return normalized;
}

// block-quic 是节点级配置：只接受 on/off，其他输入清理已有字段。
function applyBlockQuic(proxy) {
  if (options.blockquic === "on") {
    proxy["block-quic"] = "on";
  } else if (options.blockquic === "off") {
    proxy["block-quic"] = "off";
  } else {
    delete proxy["block-quic"];
  }
}

// tags 使用 source>display 格式，未指定 display 时保留 source 自身。
function collectTags(name, tagRules) {
  const retained = [];
  tagRules.forEach(function collect(item) {
    if (!item.source || name.indexOf(item.source) === -1) {
      return;
    }
    const value = item.replacement || item.source;
    if (retained.indexOf(value) === -1) {
      retained.push(value);
    }
  });
  return retained;
}

function parseTagRules(value) {
  if (!value) {
    return [];
  }

  return value
    .split("+")
    .map(function parseItem(item) {
      const parts = item.split(">");
      return {
        source: parts[0],
        replacement: parts.slice(1).join(">"),
      };
    })
    .filter(function hasSource(item) {
      return item.source !== "";
    });
}

// route 线路属性采用“先命中优先”，让 IPLC/IEPL 等强线路标签优先于用途标签。
function findRoute(name) {
  for (let index = routeRegexStartIndex; index < regexArray.length; index++) {
    const regex = regexArray[index];
    if (regexTest(regex, name)) {
      return valueArray[index];
    }
  }
  return "";
}

// rate 倍率只保留非 1 倍标记，显示样式由 rate 参数控制。
function findRate(name) {
  const match = name.match(
    /((倍率|X|x|×)\D?((\d{1,3}\.)?\d+)\D?)|((\d{1,3}\.)?\d+)(倍|X|x|×)/
  );
  if (!match) {
    return "";
  }

  const numberMatch = match[0].match(/(\d[\d.]*)/);
  if (!numberMatch || numberMatch[0] === "1") {
    return "";
  }

  return formatRate(numberMatch[0]);
}

// 国家/地区识别依赖 countryEntries 的顺序，不能改成无序查找。
function findCountry(name) {
  for (let index = 0; index < countryEntries.length; index++) {
    if (name.indexOf(countryEntries[index].input) !== -1) {
      return countryEntries[index];
    }
  }
  return null;
}

// 按 format 组装标准字段，字段为空时跳过，不留下多余分隔符。
function buildMatchedFields(country, tags, rate, route) {
  return {
    prefix: options.prefix,
    region: buildCountryDisplay(country),
    serial: options.serial === "off" ? "" : SERIAL_PLACEHOLDER,
    route: route,
    rate: rate,
    tags: tags,
  };
}

function renderFormat(fields) {
  const rendered = [];
  const tokens = options.format.trim().split(/\s+/);

  tokens.forEach(function renderToken(token) {
    const exactMatch = token.match(/^\{([A-Za-z][A-Za-z0-9_]*)\}$/);
    if (exactMatch) {
      addField(rendered, fields[exactMatch[1]]);
      return;
    }

    const fieldNames = [];
    const text = token.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, function replaceField(
      match,
      fieldName
    ) {
      fieldNames.push(fieldName);
      return stringifyField(fields[fieldName]);
    });

    if (
      fieldNames.length === 0 ||
      fieldNames.every(function hasValue(fieldName) {
        return !isEmptyField(fields[fieldName]);
      })
    ) {
      addField(rendered, text);
    }
  });

  return joinName(rendered);
}

function addField(target, value) {
  if (Array.isArray(value)) {
    value.forEach(function addNested(item) {
      addField(target, item);
    });
    return;
  }

  if (!isEmptyField(value)) {
    target.push(value);
  }
}

function stringifyField(value) {
  if (Array.isArray(value)) {
    return value
      .filter(function keepPart(part) {
        return !isEmptyField(part);
      })
      .join(options.fgf);
  }
  return isEmptyField(value) ? "" : String(value);
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
  if (/^[\u4E00-\u9FFF]{2}$/.test(countryName)) {
    return countryName.charAt(0) + "　" + countryName.charAt(1);
  }

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
  const groupsByName = new Map();
  const groups = [];
  const flattened = [];

  proxies.forEach(function addProxy(proxy) {
    if (getProxyRank(proxy) !== NORMAL_RANK) {
      flattened.push(proxy);
      return;
    }

    let group = groupsByName.get(proxy.name);
    if (!group) {
      group = { name: proxy.name, items: [] };
      groupsByName.set(proxy.name, group);
      groups.push(group);
    }

    const serial = group.items.length + 1;
    const renamedProxy = Object.assign({}, proxy, {
      name: insertSerialNumber(proxy.name, pad2(serial)),
    });

    serialBaseNames.set(renamedProxy, removeSerialPlaceholder(proxy.name));
    if (proxySortKeys.has(proxy)) {
      proxySortKeys.set(renamedProxy, proxySortKeys.get(proxy));
    }
    group.items.push(renamedProxy);
  });

  groups.forEach(function addGroup(group) {
    group.items.forEach(function addItem(item) {
      flattened.push(item);
    });
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

    const baseName = getSerialBaseName(proxy);
    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName).push(proxy);
  });

  groups.forEach(function removeOne(items, baseName) {
    if (items.length === 1 && hasFirstSerial(items[0])) {
      items[0].name = baseName;
    }
  });

  return proxies;
}

function insertSerialNumber(name, serial) {
  if (name.indexOf(SERIAL_PLACEHOLDER) !== -1) {
    return name.replace(SERIAL_PLACEHOLDER, serial);
  }

  return name + options.fgf + serial;
}

function removeSerialPlaceholder(name) {
  if (name.indexOf(SERIAL_PLACEHOLDER) === -1) {
    return name.replace(/[^A-Za-z0-9\u00C0-\u017F\u4E00-\u9FFF]+\d+$/, "");
  }

  return name
    .replace(SERIAL_PLACEHOLDER, "")
    .split(options.fgf)
    .filter(function keepPart(part) {
      return part !== "";
    })
    .join(options.fgf);
}

function getSerialBaseName(proxy) {
  return serialBaseNames.get(proxy) || removeSerialPlaceholder(proxy.name);
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
      return { proxy: proxy, index: index };
    })
    .sort(function sortByRank(a, b) {
      const rankDiff = getProxyRank(a.proxy) - getProxyRank(b.proxy);
      if (rankDiff) {
        return rankDiff;
      }

      if (getProxyRank(a.proxy) === NORMAL_RANK) {
        const keyDiff = getProxySortKey(a.proxy).localeCompare(
          getProxySortKey(b.proxy)
        );
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
  const sortValues = {
    prefix: stringifyField(fields.prefix),
    region: getList("us")[country.index],
    serial: "",
    route: stringifyField(fields.route),
    rate: stringifyField(fields.rate),
    tags: stringifyField(fields.tags),
    name: stringify(originalName),
  };
  const keys = options.sort.map(function getValue(field) {
    return sortValues[field] || "";
  });

  keys.push(stringify(originalName));
  return keys.join("\u0000");
}

function getProxySortKey(proxy) {
  return proxySortKeys.has(proxy) ? proxySortKeys.get(proxy) : stringify(proxy.name);
}

function sortSpecialGroups(proxies) {
  const withSpecial = [];
  const withoutSpecial = [];

  proxies.forEach(function split(proxy) {
    const rank = getSpecialRank(proxy.name);
    if (rank === -1) {
      withoutSpecial.push(proxy);
    } else {
      withSpecial.push({ proxy: proxy, rank: rank });
    }
  });

  withSpecial.sort(function sortByRank(a, b) {
    const rankDiff = a.rank - b.rank;
    return rankDiff || a.proxy.name.localeCompare(b.proxy.name);
  });

  return withoutSpecial.concat(
    withSpecial.map(function unwrap(item) {
      return item.proxy;
    })
  );
}

function getSpecialRank(name) {
  for (let index = 0; index < specialRegex.length; index++) {
    if (regexTest(specialRegex[index], name)) {
      return index;
    }
  }
  return -1;
}

function joinName(parts) {
  const normalized = [];

  parts.forEach(function addPart(part) {
    if (Array.isArray(part)) {
      part.forEach(addPart);
      return;
    }

    if (part === undefined || part === null) {
      return;
    }

    const text = String(part);
    if (text !== "") {
      normalized.push(text);
    }
  });

  return normalized.join(options.fgf);
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

function stringify(value) {
  return value === undefined || value === null ? "" : String(value);
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
