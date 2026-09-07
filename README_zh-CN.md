<div align="center">
  <img src="docs/pyfl-avatar.png" width="112" alt="pyfl">
  <h1>pyfl</h1>
  <p>把中文变成好找的首字母。</p>
  <p>
    <a href="https://pyfl.yuxino.cn"><strong>在线试一试</strong></a>
    · <a href="https://www.npmjs.com/package/pyfl">npm</a>
    · <a href="https://github.com/yuxino/pyfl/issues">反馈问题</a>
  </p>
  <p><a href="README.md">English</a> · <strong>简体中文</strong></p>
</div>

pyfl 把常用汉字逐字转换为大写拼音首字母，原样保留英文、数字、空格和符号。适合中文标题检索、通讯录缩写和搜索索引；整个转换使用内置字典，不请求网络，也不需要运行时依赖。

当前 `2.0.1` 源码构建沿用 `2.0.0` 的字典和转换规则，优化文本拼接与分发体积，并提供原生 ESM 入口。已有首字母索引无需迁移。**截至 2026 年 9 月 7 日，npm 发布版仍为 `2.0.0`，`2.0.1` 尚未发布。** 官网运行的是优化后的源码构建。

## 安装与使用

安装 npm 已发布版本：

```bash
npm install pyfl
```

在 Vite、Webpack 等前端项目中：

```js
import pyfl from "pyfl";

pyfl("喵");             // "M"
pyfl("你好，世界");      // "NH，SJ"
pyfl("周末去 Tokyo 🐈"); // "ZMQ Tokyo 🐈"
pyfl("Made by ❤");     // "Made by ❤"
```

CommonJS 入口保持原来的 `.default` 用法：

```js
const pyfl = require("pyfl").default;
```

`2.0.1` 源码包同时包含原生 ESM 和 CommonJS/UMD 产物。Node ESM、浏览器模块和支持 `exports` 的构建器可以直接使用默认导出；TypeScript 声明为 `pyfl(raw: unknown): string`。`2.0.1` 发布前，这些新增入口需要[从源码构建](#从源码构建)。

## 用在搜索里

数据变化时生成索引，输入搜索词时复用：

```js
const items = ["张小明", "李小雨", "上海笔记"].map((title) => ({
  title,
  initials: pyfl(title).toLowerCase(),
}));

const query = "zxm".toLowerCase();
const matches = items.filter(({ title, initials }) =>
  title.toLowerCase().includes(query) || initials.includes(query)
);
// [{ title: "张小明", initials: "zxm" }]
```

Pyfl 只负责生成首字母。排序、匹配、大小写归一化和索引更新由使用它的应用决定。

## 转换规则与限制

- 内置表包含 `U+4E00–U+9FA5` 的 20,902 个固定首字母，沿用原版字典。
- 范围外字符保持原样，包括扩展汉字、emoji、组合字符和 UTF-16 孤立代理。
- 只有空字符串和纯半角空格会变成空串；制表符、换行、不换行空格和全角空格保留。
- 非字符串沿用 JavaScript 模板字符串转换；转换本身抛出的异常也会保留。
- 不做分词、姓名识别、上下文多音字推断或完整拼音转换。

```js
pyfl(123456);     // "123456"
pyfl(undefined);  // "undefined"
pyfl(null);       // "null"
pyfl("   ");      // ""
pyfl("\t\n");     // "\t\n"
pyfl(Symbol());   // TypeError（与模板字符串一致）
pyfl("𠮷野家");    // "𠮷YJ"

pyfl("重庆");     // "ZQ"，不推断“重”在这里读 chóng
pyfl("音乐");     // "YL"，不推断“乐”在这里读 yuè
```

需要按语境读音、完整拼音或姓氏规则时，应选择具备这些能力的引擎，例如 [pinyin-pro](https://pinyin-pro.cn/use/pinyin.html)。换用引擎会改变既有索引，应重建数据并核对业务词表。

## 从源码构建

开发与 CI 使用 Node.js 22 或 24、npm 和提交的 `package-lock.json`：

```bash
git clone https://github.com/yuxino/pyfl.git
cd pyfl
git checkout main
npm ci
npm run check
npm pack
```

`npm run check` 包含类型检查、全 UTF-16 范围与混合文本回归、生产构建，以及真实 tarball 安装后的 ESM、CommonJS、UMD、AMD 和 TypeScript 入口检查。UMD / AMD 的自动检查在隔离 JavaScript 环境中运行；浏览器实际交互由官网单独验收。

构建产物：`dist/index.mjs`、`dist/pyfl.min.js`，对应声明在 `types/`。旧的 `require("pyfl/dist/pyfl.min.js").default` 深层入口保留。包中不再携带内联源码映射。

本次方案比较、测量条件和可复现命令见 [优化记录](docs/optimization.md)，变更见 [CHANGELOG](CHANGELOG.md)。基准测试用的候选引擎独立放在 `benchmark/`，不会进入 Pyfl 的运行时依赖或发布包。

## 来源与许可

pyfl 最初为 [WeChat](https://github.com/Nbsaw/WeChat) 项目而写。首字母字典改编自 [pinyinjs](https://github.com/sxei/pinyinjs)，本次未修改字典内容；上游许可随包保留在 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES)。

[MIT](LICENSE) © [yuxino](https://github.com/yuxino)
