/**
 * General utilities
 * @module util
 */

import { METADATA, TAGS } from "./symbols";
import { FileAttachment, Files, Metadata, Tree, Version, VFile, DataOptions, PromiseOr } from "./types";

import * as d3 from 'd3-dsv';
import { any } from "ramda";
import { AFile } from "./AFile";

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
 * Canonicalize the version. Produces:
 * * an index into the array
 * * a string index into the [[TAGS]] object
 * * `null`, if `0` version (state before any versions).
 * @param version
 * @param length the number of versions, to use for range checking and negative versions
 * @returns a number, string, or `null`
 */
const canonicalizeVersion = (version: Version | null | undefined, length: number): Version | null => {
    version = version ?? -1;
    if (typeof version === 'string') {
        switch (version) {
            case 'latest':
                return length - 1;
            case 'earliest':
                return 0;
            case '*':
                throw new Error(`Illegal version: ${version}`);
        }
        // If a number passed as a string convert to a number.
        if (/^[-+]?\d+$/.test(version)) {
            return canonicalizeVersion(Number.parseInt(version, 10), length);
        }
        // Tag
        return version;
    }
    version = version ?? -1;
    if (version === 0) {
        // The initial state is no file.
        return null;
    }
    // Negative versions count from most recent.
    return version < 0
        ? length + version < 0
            ? null
            : length + version
        : version - 1;
}

/**
 * Add a file at a specific version or label in a [[Files]] array.
 * This is an internal tool for implementing [[FILE]] handlers.
 * @param files The Files array
 * @param version The version to delete. Either a version number or a label
 * @returns void
 */
export const getVersion = (files: Files, version: Version): VFile | null => {
    const cVersion = canonicalizeVersion(version, files.length);
    return cVersion === null
        ? null
        : typeof cVersion === 'string'
            ? files[TAGS]?.[cVersion] ?? null
            : files[cVersion] ?? null;
};

/**
 * Wrap an [[AFile]] in a [[Files]] version array, with the specified
 * versions or labels assigned to it.
 * @param file the [[AFile]]
 * @param versions zero or more [[Version]]s (positive numbers or strings)
 * @returns a [[Files]] array.
 */
export const versions = (file: AFile, ...versionList: Version[]) => {
    if (versionList.length === 0) {
        versionList = [1];
    }
    const files: Files = [];
    versionList.forEach(v => setVersion(files, v, file));
    return files;
};

/**
 * Convenience method to construct an entry in a [[AFileSystem]] tree.
 * Takes a name and a data item, optional metadata, and list of versions,
 * and constructs the appropriate [[Files]] array for the tree.
 *
 * Simplest usage:
 * ```javascript
 * F = new AFileSystem({
 *   myFile: file('myFile', (myData));
 * });
 *
 * Advanced usage that supplies a creation date as metadata, and gives the file
 * a version of 1 and a label of 'tested';
 * ```javascript
 * F = new AFileSystem({
 *   myFile: file('myFile', (myData), {creationDate}, 1, 'tested');
 * });
 * ```
 * @param name The name of the file
 * @param data The data to store
 * @param metadata The metadata to associate with both array and file
 * @param versionList A list of versions to store the file under, or `[1]`.
 * @returns
 */
export function file(name: string, data: any, metadata?: Partial<Metadata> | null | undefined, ...versionList: Version[]): Files;
export function file(name: string, data: any, ...versionList: Version[]): Files;
export function file(name: string, data: any, metadata?: Partial<Metadata>|Version|null|undefined, ...versionList: Version[]) {
    if (!metadata) {
        const mData = {name};
        const file = new AFile(name, data);
        const meta2 = {...mData, ...(file[METADATA] ?? {})};
        return meta(versions(file, ...versionList), meta2)
    } if (typeof metadata === 'string' || typeof metadata === 'number') {
        const mData = {name};
        const file = new AFile(name, data);
        const meta2 = {...mData, ...(file[METADATA] ?? {})};
        return meta(versions(file, metadata, ...versionList), meta2)
    } else {
        const mData = {name, ...(metadata ?? {})};
        const file = new AFile(name, data, metadata);
        const meta2 = {...mData, ...(file[METADATA] ?? {})};
        return meta(versions(file, ...versionList), meta2);
    }
};

/**
 * Convenience method to construct an entry in a [[AFileSystem]] tree,
 * without having to specifiy the name multiple times.
 * Takes a name and a data item, optional metadata, and list of versions,
 * and constructs the appropriate [[Files]] array for the tree.
 *
 * Simplest usage:
 * ```javascript
 * F = new AFileSystem({
 *   myFile: file('myFile', (myData));
 * });
 *
 * Advanced usage that supplies a creation date as metadata, and gives the file
 * a version of 1 and a label of 'tested';
 * ```javascript
 * F = new AFileSystem({
 *   ...entry('myFile', (myData), {creationDate}, 1, 'tested');
 * });
 * ```
 * @param name The name of the file
 * @param data The data to store
 * @param metadata The metadata to associate with both array and file
 * @param versionList A list of versions to store the file under, or `[1]`.
 * @returns
 */
export function entry(name: string, data: any, metadata?: Partial<Metadata> | null | undefined, ...versionList: Version[]): Tree;
export function entry(name: string, data: any, ...versionList: Version[]): Tree;
export function entry(name: string, data: any, metadata?: Partial<Metadata>|Version|null|undefined, ...versionList: Version[]) {
    return {[name]: file(name, data, metadata as Partial<Metadata>, ...versionList)};
};


/**
 * Add a file at a specific version or label in a [[Files]] array.
 * This is an internal tool for implementing [[FILE]] handlers.
 * @param files The Files array
 * @param version The version to set. Either a version number or a label
 * @param newFile The [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or [[AFile]]
 * @returns void
 */
export const setVersion = (files: Files, version: Version, newFile: VFile): void => {
    const cVersion = canonicalizeVersion(version, files.length);
    if (cVersion === null) {
        throw new Error(`Cannot set version ${version}`);
    } else if (typeof cVersion === 'string') {
        if (!files[TAGS]) {
            files[TAGS] = {};
        }
        files[TAGS]![version] = newFile;
    } else {
        files[cVersion] = newFile;
    }
};

/**
 * Delete a specific version from a [[Files]] array. This is an internal tool for implementing
 * [[FILE]] handlers
 * @param files The Files array
 * @param version The version to delete. Either a version number or a label. The special label '*' deletes all versions.
 * @returns void
 */
export const deleteVersion = (files: Files, version: Version): void => {
    switch (version) {
        case '*':
            files.length = 0;
            files[TAGS] = {};
            files[METADATA] = files[METADATA] ?? {name: files[METADATA]!.name};
            return;
    }
    const cVersion = canonicalizeVersion(version, files.length);
    if (cVersion === null) {
        return;
    } else if (typeof version === 'string') {
        // Tag
        const tags = files?.[TAGS];
        if (tags) {
            delete tags[version];
        }
        return;
    } else {
        delete files[version];
    }
};

/**
 * Encode a `string` into an `ArrayBuffer`.
 * @param s The `string` to be encoded
 * @returns An `ArrayBuffer` with the string data as UTF-16
 */
export const encodeString16 = (s: string) => {
    const ab = new ArrayBuffer(s.length * 2);
    const buf = new Uint16Array(ab);
    for (let i = 0; i < s.length; i++) {
      buf[i] = s.codePointAt(i)!;
    }
    return ab;
  };

/**
 * Convert a `string` to an `ArrayBuffer`, in either UTF8 or UTF16 formats.
 * @param s
 * @param param1
 * @returns an `ArrayBuffer` with the `string`'s content in the requested format.
 */
export const toArrayBuffer = (s: string, {utf8 = true}: DataOptions = {utf8: true}) => {
    if (utf8) {
        return new TextEncoder().encode(s).buffer
    } else {
        return encodeString16(s);
    }
};

/**
 * Convert an `ArrayBuffer` to a `string`.
 * @param ab An `ArrayBuffer`
 * @param param1
 * @returns the string
 */
export const fromArrayBuffer = (ab: ArrayBuffer, {utf8 = true}: DataOptions = {utf8: true}) => {
    return new TextDecoder(utf8 ? 'utf-8' : 'utf-16').decode(ab);
};

/**
 * Associate a _metadata_ object with the specified file (or array of file
 * versions). This is normally used to annotate entries in the [[AFileSystem]]
 * tree.
 */
export const meta = <T>(obj: T, metadata: Metadata) =>
   obj && Object.defineProperty(obj, METADATA, { value: metadata });

const nullTyper = undefined as unknown as typeof d3.autoType;
/**
 *
 * @param data The data to be parsed
 * @param delimiter The field delimiter, either `"\t"` or `","`.
 * @param options
 * @returns
 */
export function dsv(data: string, delimiter: '\t' | ',', { array = false, typed = false, utf8 = false }: DataOptions = {}) {
    const typer = typed ? d3.autoType : nullTyper;
    switch (delimiter) {
        case '\t':
            if (array) {
                return d3.tsvParseRows(data, typer);
            } else {
                return d3.tsvParse(data, typer);
            }
        case ',':
            if (array) {
                return d3.csvParseRows(data, typer);
            } else {
                return d3.csvParse(data, typer);
            }
    }
  }