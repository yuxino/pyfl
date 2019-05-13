# PYFL

![https://circleci.com/gh/Nbsaw/pyfl/tree/master](https://flat.badgen.net/circleci/github/Nbsaw/pyfl)
![https://www.npmjs.com/package/pyfl](https://flat.badgen.net/npm/v/pyfl)
![https://www.npmjs.com/package/pyfl](https://flat.badgen.net/npm/dm/pyfl)
![https://www.npmjs.com/package/pyfl](https://flat.badgen.net/npm/dependents/pyfl)

一个并不轻量级(~20kb)的 Web 端获取拼音首缩写.大部分字都可以测试通过

## PREFACE

在做某个项目的时候要用到了,现在把这个库开源出来。魔改自[pinyinjs](https://github.com/sxei/pinyinjs)。

## INSTALL

```shell
yarn add pyfl
```

## USAGE

只支持传入字符串参数。如果该字符串不存在对应的拼音会反回原字符。

```js
import pyfl from 'pyfl';

pyfl('喵'); // M

pyfl('好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈')); // HXMGSZYYZTJZDHHHHHHH

pyfl('罤夶繙着洗'); // TBFZX

pyfl('Pure'); // Pure

pyfl('Made by ❤'); // Made by ❤
```

## FAQ

- 如何在直接在 Node 端引用 ?

  ```js
  const pyfl = require("pyfl").default;
  ```
- 有代码示例怎么用在项目里面吗 ?
  有,请看这一个[链接](https://github.com/Nbsaw/WeChat)

## OTHER

如果这个库对你有帮助的话，希望能在 github 上给个 star。

## License

MIT © [NBSAW](https://github.com/Nbsaw/pyfl/blob/master/LICENSE)
