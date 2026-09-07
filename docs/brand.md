# Pyfl 品牌形象

2026-09-07 品牌升级采用白色短发的小魔女近景：紫眼、侧辫与黑蝴蝶结、黑帽菱形带、紫晶及「拼 / P」字牌。突出脸部与自然表情，保持黑白与既有淡紫细节。

原始品牌插画保留为 `docs/pyfl-avatar.png`，与[官网](https://pyfl.yuxino.cn)分享图使用同一幅 1254 × 1254 RGB 插画。图像由内置 imagegen 生成并经仅发型编辑确认，原图 SHA-256 `1dfffa1cafdd23042f2f262a1983a7e8a367a27e200ac9c6fa1ebcb2bea9875a`，1,485,055 B。网页首屏继续使用该插画的 WebP 压缩版本。

最终为短发；长发稿没有发布。原头像可从 Git 历史恢复。品牌图片和本文不在 npm 包 files 列表中。完整生成 prompt 与素材压缩记录位于官网仓库 `docs/character-asset.md`。

## 2026-09-08：中文优先与圆形标志

项目面向中文用户，默认 README 使用简体中文，英文说明保留在 `README_en.md`。正式标志为 [pyfl-logo.png](pyfl-logo.png)，README 与官网页首、页脚和 favicon 使用这幅圆形卡通徽章。原始头像、官网首屏与分享图保留。

标志由内置 imagegen 参考原短发头像生成，改为头肩近景，保留紫眼、黑色魔女帽和「拼 / P」字牌；白色圆内外背景，细灰圆框，无渐变或棋盘格。文件为 1254 × 1254 RGB PNG，圆外是不透明白色，不宣称具备 alpha 通道。SHA-256：`5a7b6d714a96c2842a356b17b96293da7febabef157c500d0331521e3598e2fa`。

此前的 SVG 圆形展示稿 [pyfl-logo.svg](pyfl-logo.svg) 保留作源图展示参考；GitHub 的图片限制会阻断内嵌位图，因此正式 README 改用普通 PNG。生成透明 PNG 时出现过烘焙棋盘格，这些失败稿没有采用或加入仓库。旧紫色渐变字牌 `pyfl-icon.svg` 不再作为当前标志。
