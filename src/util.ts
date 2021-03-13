/**
 * Various utilities.
 */

import { is } from "ramda";
import { METADATA, TAGS } from "./symbols";
import { FileAttachment, Files, Tree, Version, VFile } from "./types";

/**
 * like 'throw', but a function rather than a statement.
 * @param e The exception or string to be thrown.
 */
export const Throw = (e: Error | string) => {
    if (e instanceof Error) {
        throw e;
    }
    throw new Error(e);
}

export const isFiles = (t?: Tree | Files): t is Files => Array.isArray(t);
export const isTree = (t?: Tree | Files): t is Tree => t instanceof Object;

export const asFiles = (t?: Tree | Files): Files | null =>
    isFiles(t)
        ? t
        : t === undefined
            ? null
            : Throw(`Unexpected file level`);

export const asTree = (t?: Tree | Files): Tree | null =>
    isTree(t)
        ? t
        : t === undefined
            ? null
            : Throw(`Unexpected directory level`);

const isFunction = (t: any) => t instanceof Function;

export const isFileAttachment = (a: any): a is FileAttachment =>
    isFunction(a?.json)
    && isFunction(a?.text)
    && isFunction(a?.blob)
    && isFunction(a?.buffer)
    && isFunction(a?.stream)
    && isFunction(a?.url)


export const getVersion = (files: Files, version: Version): VFile | null => {
    if (typeof version === 'string') {
        switch (version) {
            case 'latest':
                return files[files.length - 1];
            case 'earliest':
                return files[0];
        }
        // If a number passed as a string convert to a number.
        if (/^\d+$/.test(version)) {
            return getVersion(files, Number.parseInt(version, 10));
        }
        // Tag
        return files?.[TAGS]?.[version] ?? null;
    }
    if (files.length === 0) return null;
    return files[version === -1 ? files.length - 1 : version] ?? null;
};

export const setVersion = (files: Files, version: Version, newFile: VFile): void => {
    if (typeof version === 'string') {
        switch (version) {
            case 'latest':
            case '*':
                files.push(newFile)
                return;
            case 'earliest':
                files[0] = newFile;
                return;
        }
        // If a number passed as a string convert to a number.
        if (/^\d+$/.test(version)) {
            return setVersion(files, Number.parseInt(version, 10), newFile);
        }
        // Tag
        files[TAGS] = files[TAGS] ?? {};
        files[TAGS]![version] = newFile;
        return;
    }
    if (version < 0) throw new Error(`Negative file version: ${newFile.name}:${version}`);
    files[version === -1 ? files.length : version] = newFile;
};


export const deleteVersion = (files: Files, version: Version): void => {
    if (typeof version === 'string') {
        switch (version) {
            case '*':
                files.length = 0;
                files[TAGS] = {};
                files[METADATA] = files[METADATA] ?? {name: files[METADATA]!.name};
                return;
            case 'latest':
                delete files[files.length - 1];
                return;
            case 'earliest':
                delete files[0];
                return;
        }
        // If a number passed as a string convert to a number.
        if (/^\d+$/.test(version)) {
            return deleteVersion(files, Number.parseInt(version, 10));
        }
        // Tag
        const tags = files?.[TAGS];
        if (tags) {
            delete tags[version];
        }
        return;
    }
    if (version < 0) throw new Error(`Negative file version: ${version}`);
    delete files[version === -1 ? files.length - 1 : version];
};

export const encodeString = (s: string) => {
    const ab = new ArrayBuffer(s.length * 2);
    const buf = new Uint16Array(ab);
    for (let i = 0; i < s.length; i++) {
      buf[i] = s.codePointAt(i)!;
    }
    return ab;
  };
