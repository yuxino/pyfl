# pyfl

一个~~轻~~量级(~20kb)的Web端获取拼音首缩写.大部分字都可以测试通过

## Preface

在做某个项目的时候要用到了,现在把这个库开源出来。~~灵感~~魔改自[pinyinjs](https://github.com/sxei/pinyinjs)。

## Install

``` shell
npm install pyfl --save
```

## Usage

``` js
import pyfl from 'pyfl';

pyfl('喵'); // M

pyfl('好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈')); // HXMGSZYYZTJZDHHHHHHH

pyfl('罤夶繙着洗'); // TBFZX

pyfl('Pure'); // Pure

pyfl('Made by ❤'); // Made by ❤
```

## Author

**pyfl** © NBSAW, Released under the [MIT](https://github.com/Nbsaw/pyfl/blob/master/LICENSE) License.
