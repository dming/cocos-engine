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

import { systemInfo } from 'pal/system-info';
import { AudioType, AudioState, AudioEvent, AudioPCMDataView, AudioBufferView, AudioLoadOptions } from '../type';
import { EventTarget } from '../../../cocos/core/event';
import { legacyCC } from '../../../cocos/core/global-exports';
import { clamp, clamp01 } from '../../../cocos/core';
import { enqueueOperation, OperationInfo, OperationQueueable } from '../operation-queue';
import { Platform } from '../../system-info/enum-type';
import { Game, game } from '../../../cocos/game';

const urlCount: Record<string, number> = {};
const INVALID_AUDIO_ID = -1;

enum AudioBufferFormat {
    UNKNOWN = 0,
    SIGNED_8,
    UNSIGNED_8,
    SIGNED_16,
    UNSIGNED_16,
    SIGNED_32,
    UNSIGNED_32,
    FLOAT_32,
    FLOAT_64
}

interface AudioBufferInfo {
    ctor: Constructor<AudioBufferView>,
    maxValue: number;
}

const bufferConstructorMap: Record<number, AudioBufferInfo | undefined> = {
    [AudioBufferFormat.UNKNOWN]: undefined,
    [AudioBufferFormat.SIGNED_8]: { ctor: Int8Array, maxValue: 127 },
    [AudioBufferFormat.UNSIGNED_8]: { ctor: Uint8Array, maxValue: 255 },
    [AudioBufferFormat.SIGNED_16]: { ctor: Int16Array, maxValue: 32767 },
    [AudioBufferFormat.UNSIGNED_16]: { ctor: Uint16Array, maxValue: 65535 },
    [AudioBufferFormat.SIGNED_32]: { ctor: Int32Array, maxValue: 2147483647 },
    [AudioBufferFormat.UNSIGNED_32]: { ctor: Uint32Array, maxValue: 4294967295 },
    // decoded float data is normalized data, so we specify the maxValue as 1.
    [AudioBufferFormat.FLOAT_32]: { ctor: Float32Array, maxValue: 1 },
    [AudioBufferFormat.FLOAT_64]: { ctor: Float64Array, maxValue: 1 },
};

export class OneShotAudio {
    private _id: number = INVALID_AUDIO_ID;
    private _url: string;
    private _volume: number;
    private _onPlayCb?: () => void;
    get onPlay () {
        return this._onPlayCb;
    }
    set onPlay (cb) {
        this._onPlayCb = cb;
    }

    private _onEndCb?: () => void;
    get onEnd () {
        return this._onEndCb;
    }
    set onEnd (cb) {
        this._onEndCb = cb;
    }

    private constructor (url: string, volume: number)  {
        this._url = url;
        this._volume = volume;
    }
    public play (): void {
        this.onPlay?.();
    }
    public stop (): void {
    }
}

export class AudioPlayer implements OperationQueueable {
    private _url: string;
    private _id: number = INVALID_AUDIO_ID;
    private _state: AudioState = AudioState.INIT;
    private _pcmHeader: jsb.PCMHeader | null;

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _eventTarget: EventTarget = new EventTarget();
    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _operationQueue: OperationInfo[] = [];

    // NOTE: we need to cache the state in case the audio id is invalid.
    private _cachedState = {
        duration: 1, // wrong value before playing
        loop: false,
        currentTime: 0,
        volume: 1,
    }

    constructor (url: string) {
        this._url = url;
        this._pcmHeader = null;
        // event
        game.on(Game.EVENT_PAUSE, this._onInterruptedBegin, this);
        game.on(Game.EVENT_RESUME, this._onInterruptedEnd, this);
    }
    destroy () {
        game.off(Game.EVENT_PAUSE, this._onInterruptedBegin, this);
        game.off(Game.EVENT_RESUME, this._onInterruptedEnd, this);
    }
    private _onInterruptedBegin () {
        if (this._state === AudioState.PLAYING) {
            this.pause().then(() => {
                this._state = AudioState.INTERRUPTED;
                this._eventTarget.emit(AudioEvent.INTERRUPTION_BEGIN);
            }).catch((e) => {});
        }
    }
    private _onInterruptedEnd () {
        if (this._state === AudioState.INTERRUPTED) {
            this.play().then(() => {
                this._eventTarget.emit(AudioEvent.INTERRUPTION_END);
            }).catch((e) => {});
        }
    }
    static load (url: string, opts?: AudioLoadOptions): Promise<AudioPlayer> {
        return Promise.resolve(new AudioPlayer(url));
    }
    static loadNative (url: string, opts?: AudioLoadOptions): Promise<unknown> {
        return Promise.resolve(new AudioPlayer(url));
    }
    static loadOneShotAudio (url: string, volume: number, opts?: AudioLoadOptions): Promise<OneShotAudio> {
        return new Promise((resolve, reject) => {
            AudioPlayer.loadNative(url, opts).then((url) => {
                // HACK: AudioPlayer should be a friend class in OneShotAudio
                resolve(new (OneShotAudio as any)(url, volume));
            }).catch(reject);
        });
    }
    static readonly maxAudioChannel: number = 0;

    private get _isValid (): boolean {
        return this._id !== INVALID_AUDIO_ID;
    }

    get src () {
        return this._url;
    }
    get type (): AudioType {
        return AudioType.NATIVE_AUDIO;
    }
    get state (): AudioState {
        return this._state;
    }
    get loop (): boolean {
        return this._cachedState.loop;
    }
    set loop (val: boolean) {
        this._cachedState.loop = val;
    }
    get volume (): number {
        return this._cachedState.volume;
    }
    set volume (val: number) {
        val = clamp01(val);
        this._cachedState.volume = val;
    }
    get duration (): number {
        return this._cachedState.duration;
    }
    get currentTime (): number {
        return this._cachedState.currentTime;
    }

    get sampleRate (): number {
        return 0;
    }

    public getPCMData (channelIndex: number): AudioPCMDataView | undefined {
        return undefined;
    }

    @enqueueOperation
    seek (time: number): Promise<void> {
        return new Promise((resolve) => {
            // Duration is invalid before player
            // time = clamp(time, 0, this.duration);
            this._cachedState.currentTime = time;
            return resolve();
        });
    }

    @enqueueOperation
    play (): Promise<void> {
        return new Promise((resolve) => {
            this._state = AudioState.PLAYING;
            resolve();
        });
    }

    @enqueueOperation
    pause (): Promise<void> {
        return new Promise((resolve) => {
            this._state = AudioState.PAUSED;
            resolve();
        });
    }

    @enqueueOperation
    stop (): Promise<void> {
        return new Promise((resolve) => {
            this._state = AudioState.STOPPED;
            this._id = INVALID_AUDIO_ID;
            this._cachedState.currentTime = 0;
            resolve();
        });
    }
    onInterruptionBegin (cb: () => void) { this._eventTarget.on(AudioEvent.INTERRUPTION_BEGIN, cb); }
    offInterruptionBegin (cb?: () => void) { this._eventTarget.off(AudioEvent.INTERRUPTION_BEGIN, cb); }
    onInterruptionEnd (cb: () => void) { this._eventTarget.on(AudioEvent.INTERRUPTION_END, cb); }
    offInterruptionEnd (cb?: () => void) { this._eventTarget.off(AudioEvent.INTERRUPTION_END, cb); }
    onEnded (cb: () => void) { this._eventTarget.on(AudioEvent.ENDED, cb); }
    offEnded (cb?: () => void) { this._eventTarget.off(AudioEvent.ENDED, cb); }
}

// REMOVE_ME
legacyCC.AudioPlayer = AudioPlayer;
