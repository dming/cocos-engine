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

import { NODEJS } from 'internal:constants';
import { assertIsTrue } from '../../cocos/core/data/utils/asserts';

export class Pacer {
    private _stHandle: number| NodeJS.Timeout = 0;
    private _onTick: (() => void) | null = null;
    private _targetFrameRate = 60;
    private _frameTime = 0;
    private _startTime = 0;
    private _isPlaying = false;
    private _callback: (() => void) | null = null;
    private _delay = 0;
    private _start = 0;
    private _rAF: typeof requestAnimationFrame | undefined;
    private _cAF: typeof cancelAnimationFrame | undefined;

    constructor () {
        if (!NODEJS) {
            throw Error('internal:constants NODEJS must be true');
        }
    }

    get targetFrameRate (): number {
        return this._targetFrameRate;
    }

    set targetFrameRate (val: number) {
        if (this._targetFrameRate !== val) {
            assertIsTrue(val > 0);
            this._targetFrameRate = val;
            this._frameTime = 1000 / this._targetFrameRate;
            if (this._isPlaying) {
                this.stop();
                this.start();
            }
        }
    }

    set onTick (val: (() => void) | null) {
        this._onTick = val;
    }

    get onTick (): (() => void) | null {
        return this._onTick;
    }

    start (): void {
        if (this._isPlaying) return;

        const updateCallback = () => {
            this._startTime = performance.now();
            if (this._isPlaying) {
                this._stHandle = this._stTime(updateCallback);
            }
            if (this._onTick) {
                this._onTick();
            }
        };
        this._startTime = performance.now();
        this._stHandle = this._stTime(updateCallback);

        this._isPlaying = true;
    }

    stop (): void {
        if (!this._isPlaying) return;
        this._ctTime(this._stHandle);
        this._stHandle = 0;
        this._isPlaying = false;
    }

    _handleRAF = () => {
        if (performance.now() - this._start < this._delay) {
            this._rAF!.call(window, this._handleRAF);
        } else if (this._callback) {
            this._callback();
        }
    };

    private _stTime (callback: () => void) {
        const currTime = performance.now();
        const elapseTime = Math.max(0, (currTime - this._startTime));
        const timeToCall = Math.max(0, this._frameTime - elapseTime);
        if (NODEJS ||  this._rAF === undefined || globalThis.__globalXR?.isWebXR) {
            return setTimeout(callback, timeToCall);
        }
        this._start = currTime;
        this._delay = timeToCall;
        this._callback = callback;
        return this._rAF.call(window, this._handleRAF);
    }

    private _ctTime (id: number | NodeJS.Timeout | undefined) {
        if (NODEJS || this._cAF === undefined || globalThis.__globalXR?.isWebXR) {
            clearTimeout(id);
        } else if (id) {
            this._cAF.call(window, id as number);
        }
    }
}