<div align="center">
  <img src="docs/pyfl-icon.svg" width="88" alt="pyfl">
  <h1>pyfl</h1>
  <p>把中文转换成拼音首字母</p>
  <p>
    <a href="https://www.npmjs.com/package/pyfl"><strong>在 npm 查看</strong></a>
    · <a href="https://github.com/yuxino/pyfl/issues">反馈问题</a>
  </p>
</div>

<br>

pyfl 是一个面向浏览器的拼音首字母转换库。传入一段文本，它会逐字转换其中的常用汉字，并原样保留英文、数字、空格和符号。

适合用来生成搜索索引、通讯录首字母和中文标题缩写。压缩后的包体积约为 20 KB。

## 安装

```bash
yarn add pyfl
```

也可以使用 npm：

```bash
npm install pyfl
```

## 使用

```js
import pyfl from "pyfl";

pyfl("喵");                    // "M"
pyfl("你好，世界");             // "NH，SJ"
pyfl("Made by ❤");            // "Made by ❤"
pyfl("好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈");
// "HXMGSZYYZTJZDHHHHHHH"
```

CommonJS 项目需要读取默认导出：

```js
const pyfl = require("pyfl").default;
```

## 转换规则

- 常用汉字转换为大写拼音首字母
- 英文、数字、空格和符号保持不变
- 空字符串或只包含半角空格的字符串返回空字符串
- 非字符串输入会先通过模板字符串转换为文本

```js
pyfl(123456);    // "123456"
pyfl(undefined); // "undefined"
pyfl(null);      // "null"
```

## 从源码构建

```bash
git clone https://github.com/yuxino/pyfl.git
cd pyfl
yarn
yarn test
yarn build
```

pyfl 最初为 [WeChat](https://github.com/Nbsaw/WeChat) 项目而写，字典实现改编自 [pinyinjs](https://github.com/sxei/pinyinjs)。

## 参与 pyfl

欢迎提交 [Issue](https://github.com/yuxino/pyfl/issues) 和 Pull Request。如果这个库对你有帮助，也欢迎点一个 Star。

[MIT](LICENSE) © [NBSAW](https://github.com/Nbsaw)
