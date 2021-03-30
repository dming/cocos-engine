/*
 Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
 * @packageDocumentation
 * @hidden
 */

import { Color, Size, Vec2, Vec3, Vec4 } from '../math';
import { IValueProxy, IValueProxyFactory } from './value-proxy';
import { isPropertyPath, PropertyPath, TargetPath, evaluatePath } from './target-path';
import { error } from '../platform/debug';

export interface IBoundTarget {
    setValue (value: any): void;
    getValue (): any;
}

export interface IBufferedTarget extends IBoundTarget {
    peek(): any;
    pull(): void;
    push(): void;
}

export function createBoundTarget (target: any, modifiers: TargetPath[], valueAdapter?: IValueProxyFactory): null | IBoundTarget {
    let ap: {
        isProxy: false;
        object: any;
        property: PropertyPath;
    } | {
        isProxy: true;
        proxy: IValueProxy;
    };
    const lastPath = modifiers[modifiers.length - 1];
    if (modifiers.length !== 0 && isPropertyPath(lastPath) && !valueAdapter) {
        const resultTarget = evaluatePath(target, ...modifiers.slice(0, modifiers.length - 1));
        if (resultTarget === null) {
            return null;
        }
        ap = {
            isProxy: false,
            object: resultTarget,
            property: lastPath,
        };
    } else if (!valueAdapter) {
        error(`Empty animation curve.`);
        return null;
    } else {
        const resultTarget = evaluatePath(target, ...modifiers);
        if (resultTarget === null) {
            return null;
        }
        ap = {
            isProxy: true,
            proxy: valueAdapter.forTarget(resultTarget),
        };
    }

    return {
        setValue: (value) => {
            if (ap.isProxy) {
                ap.proxy.set(value);
            } else {
                ap.object[ap.property] = value;
            }
        },
        getValue: () => {
            if (ap.isProxy) {
                if (!ap.proxy.get) {
                    error(`Target doesn't provide a get method.`);
                    return null;
                } else {
                    return ap.proxy.get();
                }
            } else {
                return ap.object[ap.property];
            }
        },
    };
}

export function createBufferedTarget (target: any, modifiers: TargetPath[], valueAdapter?: IValueProxyFactory): null | IBufferedTarget {
    const boundTarget = createBoundTarget(target, modifiers, valueAdapter);
    if (boundTarget === null) {
        return null;
    }
    const value = boundTarget.getValue();
    const copyable = getBuiltinCopy(value);
    if (!copyable) {
        error(`Value is not copyable!`);
        return null;
    }
    const buffer = copyable.createBuffer();
    const copy = copyable.copy;
    return Object.assign(boundTarget, {
        peek: () => buffer,
        pull: () => {
            const value = boundTarget.getValue();
            copy(buffer, value);
        },
        push: () => {
            boundTarget.setValue(buffer);
        },
    });
}

interface ICopyable {
    createBuffer: () => any;
    copy: (out: any, source: any) => any;
}

function SizeCopy (out: Size, source: Size) {
    return out.set(source);
}

const getBuiltinCopy = (() => {
    const map = new Map<Constructor, ICopyable>();
    map.set(Vec2, { createBuffer: () => new Vec2(), copy: Vec2.copy });
    map.set(Vec3, { createBuffer: () => new Vec3(), copy: Vec3.copy });
    map.set(Vec4, { createBuffer: () => new Vec4(), copy: Vec4.copy });
    map.set(Color, { createBuffer: () => new Color(), copy: Color.copy });
    map.set(Size,  { createBuffer: () => new Size(), copy: SizeCopy });
    return (value: any) => map.get(value?.constructor);
})();