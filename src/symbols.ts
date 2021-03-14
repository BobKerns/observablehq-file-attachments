/**
 * Symbols for attaching special data to files and directories.
 *
 * @module symbols
 */
export const METADATA = Symbol.for('METADATA');
export const CACHED_METADATA = Symbol.for('CACHED_METADATA');

/**
 * The special symbol [[FILE]] is used to dynamically compute file entries in a directory.
 * These should be a function that accepts `(`_fs_, _path_, _name_, _version_`)`.
 *
 * It will be invoked when a requested file is not found.
 *
 * * _fs_: The [[AFileSystem]] object
 * * _path_: The full requested path
 * * _name_: The name of the requested file, in this directory
 * * _version_: The requested version. This will be `-1` in the case where no version is supplied.
 *
 * The result should be an array with at least one version, including the requested one.
 * The helper fileVersion can be use to make this simpler, taking the version name and the file.
 * The _rest_ argument will be an empty array.
 *
 * Return `null` to decline to create a file of the given name or version.
 *
 * @see DIRECTORY
 */
export const FILE = Symbol.for('FILE');

/**
 * The special symbol `DIRECTORY` is used to dynamically compute directory entries.
 * This should be a function that accepts `(`_fs_, _path_, _name_`)`.
 *
 * * It will be invoked when a requested directory is not found.
 *
 * * _fs_: The [[AFileSystem]] object
 * * _path_: The full requested path
 * * _name_: The name of the requested directory, in its parent.
 *
 * The function should return an object describing the directory heirarchy that should reside under this name.
 * The returned structure can include its own [[DIRECTORY]] and [[FILE]] entries to further auto-create
 * levels of directory and their files.
 *
 * `null` should be returned to decline creating a directory of the given name.
 *
 * @see FILE
 */
export const DIRECTORY = Symbol.for('DIRECTORY');
export const TAGS = Symbol.for('TAGS');
