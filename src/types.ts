import { AFile } from './AFile';
import { AFileSystem } from './AFileSystem';
import {CACHED_METADATA, DIRECTORY, FILE, METADATA, TAGS} from './symbols';

export type JsonObject = {[k: string]: JsonObject} | string | number | null | Array<JsonObject>;

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


export interface FileAttachment {
    json(): Promise<JsonObject>;
    blob(): Promise<Blob>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    url(): string;
    name: string;
    [CACHED_METADATA]?: Metadata;
    [METADATA]?: Metadata;
    ['content-type']?: string;
}

export type Version = 'latest' | 'earliest' | '*' | string | number;

export interface Tags {
    [k: string]: VFile;
}

export type VFile = AFile | FileAttachment;

export interface Files extends Array<VFile> {
    [TAGS]?: Tags; // for tags
    [METADATA]?: Metadata;
}

export type Tree = {
    [FILE]?: FileHandler;
    [DIRECTORY]?: DirectoryHandler;
    [k: string]: Tree | Files;
}

export type PromiseOr<T> = T | Promise<T>;

export interface Visitor<T> {
    createFiles?: CreateFilesAction,
    createDirectory?: CreateDirectoryAction,
    file?: FileAction<T>,
    directory?: DirectoryAction<T>
}

export type CreateFilesAction = (filesystem: AFileSystem, path: string, name: string, version: Version, tree: Tree, files: Files)
    => PromiseOr<Files | null>;

export type FileAction<T> = (path: string, name: string, version: Version, files: Files)
        => PromiseOr<T>;

export type CreateDirectoryAction =
    ((filesystem: AFileSystem, path: string, name: string, rest: string[], tree: Tree) => PromiseOr<Tree> | null)
    | (() => null);

export type DirectoryAction<T> = (path: string, name: string, tree: Tree)
    => PromiseOr<T>;

export type FileHandler = (filesystem: AFileSystem, path: string, name: string, version: Version, rest: string[], tree: Tree)
    => PromiseOr<Files>;

export type DirectoryHandler = (filesystem: AFileSystem, path: string, name: string, rest: string[], tree: Tree)
    => PromiseOr<Tree>;

export interface Regenerable {
    updateCount: number;
    updated(v: this): void;
    errored(e: Error): void;
}