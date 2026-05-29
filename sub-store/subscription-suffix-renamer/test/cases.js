"use strict";

module.exports = [
  {
    name: "adds fixed suffix to every proxy",
    arguments: {
      suffix: "主力",
    },
    input: [{ name: "HK 01" }, { name: "JP 01" }],
    expected: ["HK 01 [主力]", "JP 01 [主力]"],
  },
  {
    name: "maps subscription names to suffixes",
    arguments: {
      map: "Alpha=主力,Beta=备用",
    },
    input: [
      { name: "HK 01", subName: "Alpha" },
      { name: "JP 01", subName: "Beta" },
      { name: "US 01", subName: "Gamma" },
    ],
    expected: ["HK 01 [主力]", "JP 01 [备用]", "US 01"],
  },
  {
    name: "uses custom subscription field",
    arguments: {
      field: "provider",
      map: "机场A=A,机场B=B",
    },
    input: [
      { name: "SG 01", provider: "机场A" },
      { name: "KR 01", provider: "机场B" },
    ],
    expected: ["SG 01 [A]", "KR 01 [B]"],
  },
  {
    name: "does not append duplicate suffix",
    arguments: {
      suffix: "主力",
    },
    input: [{ name: "HK 01 [主力]" }],
    expected: ["HK 01 [主力]"],
  },
  {
    name: "skips empty names and blank suffixes",
    arguments: {
      suffix: "   ",
    },
    input: [{ name: "" }, { name: "JP 01" }],
    expected: ["", "JP 01"],
  },
];
