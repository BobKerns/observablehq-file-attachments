/*
 * @module NpmRollupTemplate
 * Copyright 2020 by Bob Kerns. Licensed under MIT license.
 *
 * Github: https://github.com/BobKerns/npm-typescript-rollup-template
 */

/**
 * Load the full system with a single import.
 * @packageDocumentation
 * @preferred
 * @module Index
 */

export {AFileSystem} from './AFileSystem';
export {AFile, DataMethod} from './AFile';
export {FILE, DIRECTORY} from './symbols';
export {getVersion, setVersion, deleteVersion, meta} from './util';

export {Metadata, JsonObject, FileAttachment, Version, VFile, Tree, PromiseOr,
        FileHandler, DirectoryHandler} from './types';
