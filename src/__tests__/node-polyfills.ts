/**
 * Shims to provide in Node.Js things which are standard these days in browsers.
 * @module
 */

import {ReadableStream as _ReadableStream} from 'web-streams-polyfill/ponyfill/es2018';
(globalThis as any)['ReadableStream'] = _ReadableStream;
export const ReadableStream = _ReadableStream;

import { TextDecoder as _TextDecoder, TextEncoder as _TextEncoder } from 'util';
(globalThis as any)['TextDecoder'] = _TextDecoder;
(globalThis as any)['TextEncoder'] = _TextEncoder;

export const TextDecoder = _TextDecoder;
export const TextEncoder = _TextEncoder;

