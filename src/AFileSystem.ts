import {asFiles, asTree, getVersion, isFileAttachment, setVersion, Throw} from './util';
import {FileAction, CreateFilesAction, CreateDirectoryAction, Files, Regenerable, Tree, Version, FileAttachment, Metadata, VFile, Visitor } from './types';
import { METADATA, FILE, DIRECTORY, CACHED_METADATA } from './symbols';
import { regenerator } from './regenerator';

let nameNum = 0;

const meta = (obj: any, metadata: any) => obj && Object.defineProperty(obj, METADATA, { value: metadata });

// Traverse the filesystem, ultimately performing _action_ on the found file.
// Missing files or directories are handled by createAction; the default is to
// return null.
const traverse = <T>(filesystem: AFileSystem, path: string, tree: Tree, visitor: Visitor<T | null>) => {
    const {
        file: fileAction = () => null,
        directory: directoryAction = () => null,
        createFiles = () => null,
        createDirectory = () => null
    } = visitor;
    const recurse = async ([head, ...rest]: string[], tree: Tree | null): Promise<T | null> => {
        if (!tree) return null;
        if (head === '') {
            // Allows an initial '/'.
            return !tree ? null : recurse(rest, tree);
        } if (head === undefined) {
            throw new Error(`Accessing root as file.`);
        } else if (rest.length === 0) {
            // We're at the end of the path, so this names the file.
            const [name, versionName] = head.split('@');

            let files = asFiles(tree[name]);
            if (!files) {
                files = await tree[FILE]?.(filesystem, path, name, versionName, rest, tree)
                    ?? await createFiles(filesystem, path, name, versionName, tree, files ?? [])
                    ?? [];
                if (files) {
                    tree[name] = files;
                }
            }
            if (!files) return null;
            tree[name] = files;
            return fileAction(path, name, versionName, files)
        } else {
            let ntree = asTree(tree[head]);
            if (!ntree) {
                ntree = await tree[DIRECTORY]?.(filesystem, path, head, rest, tree)
                    ?? await createDirectory(filesystem, path, head, rest, tree)
                    ?? null
                if (ntree) {
                    tree[head] = ntree;
                }
            }
            directoryAction(path, head, tree)
            return recurse(rest, ntree);
        }
    };
    return recurse(path.split('/'), tree);
};

const errorWrapper = (fs: AFileSystem, op: string, ...args: any[]) => <F extends Function>(fn: F) => {
    try {
        return fn();
    } catch (e) {
        e.message = `${fs.name}.${op}(${args.map(a => JSON.stringify(a)).join(', ')}) ${e.message}`;
        throw e;
    }
};

/**
 * The `AFileSystem` constructor takes a single argument, which represents an initial filesystem content.
 *
 * Every Object (not subclasses, but literal objects) represent a directory,
 * while every array holds the versions of a logical file.
 *
 * Versions are specified on lookup by appending _@version_ to the path. No version
 * specified is the same as `@latest`, which obtains the highest numbered version
 * (the last in the array). You can ignore named versions (labels), or even multiple
 * versions, but files are always identified by being in an array.
 *
 * A file can be any value, but normally they will be either an
 * [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or an
 * [AFile](#AFile); they implement the same interface
 */
export class AFileSystem implements Regenerable {
    readOnly: boolean;
    name: string;
    tree: Tree;
    subscription: AsyncGenerator<this>;
    updateCount: number;
    errored: (e: Error) => void;
    updated: (n: this) => void;

    /**
     *
     * @param tree The specification of what directories and files to initialize the filesystem with
     * @param options Optional options: _readOnly_ and _name_
     */
    constructor(tree: Tree, options: {readOnly?: boolean, name?: string} = {}) {
        const {readOnly, name} = options;
        this.readOnly = !!readOnly;
        this.name = name || `FS_${++nameNum}`;
        this.tree = tree || Throw(`Missing tree.`);
        this.subscription = regenerator(this);
        this.subscription.next();
        this.updateCount = 0;
        this.errored = () => undefined;
        this.updated = () => undefined;
    }

    /**
     * Find the file at the given (possibly versioned) path.
     *
     * @param path the full pathname to the desired file
     * @returns A promise to a [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or
     *      [AFile](#AFile), or `null` if no file is found at that path.
     */
    find(path: string) {
        return errorWrapper(this, 'find', path)(() => {
            const getFile = (path: string, name: string, version: Version, files: Files): VFile | null => {
                if (files.constructor === Object) {
                    throw new Error(`${path} is a directory.`);
                }
                const file = getVersion(files, version);
                if (!file) return null;
                if (Array.isArray(file) || file.constructor === Object) {
                    throw new Error(`${path} is a directory`);
                }
                return file;
            };
            return traverse(this, path, this.tree, {file: getFile});
        })
    }

    /**
     * Wait for the requested path. The return value is an async generator
     *  that yields when the requested path is available.
     * @param path Path to the file
     * @returns An async generator yielding a value for the file when it becomes available..
     */
    async *waitFor(path: string) {
        let v = this.find(path);
        if (v) {
            yield v;
            return;
        }
        for await (const fs of this.subscription) {
            const nv = fs.find(path);
            if (nv) {
                v = nv;
                yield v;
                return;
            }
        }
    }

    /**
     * Wait for the requested path. The return value is an async generator
     * that yields once for each value stored at path.
     * @param path Path to the file
     * @param nullOK if true, `null` will be returned by the generator whenever the file does not exist; by default it is filtered out.
     * @returns An async generator yielding values for a file as it changes (new versions created/deleted).
     */
    async *watch(path: string, nullOK = false) {
        let v = this.find(path);
        if (v || nullOK) {
            yield v;
        }
        for await (const fs of this.subscription) {
            const nv = fs.find(path);
            if (nv !== v) {
                v = nv;
                if (nullOK || v) {
                    yield v;
                }
            }
        }
    }

    /**
     * Return the metadata for the requested path. Metadata can be associated with either a specific
     * version, or the entire collection of versions at a path. The results are merged.
     * @param path Path to the file
     * @returns Promise yielding Metadata or `null` if the file is not found.
     */
    async metadata(path: string): Promise<Metadata | null> {
        return errorWrapper(this, 'metadata', path)(() => {
            const getMeta = async (path: string, name: string, version: Version,
                                   files: Files): Promise<Metadata | null> => {
                const file = getVersion(files, version);
                if (!file) return null;
                const filesMeta = files[METADATA] || {};
                if (isFileAttachment(file) && !file[CACHED_METADATA]) {
                    const headers = await (await fetch(await file.url(), {
                                                                        method: 'HEAD'
                                                                })
                                                        ).headers;
                    const attachMeta: Metadata = { name: file.name, url: await file.url() };
                    headers.forEach((v, k) => {
                    switch (k) {
                        case 'content-length':
                            attachMeta.length = Number.parseInt(v);
                            break;
                        case 'last-modified':
                            attachMeta.modificationDate = new Date(v);
                            break;
                        case 'etag':
                            attachMeta.etag = v;
                            break;
                        case 'content-type':
                            attachMeta.contentType = v;
                            break;
                        default:
                    }
                    });
                    const fileMeta = file[METADATA] || {};
                    Object.defineProperty(file, CACHED_METADATA, {value: { ...filesMeta, ...fileMeta, ...attachMeta }});
                }
                const contentType = file['content-type'];
                const fileMeta = contentType ? { 'content-type': contentType } : {name};
                return {name, ...filesMeta, ...fileMeta, ...(file[CACHED_METADATA] ?? {}) };
            };
        return traverse<Metadata>(this, path, this.tree, {file: getMeta});
        });
    }

    /**
     * Add a new file at the specified path. If no version, or 'latest', adds a new version.
     * Otherwise sets the specified version or label.
     * @param path Path to store the file
     * @param file The file, either an [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or an [[AFile]].
     * @returns the file
     */
    add(path: string, file: VFile) {
        return errorWrapper(this, 'add', path, file)(() => {
            if (this.readOnly) throw new Error(`Read only filesystem.`);
                const createDirectory = (fs: AFileSystem, path: string, name: string, rest: string[], tree: Tree) => {
                if (rest.length === 0) {
                    return (tree[name] = [file]);
                }
                return (tree[name] = {});
            };
            const setFile = (path: string, name: string, version: Version, files: Files) => {
                setVersion(files, version, file);
                return file;
            }
            try {
                return traverse(this, path, this.tree, {file: setFile, createDirectory});
            } catch (e) {
                this.errored(e);
                throw e;
            } finally {
                this.updated(this);
            }
        });
    }

    /**
     * Copy file from to. If 'latest' or unspecified, copies only the latest.
     * @param from Path to the existing file
     * @param to Path to the destination
     * @returns the file copied
     */
    copy(from: string, to: string) {
        return this.add(to, this.find(from));
    }

    /**
     * Label the version at the specified path with 'label'.  A label selects a specific version of a file;
     * it is not a property of a file version.
     * @param path Path to the file
     * @param label Label to add to the file
     * @returns The file labeled.
     */
    label(path: string, label: string) {
        const exp = path.split('/');
        // Get the file name, stripping away the label or version if present.
        const end = exp[exp.length - 1].split('@')[0];
        // Replace the exploded path with the name and the new label
        exp[exp.length - 1] = `${end}@${label}`;
        // Turn it back into a path string
        const to = exp.join('/');
        // And copy.
        return this.copy(path, to);
    }
}
