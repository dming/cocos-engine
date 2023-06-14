
1. cocos客户端用`web-desktop`正常打包出web-desktop文件夹，复制到nodejs项目下。
2. 复制 `dming.js` `dming/` 到web-desktop文件夹里。
3. 复制 `package.json` 并使用 `npm install` 安装必要npm packages.
4. run `dming.js`

5. cocos-engin 里使用 `npm run build:nodejs` 打包出cc.js文件并替代web-desktop文件夹里的cc.js文件。