/**
 * Various utilities.
 */

import { is } from "ramda";
import { METADATA, TAGS } from "./symbols";
import { FileAttachment, Files, Metadata, Tree, Version, VFile } from "./types";

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

/**
 * A type guard to distinguish directory trees and file arrays.
 * @param t The object, which should be a directory tree or a files array
 * @returns `true` if the argument is a `Files` array
 */
export const isFiles = (t?: Tree | Files): t is Files => Array.isArray(t);

/**
 * A type guard to distinguish directory trees and file arrays.
 * @param t The object, which should be a directory tree or a files array
 * @returns `true` if the argument is a `Tree`
 */
export const isTree = (t?: Tree | Files): t is Tree => t instanceof Object;

/**
 * A type checker that verifies the argument is a file array, not a directory tree.
 * Throws an error if given something else
 * @param t A tree or a file array
 * @returns A file array or `null` if the argument was undefined
 */
export const asFiles = (t?: Tree | Files): Files | null =>
    isFiles(t)
        ? t
        : t === undefined || t === null
            ? null
            : Throw(`Unexpected file level`);

/**
 * A type checker that verifies the argument is a tree, not a file array. Throws an error
 * if given something else.
 * @param t A tree or a file array
 * @returns Tree or `null` if the argument was undefined.
 */
export const asTree = (t?: Tree | Files): Tree | null =>
    isTree(t)
        ? t
        : t === undefined || t === null
            ? null
            : Throw(`Unexpected directory level`);

const isFunction = (t: any) => t instanceof Function;

/**
 * A type guard that determines if the argument is a [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 * @param a A [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or [[AFile]]
 * @returns `true` if argument is a [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 */
export const isFileAttachment = (a: any): a is FileAttachment =>
    a
    && isFunction(a?.json)
    && isFunction(a?.text)
    && isFunction(a?.blob)
    && isFunction(a?.buffer)
    && isFunction(a?.stream)
    && isFunction(a?.url)
    && a.constructor !== Object;

/**
 * Add a file at a specific version or label in a [[Files]] array.
 * This is an internal tool for implementing [[FILE]] handlers.
 * @param files The Files array
 * @param version The version to delete. Either a version number or a label
 * @returns void
 */
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

/**
 * Add a file at a specific version or label in a [[Files]] array.
 * This is an internal tool for implementing [[FILE]] handlers.
 * @param files The Files array
 * @param version The version to delete. Either a version number or a label
 * @param newFile The [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or [[AFile]]
 * @returns void
 */
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

/**
 * Delete a specific version from a [[Files]] array. This is an internal tool for implementing
 * [[FILE]] handlers
 * @param files The Files array
 * @param version The version to delete. Either a version number or a label
 * @returns void
 */
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

/**
 * Encode a string into an ArrayBuffer.
 * @param s The string to be encoded
 * @returns An `ArrayBuffer` with the string data as UTF-16
 */
export const encodeString = (s: string) => {
    const ab = new ArrayBuffer(s.length * 2);
    const buf = new Uint16Array(ab);
    for (let i = 0; i < s.length; i++) {
      buf[i] = s.codePointAt(i)!;
    }
    return ab;
  };

  /**
   * Associate a _metadata_ object with the specified file (or array of file
   * versions). This is normally used to annotate entries in the
   * [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
   * tree.
   */
export const meta = <T>(obj: T, metadata: Metadata) =>
   obj && Object.defineProperty(obj, METADATA, { value: metadata });
