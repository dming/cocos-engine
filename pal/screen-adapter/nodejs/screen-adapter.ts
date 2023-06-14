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

import { ConfigOrientation, IScreenOptions, SafeAreaEdge } from 'pal/screen-adapter';
import { warnID } from '../../../cocos/core/platform/debug';
import { EventTarget } from '../../../cocos/core/event/event-target';
import { Size } from '../../../cocos/core/math';
import { Orientation } from '../enum-type';

declare const my: any;

// HACK: In some platform like CocosPlay or Alipay iOS end
// the windowSize need to rotate when init screenAdapter if it's landscape
const rotateLandscape = false;

class ScreenAdapter extends EventTarget {
    public isFrameRotated = false;
    public handleResizeEvent = true;

    public get supportFullScreen (): boolean {
        return false;
    }
    public get isFullScreen (): boolean {
        return false;
    }

    public get devicePixelRatio () {
        return undefined;
    }

    public get windowSize (): Size {
        return new Size(0, 0);
    }
    public set windowSize (size: Size) {
        warnID(1221);
    }

    public get resolution () {
        const windowSize = this.windowSize;
        const resolutionScale = this.resolutionScale;
        return new Size(windowSize.width * resolutionScale, windowSize.height * resolutionScale);
    }
    public get resolutionScale () {
        return this._resolutionScale;
    }
    public set resolutionScale (value: number) {
        if (value === this._resolutionScale) {
            return;
        }
        this._resolutionScale = value;
        this._cbToUpdateFrameBuffer?.();
    }

    public get orientation (): Orientation {
        return undefined as any as Orientation;
    }
    public set orientation (value: Orientation) {
        console.warn('Setting orientation is not supported yet.');
    }

    public get safeAreaEdge (): SafeAreaEdge {
        return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        };
    }

    public get isProportionalToFrame (): boolean {
        return this._isProportionalToFrame;
    }
    public set isProportionalToFrame (v: boolean) { }

    private _cbToUpdateFrameBuffer?: () => void;
    private _resolutionScale = 1;
    private _isProportionalToFrame = false;

    constructor () {
        super();
    }

    public init (options: IScreenOptions, cbToRebuildFrameBuffer: () => void) {
        this._cbToUpdateFrameBuffer = cbToRebuildFrameBuffer;
        this._cbToUpdateFrameBuffer();
    }

    public requestFullScreen (): Promise<void> {
        return Promise.reject(new Error('request fullscreen is not supported on this platform.'));
    }
    public exitFullScreen (): Promise<void> {
        return Promise.reject(new Error('exit fullscreen is not supported on this platform.'));
    }
}

export const screenAdapter = new ScreenAdapter();
