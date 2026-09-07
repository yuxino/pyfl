# 现代首字母：验证与数据生成

这套原型已整理为 Pyfl 2.1.0 的可选正式入口，使用方法见 [现代模式](../../docs/modern.md)。本目录保留验证语料、数据来源和测量工具；运行时与生成字表位于 `src/modern/`。这里的旧入口转发到正式实现，避免维护两份算法。

## 验证

在仓库根目录，使用 Node.js 22 或 24：

```sh
npm ci
npm run check
npm exec -- tsx experimental/initials/example.ts
```

`check` 同时覆盖旧 API、14 组现代模式测试和真实 npm 安装后的各个入口。50 条词句与 36 条规则有所重叠，是回归语料，不是通用准确率基准。歧义词、姓名和 9 条合成匹配用例见 [fixtures/phrases.json](fixtures/phrases.json)。

## 重新生成字表

```sh
node experimental/initials/scripts/generate-data.mjs
node experimental/initials/scripts/generate-data.mjs --offline --check
```

首次运行下载并校验固定来源；后续保留缓存，离线模式逐字节对照。生成器同时生成完整来源记录，以及运行时分别加载的单读音表和候选表。词组规则由本项目手工整理，测试会核对正式词组与语料中的规则一致。

[来源与原始许可](data/ATTRIBUTION.md) · [输入散列](data/source-lock.json) · [覆盖报告](data/generation-report.json)

## 测量

```sh
npm ci --prefix benchmark
npm run measure:experimental
```

结果写入 [measurements.json](measurements.json)，可运行的中间包保留在忽略提交的 `generated/`。这是统一 esbuild 条件下的源码对比，不等于实际发布包大小；正式发行使用 webpack 构建。可选模块按入口分别计量，候选搜索不冒用转换表的尺寸。

首次原型的取舍与历史尺寸保存在 [177ea06 版本的说明](https://github.com/yuxino/pyfl/blob/177ea0673b6520e46a42df97043d7c0c6d3a66c6/experimental/initials/README.md)。
