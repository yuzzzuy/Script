/**
 * Sub-Store 订阅后缀重命名脚本
 *
 * 参数说明：
 * - suffix：给所有节点追加固定后缀，例如 #suffix=主力 输出 [主力]
 * - map / suffixMap：按订阅名映射后缀，例如 #map=Alpha=主力,Beta=备用
 * - field / sourceField：指定订阅名字段，例如 #field=subName
 * - separator：节点名和后缀之间的分隔符，默认空格
 */

/* global $arguments */

const inArg =
  typeof $arguments === "object" && $arguments !== null ? $arguments : {};

const DEFAULT_SOURCE_FIELDS = [
  "subName",
  "subscription",
  "subscriptionName",
  "subscription_name",
  "source",
  "sourceName",
  "source_name",
  "collection",
  "collectionName",
  "collection_name",
  "provider",
  "_subName",
  "_subscription",
];

const options = {
  suffix: normalizeSuffix(inArg.suffix || inArg.fixedSuffix || inArg.tag),
  suffixMap: parseSuffixMap(inArg.map || inArg.suffixMap),
  sourceFields: buildSourceFields(inArg.field || inArg.sourceField),
  separator:
    inArg.separator === undefined || inArg.separator === null
      ? " "
      : String(inArg.separator),
};

function operator(proxies) {
  if (!Array.isArray(proxies)) {
    return [];
  }

  proxies.forEach(function renameProxy(proxy) {
    if (!isObject(proxy)) {
      return;
    }

    const name = stringify(proxy.name);
    if (name.trim() === "") {
      return;
    }

    const suffix = resolveSuffix(proxy);
    if (!suffix) {
      return;
    }

    proxy.name = appendSuffix(name, suffix, options.separator);
  });

  return proxies;
}

function resolveSuffix(proxy) {
  const sourceName = findSourceName(proxy);
  if (sourceName && options.suffixMap.has(sourceName)) {
    return options.suffixMap.get(sourceName);
  }

  const lowerSourceName = sourceName.toLowerCase();
  if (lowerSourceName && options.suffixMap.has(lowerSourceName)) {
    return options.suffixMap.get(lowerSourceName);
  }

  return options.suffix;
}

function findSourceName(proxy) {
  for (let index = 0; index < options.sourceFields.length; index += 1) {
    const value = stringify(proxy[options.sourceFields[index]]).trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function appendSuffix(name, suffix, separator) {
  const normalizedSuffix = normalizeSuffix(suffix);
  if (!normalizedSuffix) {
    return name;
  }

  const formattedSuffix = "[" + normalizedSuffix + "]";
  if (name.endsWith(formattedSuffix)) {
    return name;
  }

  return name + separator + formattedSuffix;
}

function buildSourceFields(field) {
  const customField = stringify(field).trim();
  if (!customField) {
    return DEFAULT_SOURCE_FIELDS.slice();
  }

  return [customField].concat(
    DEFAULT_SOURCE_FIELDS.filter(function removeDuplicate(defaultField) {
      return defaultField !== customField;
    })
  );
}

function parseSuffixMap(value) {
  const map = new Map();

  if (isObject(value)) {
    Object.keys(value).forEach(function addObjectEntry(key) {
      addMapEntry(map, key, value[key]);
    });
    return map;
  }

  stringify(value)
    .split(/[\n,;|，；]+/)
    .forEach(function parsePair(pair) {
      const separatorIndex = pair.search(/[:=：]/);
      if (separatorIndex < 0) {
        return;
      }

      addMapEntry(
        map,
        pair.slice(0, separatorIndex),
        pair.slice(separatorIndex + 1)
      );
    });

  return map;
}

function addMapEntry(map, rawKey, rawValue) {
  const key = stringify(rawKey).trim();
  const suffix = normalizeSuffix(rawValue);

  if (!key || !suffix) {
    return;
  }

  map.set(key, suffix);
  map.set(key.toLowerCase(), suffix);
}

function normalizeSuffix(value) {
  let suffix = stringify(value).trim();
  const bracketMatch = suffix.match(/^\[(.*)\]$/);

  if (bracketMatch) {
    suffix = bracketMatch[1].trim();
  }

  return suffix;
}

function stringify(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}

if (typeof module !== "undefined") {
  module.exports = {
    appendSuffix,
    operator,
    parseSuffixMap,
  };
}
