"use strict";

module.exports = [
  {
    name: "default format shows type, route, ability, and tags",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
    },
    input: [
      { name: "Hong Kong vless Reality WS gRPC Netflix Hulu Apple TV Claude Sora" },
      { name: "Japan shadowsocks KDDI SoftBank 2x" },
    ],
    expected: [
      "HK 01 [vless][Claude][Sora][奈飞][Hulu][Apple TV][Reality][WS][gRPC]",
      "JP 01 [shadowsocks][2×][软银][KDDI]",
    ],
  },
  {
    name: "custom format keeps user spacing instead of magnetic labels",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
      format: "{region}%20{serial}%20{type}%20{rate}%20{route}%20{ability}%20{tags}",
    },
    input: [{ name: "Hong Kong vless 2x IPLC 原生 HKT" }],
    expected: ["HK 01 vless 2× IPLC 原生 HKT"],
  },
  {
    name: "special nodes keep original name and append parsed labels",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
    },
    input: [
      { name: "Fast-B1-1" },
      { name: "Unknown-Node" },
      { name: "Unknown AWS SoftBank" },
    ],
    expected: [
      "特殊 Fast-B1-1 [速度优先]",
      "Unknown-Node",
      "特殊 Unknown AWS SoftBank [软银][AWS]",
    ],
  },
  {
    name: "route and provider abbreviations do not become countries",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
    },
    input: [
      { name: "GT Route" },
      { name: "GIA Route" },
      { name: "SK Telecom" },
      { name: "Unknown HKT" },
    ],
    expected: [
      "特殊 GT Route [GT]",
      "特殊 GIA Route [GIA]",
      "特殊 SK Telecom [SK]",
      "特殊 Unknown HKT [HKT]",
    ],
  },
  {
    name: "real country code tokens still match countries",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
    },
    input: [
      { name: "JP vless" },
      { name: "US trojan" },
      { name: "SG IPLC" },
      { name: "HK HKT" },
    ],
    expected: [
      "HK 01 [HKT]",
      "JP 01 [vless]",
      "SG 01 [IPLC]",
      "US 01 [trojan]",
    ],
  },
  {
    name: "README large example remains stable",
    arguments: {
      prefix: "VIP",
      match: "auto",
      region: "all",
      serial: "always",
      serialBy: "prefix,region",
      route: "zh",
      rate: "plain",
      tags: "流媒体>流媒+晚高峰>晚峰",
      format:
        "{prefix}%20{region}%20{serial}%20[{type}][{rate}][{route}][{ability}][{tags}]",
      sort: "prefix,region,extra,rate,type,detail,route,ability,tags,name",
      special: "特殊",
    },
    input: [
      { name: "Korea", type: "trojan" },
      { name: "Korea X2", type: "trojan" },
      { name: "Korea 家宽 6x 原生 GPT 流媒体", type: "trojan" },
      { name: "Korea 家宽 AI 晚高峰", type: "vless" },
      { name: "Hong Kong", type: "vless" },
      { name: "Hong Kong IPLC 2x 原生 Netflix", type: "vless" },
      { name: "TW 游戏 3x GPT", type: "ss" },
      { name: "Japan Dedicated IPv6 D1", type: "hysteria2" },
      { name: "US Fast Balancer Fixed", type: "vless" },
      { name: "Fast-B1-1", type: "ss" },
    ],
    expected: [
      "VIP 🇭🇰 香港（HK） 01 [vless]",
      "VIP 🇭🇰 香港（HK） 02 [vless][2×][IPLC][原生][奈飞]",
      "VIP 🇯🇵 日本（JP） 01 [hysteria2][独享IPv6][不限速]",
      "VIP 🇰🇷 韩国（KR） 01 [trojan]",
      "VIP 🇰🇷 韩国（KR） 02 [vless][家宽][AI][晚峰]",
      "VIP 🇰🇷 韩国（KR） 03 [trojan][2×][2倍计费]",
      "VIP 🇰🇷 韩国（KR） 04 [trojan][6×][家宽][原生][GPT][流媒]",
      "VIP 🇨🇳 台湾（TW） 01 [ss][3×][游戏][GPT]",
      "VIP 🇺🇸 美国（US） 01 [vless][固定IP][速度优先][可用性优先]",
      "特殊 Fast-B1-1 [速度优先]",
    ],
  },
  {
    name: "short tokens do not match inside longer words",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
      tags: "VIP>高级+CMI>CMI",
    },
    input: [
      { name: "Japan CUVIP CMIN2 unstable 移动端 中华电信 Disneyland exitnode" },
      { name: "Hong Kong VIP CMI stable Disney exit" },
    ],
    expected: [
      "HK 01 [CMI][迪士尼][高级][稳定][出口]",
      "JP 01 [CMIN2][CUVIP][HiNet]",
    ],
  },
  {
    name: "bracket suffixes become magnetic tags without filtering nodes",
    arguments: {
      region: "code",
      route: "zh",
      rate: "plain",
    },
    input: [
      { name: "Hong Kong vless [备用][后缀A]" },
      { name: "Unknown Node [备用]" },
    ],
    expected: ["HK 01 [vless][备用][后缀A]", "特殊 Unknown Node [备用]"],
  },
];
