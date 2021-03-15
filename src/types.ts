/**
 * The various types used in the system.
 *
 * @module types
 */

import { AFile } from './AFile';
import { AFileSystem } from './AFileSystem';
import {CACHED_METADATA, DIRECTORY, FILE, METADATA, TAGS} from './symbols';

/**
 * Options for requestion data from a [[VFile]]/
 */
export interface DataOptions {
    /**
     * For TSV and CSV, whether to return the rows as an array.
     */
    array?: boolean,
    /**
     * For TSV and CSV, whether to attempt to convert the values to e.g. numbers
     */
    typed?: boolean,
    /**
     * Whether data should be interconverted between text and binary based on utf8, rather than utf16.
     */
    utf8?: boolean
}

/**
 * Objects that JSON.parse can produce.
 */

export type JsonObject = {[k: string]: JsonObject} | string | number | null | Array<JsonObject>;

/**
 * The known metadata types. Additional keys may be used, without typing.
 */
export type Metadata = {
    name: string;
    url?: string;
    contentType?: string;
    length?: number;
    modificationDate?: Date;
    eTag?: string;
} & {
    [k in Exclude<string, 'modificationDate'>]: any | undefined;
};

/**
 * The properties we add to track metadata.
 */
interface MetadataProps {
    [CACHED_METADATA]?: Metadata;
    [METADATA]?: Metadata;
}

/**
 * The common portion of the ObservableHQ](https://observablehq.com)-supplied
 * [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 * interface.
 */
interface FileAttachmentBase {
    json(opts?: DataOptions): Promise<JsonObject>;
    blob(opts?: DataOptions): Promise<Blob>;
    text(opts?: DataOptions): Promise<string>;
    arrayBuffer(opts?: DataOptions): Promise<ArrayBuffer>;
    csv(opts?: DataOptions): Promise<any>;
    tsv(opts?: DataOptions): Promise<any>;
    name: string;
}

/**
 * The ObservableHQ](https://observablehq.com)-supplied
 * [FileAttachment](https://observablehq.com/@observablehq/file-attachments).
 */
export interface FileAttachment extends FileAttachmentBase, MetadataProps {
    url(): string;
    ['content-type']?: string;
}

/**
 * The interface for the [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 * analogs we supply. These differ in that [[IAFile.url]] returns a `Promise<string>` rather
 * than a `string`.
 */
export interface IAFile extends FileAttachmentBase, MetadataProps {
    url(): Promise<string>;
}

/**
 * Version numbers/tags (labels) for files.
 */
export type Version = 'latest' | 'earliest' | string | number;

/**
 * Version, including the special version '*'.
 */
export type DeleteVersion = Version | '*';
export interface Tags {
    [k: string]: VFile;
}

/**
 * File entries are either a [ObservableHQ](https://observablehq.com)-supplied
 * [FileAttachment](https://observablehq.com/@observablehq/file-attachments), or an [[AFile]]
 */
export type VFile = AFile | FileAttachment;

/**
 * An array of file versions. The array can be sparse if versions are
 * deleted. File version indexes start at 1, but the arrays start at 0.
 *
 * So the tree:
 * ```javascript
 * const tree: Tree = {
 *    myFile: [file1, file2]
 * };
 * ```
 * provides 2 versions of `/myFile`. Version 1 is _file1_ and version 2 is _file2_.
 */
export interface Files extends Array<VFile> {
    [TAGS]?: Tags; // for tags
    [METADATA]?: Metadata;
}

/**
 * A directory tree, denoting the hierarchy of files. Javascript `Object`s are the directories.
 * * Entries in the directory are named by keys.
 * * If the value of an entry is another Javascript `Object`, it is a subdirectory.
 * * If the value of an entry is an `Array`, it is a list of file versions. See [[Files]]
 */
export type Tree = {
    /**
     * Special symbol entry [[FILE]] provides a function that dynamically adds files on demand.
     */
    [FILE]?: FileHandler;
    /**
     * Special symbol entry [[DIRECTORY]] provides a function that dynamically adds subdirectories on demand.
     */
    [DIRECTORY]?: DirectoryHandler;
    /**
     * Regular entries
     */
    [k: string]: Tree | Files;
}

/**
 * A value, or a `Promise` of a value, where either synchronous or async code may be used.
 * @typeParam T the wrapped type
 */
export type PromiseOr<T> = T | Promise<T>;

/**
 * A handler to dynamically add files. It is called when a file is not found, and can add that file or more.
 *
 * The handler implementation will typically return an array of a single [[AFile]] instance (or zero if no file should be added).
 *
 * Advanced usages can return multiple versions in the array, or use {@link setVersion | setVersion()} to tag entries in the
 * array.
 */
export type FileHandler = (filesystem: AFileSystem, path: string, name: string, version: Version, rest: string[], tree: Tree)
    => PromiseOr<Files>;

/**
 * A handler to dynamically add subdirectories. It is called when a directory is not found, and can create
 * a subdirectory heirarchy on demand. A [[DirectoryHandler]] that adds itself to the returned tree as a
 * [[DIRECTORY]] handler can create an infinite on-demand hierarchy.
 */
export type DirectoryHandler = (filesystem: AFileSystem, path: string, name: string, rest: string[], tree: Tree)
    => PromiseOr<Tree>;

export interface Regenerable {
    updateCount: number;
    updated(v: this): void;
    errored(e: Error): void;
}