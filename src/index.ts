/**
 * Github: https://github.com/BobKerns/observablehq-file-attachments
 *
 * This loads the complete package in a single import.
 * @module Index
 */

export {AFileSystem} from './AFileSystem';
export {AFile, DataFormat as DataMethod} from './AFile';
export {AFileAwait, VirtualFileNotFound} from './AFileAwait';
export {FILE, DIRECTORY} from './symbols';
export {getVersion, setVersion, deleteVersion, meta} from './util';

export {Metadata, JsonObject, FileAttachment, Version, VFile, Tree, PromiseOr,
        FileHandler, DirectoryHandler} from './types';

export {VERSION} from 'VERSION';
