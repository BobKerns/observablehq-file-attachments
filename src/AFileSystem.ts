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

// The actual class that implements all this.
export class AFileSystem implements Regenerable {
    readOnly: boolean;
    name: string;
    tree: Tree;
    subscription: AsyncGenerator<this>;
    updateCount: number;
    errored: (e: Error) => void;
    updated: (n: this) => void;
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
    // Find the requested path.
    find(path: string) {
        return errorWrapper(this, 'find', path)(() => {
            const getFile = (path: string, name: string, version: Version, files: Files): VFile | null => {
                if (files.constructor === Object) {
                    throw new Error(`${path} is a directory.`);
                }
                const file = files[version === -1 ? files.length - 1 : version as number];
                if (!file) return null;
                if (Array.isArray(file) || file.constructor === Object) {
                    throw new Error(`${path} is a directory`);
                }
                return file;
            };
            return traverse(this, path, this.tree, {file: getFile});
        })
    }

    // Wait for the requested path. The return value is an async generator
    // that yields once when the requested path is available.
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

    // Wait for the requested path. The return value is an async generator
    // that yields once for each value stored at path.
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

    // Return the metadata for the requested path.
    async metadata(path: string) {
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

    // Add a new file at the specified path. If no version, or 'latest', adds a new version.
    // Otherwise sets the specified version or label.
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
                return null;
            } finally {
                this.updated(this);
            }
        });
    }

    // Copy file from to. If 'latest' or unspecified, copies only the latest.
    copy(from: string, to: string) {
        return this.add(to, this.find(from));
    }

    // Label the version at the specified path with 'label'.
    label(path: string, label: string) {
        const exp = path.split('/');
        const end = exp[exp.length - 1].split('@')[0];
        exp[exp.length - 1] = `${end}@${label}`;
        const to = exp.join('/');
        return this.copy(path, to);
    }
}
