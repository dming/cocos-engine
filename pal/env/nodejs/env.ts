/*
 Copyright (c) 2022-2023 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 of the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

import type * as NodeJsPath from 'path';

declare const NodePath: NodeJsPath.PlatformPath;

declare const require: (path: string) =>  Promise<void>;

export function findCanvas (): { frame: HTMLDivElement, container: HTMLDivElement, canvas: HTMLCanvasElement } {
    const frame = undefined as any as HTMLDivElement;
    const container = undefined as any as HTMLDivElement;
    const canvas = undefined as any as HTMLCanvasElement;

    return { frame, container, canvas };
}

export function loadJsFile (path: string): Promise<void> {
    const fullPath = NodePath.resolve(path);
    console.log('require fullPath=', fullPath);
    // eslint-disable-next-line import/no-dynamic-require
    return require(`${fullPath}`);
}

// export function loadJsFile (path: string): Promise<void> {
//     // const fullPath = NodePath.resolve(path);
//     // console.log('fullPath=', fullPath);
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//     return import(`../${path}`);
// }
