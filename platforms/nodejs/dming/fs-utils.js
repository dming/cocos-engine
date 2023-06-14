/****************************************************************************
 Copyright (c) 2017-2019 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of fsUtils software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in fsUtils License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
const fs = require('fs');

const outOfStorageRegExp = /the maximum size of the file storage/;

const fsUtils = {

    fs,

    isOutOfStorage(errMsg) {
        return outOfStorageRegExp.test(errMsg);
    },

    getUserDataPath() {
        return __dirname;
    },

    checkFsValid() {
        if (!fs) {
            console.warn('can not get the file system!');
            return false;
        }
        return true;
    },

    deleteFile(filePath, onComplete) {
        fs.unlink(filePath, onComplete);
    },

    // eslint-disable-next-line no-unused-vars
    downloadFile(remoteUrl, filePath, header, onProgress, onComplete) {
        console.warn('not support downloadFile');
    },

    saveFile(srcPath, destPath, onComplete) {
        fs.copyFile(srcPath, destPath, onComplete);
    },

    copyFile(srcPath, destPath, onComplete) {
        fs.copyFile(srcPath, destPath, onComplete);
    },

    writeFile(path, data, encoding, onComplete) {
        fs.writeFile(path, data, {
            encoding,
        }, onComplete);
    },

    writeFileSync(path, data, encoding) {
        try {
            fs.writeFileSync(path, data, encoding);
            return null;
        } catch (e) {
            console.warn(`Write file failed: path: ${path} message: ${e.message}`);
            return new Error(e.message);
        }
    },

    readFile(filePath, encoding, onComplete) {
        fs.readFile(filePath, encoding, onComplete);
    },

    readDir(filePath, onComplete) {
        fs.readdir(filePath, onComplete);
    },

    readText(filePath, onComplete) {
        fsUtils.readFile(filePath, 'utf8', onComplete);
    },

    readArrayBuffer(filePath, _onComplete) {
        const onComplete = (err, data) => {
            if (!err) {
                data = new Uint8Array(data);
            }
            _onComplete(err, data);
        };
        fsUtils.readFile(filePath, null, onComplete);
    },

    readJson(filePath, onComplete) {
        fsUtils.readFile(filePath, 'utf8', (err, text) => {
            let out = null;
            if (!err) {
                try {
                    out = JSON.parse(text);
                } catch (e) {
                    console.warn(`Read json failed: path: ${filePath} message: ${e.message}`);
                    err = new Error(e.message);
                }
            }
            onComplete && onComplete(err, out);
        });
    },

    readJsonSync(path) {
        try {
            const str = fs.readFileSync(path, 'utf8');
            return JSON.parse(str);
        } catch (e) {
            console.warn(`Read json failed: path: ${path} message: ${e.message}`);
            return new Error(e.message);
        }
    },

    makeDirSync(path, recursive) {
        try {
            fs.mkdirSync(path, {
                recursive,
            });
            return null;
        } catch (e) {
            console.warn(`Make directory failed: path: ${path} message: ${e.message}`);
            return new Error(e.message);
        }
    },

    rmdirSync(dirPath, recursive) {
        try {
            fs.rmdirSync(dirPath, {
                recursive,
            });
            return null;
        } catch (e) {
            console.warn(`rm directory failed: path: ${dirPath} message: ${e.message}`);
            return new Error(e.message);
        }
    },

    exists(filePath, onComplete) {
        fs.access(filePath, onComplete);
    },

    // eslint-disable-next-line no-unused-vars
    loadSubpackage(name, onProgress, onComplete) {
        throw new Error('not implement');
    },

};

globalThis.fsUtils = module.exports = fsUtils;
