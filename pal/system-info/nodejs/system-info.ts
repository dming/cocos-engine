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

import { DEBUG, EDITOR, PREVIEW, TEST } from 'internal:constants';
import { IFeatureMap } from 'pal/system-info';
import { EventTarget } from '../../../cocos/core/event';
import { BrowserType, NetworkType, OS, Platform, Language, Feature } from '../enum-type';

const OsType: () => string = globalThis.os.type;

class SystemInfo extends EventTarget {
    public readonly networkType: NetworkType;
    public readonly isNative: boolean;
    public readonly isBrowser: boolean;
    public readonly isNodeJs: boolean;
    public readonly isMobile: boolean;
    public readonly isLittleEndian: boolean;
    public readonly platform: Platform;
    public readonly language: Language;
    public readonly nativeLanguage: string;
    public readonly os: OS;
    public readonly osVersion: string;
    public readonly osMainVersion: number;
    public readonly browserType: BrowserType;
    public readonly browserVersion: string;
    public readonly isXR: boolean;
    private _featureMap: IFeatureMap;
    private _initPromise: Promise<void>[];

    constructor () {
        super();

        this.networkType = NetworkType.LAN;  // TODO
        this.isNative = false;
        this.isBrowser = false;
        this.isNodeJs = true;

        // init isMobile and platform
        this.isMobile = false;
        this.platform = Platform.NODEJS;

        // init isLittleEndian
        this.isLittleEndian = (() => {
            const buffer = new ArrayBuffer(2);
            new DataView(buffer).setInt16(0, 256, true);
            // Int16Array uses the platform's endianness.
            return new Int16Array(buffer)[0] === 256;
        })();

        // init languageCode and language
        this.nativeLanguage = Language.ENGLISH.toLowerCase();
        this.language = Language.ENGLISH as Language;

        // init os, osVersion and osMainVersion
        switch (OsType()) {
        case 'Darwin':
            this.os = OS.OSX;
            break;
        case 'Linux':
            this.os = OS.LINUX;
            break;
        case 'Windows_NT':
            this.os = OS.WINDOWS;
            break;
        default:
            this.os = OS.UNKNOWN;
            break;
        }
        this.osVersion = '';
        this.osMainVersion = 0;

        // TODO: use dack-type to determine the browserType
        // init browserType and browserVersion
        this.browserType = BrowserType.UNKNOWN;
        // init browserVersion
        this.browserVersion = '';

        this.isXR = false;

        // refer https://stackoverflow.com/questions/47879864/how-can-i-check-if-a-browser-supports-webassembly
        const supportWasm = false;

        this._featureMap = {
            [Feature.WEBP]: false,
            [Feature.IMAGE_BITMAP]: false,      // Initialize in Promise
            [Feature.WEB_VIEW]: false,
            [Feature.VIDEO_PLAYER]: false,
            [Feature.SAFE_AREA]: false,
            [Feature.HPE]: false,

            [Feature.INPUT_TOUCH]: false,
            [Feature.EVENT_KEYBOARD]: false,
            [Feature.EVENT_MOUSE]: false,
            [Feature.EVENT_TOUCH]: false,
            [Feature.EVENT_ACCELEROMETER]: false,
            // NOTE: webkitGetGamepads is not standard web interface
            [Feature.EVENT_GAMEPAD]: false,
            [Feature.EVENT_HANDLE]: this.isXR,
            [Feature.EVENT_HMD]: this.isXR,
            [Feature.EVENT_HANDHELD]: this.isXR,
            [Feature.WASM]: supportWasm,
        };

        this._initPromise = [];

        this._registerEvent();
    }

    private _registerEvent () {
        // nothing: nodejs dont need to regist `onShow` or `onHide` events.
    }

    private _setFeature (feature: Feature, value: boolean) {
        return this._featureMap[feature] = value;
    }

    public init (): Promise<void[]> {
        return Promise.all(this._initPromise);
    }

    public hasFeature (feature: Feature): boolean {
        return this._featureMap[feature];
    }

    public getBatteryLevel (): number {
        console.warn('getBatteryLevel is not supported');
        return 1;
    }
    public triggerGC (): void {
        if (DEBUG) {
            console.warn('triggerGC is not supported.');
        }
    }
    public openURL (url: string): void {
        window.open(url);
    }
    public now (): number {
        if (Date.now) {
            return Date.now();
        }

        return +(new Date());
    }
    public restartJSVM (): void {
        if (DEBUG) {
            console.warn('restartJSVM is not supported.');
        }
    }

    public close () {
        this.emit('close');
        window.close();
    }
}

export const systemInfo = new SystemInfo();
