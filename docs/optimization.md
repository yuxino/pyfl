# Pyfl 2.0.1 方案与实测

结论：保留已有的连续首字母表，转换时拼接汉字首字母并整段复制其余文本，增加原生 ESM 入口、去掉内联源码映射。不引入新的运行时依赖，不替换默认读音。

本次源码版本为待发布的 2.0.1。以下结果来自 2026-09-07 的本机测量，不代表已经发布到 npm，也不是浏览器交互耗时。

## 为什么选择这条路线

原实现并没有每次遍历词典。它已经把 `U+4E00–U+9FA5` 的 20,902 个首字母保存为连续 ASCII 字符串，按偏移直接查询。字典 SHA-256 为 `eaa2e2e7911b08c9c0334811ac80c5fc4637db8471802261e8842e55a8911547`，本次保持不变；也与 [pinyinjs 原表](https://github.com/sxei/pinyinjs/blob/3f0013841ba62a6d1af38e50839ea196b27369cb/dict/pinyin_dict_firstletter.js) 一致。

实际比较了三条路线：

| 路线 | 好处 | 成本或行为变化 | 决定 |
| --- | --- | --- | --- |
| 保留 ASCII 表，优化转换与打包 | 默认索引兼容；无运行时依赖；无需初始化字典对象 | 仍是固定读音，不增加覆盖范围 | 采用 |
| 每字母 5 位编码，再以 base64 放入 JS | 字典代码未压缩字节减少 | gzip / Brotli 更大；需要解码；浏览器读取更复杂 | 不采用 |
| 替换为 pinyin-pro / pinyin | 完整拼音、更多格式与可选词组/姓氏能力 | 数据与引擎较大；默认输出、覆盖范围不同 | 当前用途不采用 |

通用引擎解决的是更广的问题。需要按语境处理“重庆”“音乐”或姓氏时，这些能力有价值；Pyfl 的旧索引不能静默切换到另一套读音。

## 测量条件

- Apple M5，macOS arm64，Node.js `v24.13.0`。
- 基线为 npm 正式包 `pyfl@2.0.0`；其 55,428 B UMD 也与本轮改动前 `55ff2a4` 的构建体积相同。
- 比较版本固定为 `pinyin-pro@3.29.3`、`pinyin@4.0.0`，安装锁在 `benchmark/package-lock.json`。
- 热转换每个输入预热；Pyfl 每组 50,000 次，通用引擎每组 2,000 次，取 9 组中位数。消费输出的长度与最后一个 UTF-16 单元，避免仅生成未展开的拼接字符串。
- 通用引擎使用原生小写首字母 API 后拼接：pinyin-pro 的 `pattern: 'first', toneType: 'none', type: 'array'`；pinyin 的 `style: 'first_letter', segment: false, heteronym: false`。未额外计入转大写适配，也未安装 pinyin 的可选分词依赖。它们与 Pyfl **不是语义等价函数**。
- 冷加载指全新 Node 进程中 CJS `require` 加首次转换，共 15 次；不含 Node 进程启动，操作系统文件缓存没有清空。这是模块首次加载，不是冷磁盘测试。
- 浏览器构建全部通过 esbuild `0.28.2`，使用 `bundle + minify + format: esm + platform: browser + target: es2018`。统计所有可达导入，不能只测转导出入口文件。
- gzip / Brotli 采用 Node 默认压缩选项。所有字节均为 B，未四舍五入为“KB”。

机器同时运行其他工作，微秒级数字会有波动；结果用来选择实现，不承诺任何设备上的固定倍数。原始样本及输入保存在 [benchmark/results.json](../benchmark/results.json)。

## 体积

直接分发产物：

| 产物 | 原始 B | gzip B | Brotli B |
| --- | ---: | ---: | ---: |
| Pyfl 2.0.0 UMD，含内联源码映射 | 55,428 | 31,674 | 29,374 |
| Pyfl 2.0.1 UMD | 21,972 | 12,698 | 11,786 |
| Pyfl 2.0.1 ESM | 21,149 | 12,128 | 11,431 |

UMD 的直接分发文件减少约 60%。原来的应用构建器可能已自动移除 source map，因此不能把这项收益直接声称为“所有应用少 60%”。使用同一构建器重新打包后：

| 应用只使用首字母转换 | 原始 B | gzip B | Brotli B |
| --- | ---: | ---: | ---: |
| Pyfl 2.0.0 | 22,538 | 13,042 | 12,005 |
| Pyfl 2.0.1 | 21,146 | 12,121 | 11,450 |
| pinyin-pro 3.29.3 | 458,092 | 145,443 | 116,494 |
| pinyin 4.0.0，浏览器入口 | 8,349,106 | 2,067,538 | 1,575,162 |

Pyfl 在这组应用构建中的 gzip 减少约 7%。通用引擎的结果包含其实际浏览器入口及所需数据；不代表其所有 API 都会在相同配置下得到同一个大小。

正式 npm 安装包（从 npm registry 取元数据与 tarball，并验证 shasum）：

| npm 包 | 解包 B | tgz B |
| --- | ---: | ---: |
| pyfl 2.0.0 | 59,537 | 34,965 |
| pinyin-pro 3.29.3 | 944,383 | 320,705 |
| pinyin 4.0.0 | 61,897,172 | 13,265,686 |

这里统计包自身，不含依赖安装后的总占用。Pyfl 的包仍无运行时依赖；候选只安装在独立的 `benchmark/` 中。2.0.1 的实际 tarball 大小由 `npm run test:package` 打印，包含 ESM/CJS、声明、README、变更与许可，不能把单个 ESM 文件当安装体积。

5 位编码实验使用同一原表、可逆的 `A=0..Z=25` 编码与 base64 字符串，并逐项验证解码结果：

| 字典 JS（含必要读取代码） | 原始 B | gzip B | Brotli B |
| --- | ---: | ---: | ---: |
| 连续 ASCII 表 | 20,920 | 11,812 | 11,264 |
| 5 位 + base64 | 17,584 | 13,254 | 13,185 |

5 位方案的 gzip 大了约 12%。原始字符更少没有带来更小的传输量，因此无需为了它引入解码。基准另保存了预解码 Buffer 的读取时间；这不包含 base64 解码，也不用于声称浏览器解码更快。

## 转换与首次加载

单位为每次转换的微秒，中位数：

| 输入 | Pyfl 2.0.0 | Pyfl 2.0.1 | pinyin-pro | pinyin，无分词 |
| --- | ---: | ---: | ---: | ---: |
| `张小明` | 0.116 | 0.038 | 2.669 | 0.664 |
| `你好，世界 / Hello, 世界! 123 🐈` | 0.596 | 0.388 | 7.840 | 1.135 |
| 20 字中文句子重复 10 次 | 3.477 | 2.319 | 184.174 | 29.398 |
| `Pure JavaScript 123 🐈` 重复 10 次 | 7.267 | 0.831 | 83.874 | 12.976 |

这四组输入中新实现均减少了耗时。收益主要来自去掉逐字数组分配，并且不含支持汉字时直接返回原字符串。实际 Web 输入事件还包含渲染、状态更新与设备差异，不能直接套用此表。

新进程模块首次加载加第一次转换，中位数：

| 实现 | 毫秒 |
| --- | ---: |
| Pyfl 2.0.0 | 1.372 |
| Pyfl 2.0.1 | 1.067 |
| pinyin-pro 3.29.3 | 25.837 |
| pinyin 4.0.0 | 103.806 |

## 兼容与正确性边界

下面是实际输出，pinyin-pro 此表使用 `type: 'all'` 的 `isZh` 字段仅将已识别汉字的首字母转为大写，非汉字仍保留。性能表使用更轻的原生首字母 API，二者没有混算：

| 输入 | Pyfl（新旧相同） | pinyin-pro |
| --- | --- | --- |
| 重庆 | ZQ | CQ |
| 音乐 | YL | YY |
| 重阳 | ZY | CY |
| 龥 | Y | 龥 |
| 〇 | 〇 | L |
| a中b国C | aZbGC | aZbGC |
| 纯半角空格 | 空串 | 保留空格 |

这些样例用于显示差异，不能计算“准确率”。姓氏、多音字及业务专有名词仍需要明确词表或用户确认。

回归测试锁定原字典校验值，对全部 65,536 个 UTF-16 单元、整段 BMP、1,000 组固定种子混合文本和关键空白/代理/输入转换错误，与旧算法比较。独立审查还从旧 Git 字典对安装 tarball 的 CJS 与 ESM 做了全范围比较。

新版同时检验真实安装包的 CommonJS `.default`、原生 ESM 默认导出、旧深层 JS 路径、TypeScript NodeNext 声明与 UMD/AMD 行为。UMD/AMD 在 Node 隔离环境运行，这不等同于真实浏览器交互。CI 覆盖 Linux/Windows、Node 22/24，远端执行结果应以对应提交的检查记录为准。

## 复现

```bash
npm ci
npm run check
npm ci --prefix benchmark --ignore-scripts
npm --prefix benchmark run bench
```

最后一步约需一分钟，包含 registry 元数据/tarball 校验，会更新 `benchmark/results.json`，并将浏览器比较产物写入被 Git 忽略的 `benchmark/generated/`。每次运行可直接比较原始样本与中位数；不要把不同机器或选项的两次结果拼成同一张性能表。

原方案的源码和历史保留在 `master`。新 `main` 从原默认分支续接，未重写历史。

## 官方资料

- [pinyin-pro 首字母、姓氏、非汉字与分词选项](https://pinyin-pro.cn/use/pinyin.html)
- [pinyin-pro 当前研究版本的包入口](https://github.com/zh-lx/pinyin-pro/blob/bc1cbd59be6bc6eab109df3b816922df53ca7b87/packages/pinyin-pro/package.json)
- [pinyin-pro 转换源码](https://github.com/zh-lx/pinyin-pro/blob/bc1cbd59be6bc6eab109df3b816922df53ca7b87/packages/pinyin-pro/lib/core/pinyin/index.ts)
- [pinyin 作者仓库与使用说明](https://github.com/hotoo/pinyin)
- [pinyin 入口与可选分词依赖](https://github.com/hotoo/pinyin/blob/6580657e327edd4a94bd87325ce4d47dc2409126/packages/pinyin/package.json)
- [pinyin 单字转换实现](https://github.com/hotoo/pinyin/blob/6580657e327edd4a94bd87325ce4d47dc2409126/packages/pinyin/src/PinyinBase.ts)
- [pinyinjs 上游 MIT 许可](https://github.com/sxei/pinyinjs/blob/3f0013841ba62a6d1af38e50839ea196b27369cb/LICENSE)
