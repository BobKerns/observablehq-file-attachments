/**
 * A wrapper for data from other than [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 * instances, presenting (nearly) the same interface.
 *
 * @module AFile
 */

import { CACHED_METADATA, METADATA } from './symbols';
import { Files, IAFile, Metadata, DataOptions } from './types';
import { encodeString, dsv } from './util';
import {fromByteArray} from 'base64-js';

/**
 * The target data format for decision-making about conversions.
 */
export type DataFormat = 'json' | 'text' | 'url' | 'arrayBuffer' | 'blob' | 'csv' | 'tsv' | 'stream';

/**
 * `new AFile(`_name_, _data_, _metadata_`)`
 *
 * This implements nearly the same interface as [FileAttachment](https://observablehq.com/@observablehq/file-attachments), but works with supplied data in a variety of forms:
 * * String—depending on the type requested, this may involve parsing or converting to an ArrayBuffer, Blob, or ReadableStream. _options_ arguments to the various extractors can include `{utf8:` _false_`}` to use UTF16 rather than UTF8 encoding.
 * * ArrayBuffer
 * * ReadableStream
 * * Blob
 * * JSON-compatible objects
 * * Arrays such as would be returned from {@link csv | .csv()} or {@link tsv | .tsv() }. Non-arrays will be converted to strings and parsed.
 * * A function. returning the value or a promise to the value. This is the most useful form, as it defers computation until needed. Except in the case of a `ReadableStream`, the result is cached. The function is called with the following arguments:
 *     * _file_: the [[AFile]].
 *     * _method_: One of `json`, `text`. `arrayBuffer`, `stream`, `url`, `csv`, `tsv`. These indicate how the data will be used, allowing the function to choose how to represent it. the usual conversions will be applied as needed, however, so it may be safely ignored.
 *     * _options_: The options supplied to the method accessing the data.
 * * Arbitrary data not described above, which can be retrieved unchanged via the `.json()` method
 * * A `Promise` that resolves to any of the above.
 *
 * _metadata_ is either an object with metadata to be combined, or a string, which is interpreted as the `contentType`, as a shorthand when that is the only metadata being supplied.
 *
 * All operations are asynchronous. This includes url(), which is synchronous in [FileAttachment](https://observablehq.com/@observablehq/file-attachments)
 */
export class AFile implements IAFile {
    [METADATA]: Metadata;
    [CACHED_METADATA]: Metadata;
    name: string;
    data: any;
    ['content-type']: string;
    #dataResult: any;
    #noCache: boolean = false;

    /**
     * Construct a new [[AFile]]
     * @param name Name of the file
     * @param data Data for the file. It will be converted as needed.
     * @param metadata Optional metadata for the file.
     */
    constructor(name: string, data: any, metadata: Partial<Metadata> = {}) {
        // Allow specifying the contentType by just giving the mime type.
        if (typeof metadata === 'string') {
            metadata = { name, contentType: metadata };
        }
        this[METADATA] = {  ...metadata, name };
        this.name = name;
        this.data = data;
        // Infer a contentType;
        let { contentType } = metadata;
        this['content-type'] = contentType =
            contentType ||
            (typeof data === 'string'
            ? 'text/plain'
            : data.constructor === Array
            ? 'application/json'
            : data.constructor === Object
            ? 'application/json'
            : 'application/binary');
        this[METADATA].contenttype = contentType;
    }

    /**
     * Internal method.
     * @param type Method that is requesting the data, to handle any prepatory conversions needed
     * @param opts Any options passed to the original method
     * @returns A `Promise` resolving to the data in the requested form.
     */
    async getData(type: DataFormat, opts: DataOptions): Promise<any> {
        let data = await ((!this.#noCache && this.#dataResult) || this.data);
        if (data instanceof AFile) {
            return data.getData(type, opts);
        }
        if (typeof data === 'function') {
            this.#dataResult = Promise.resolve(data(this, type, opts)).then(
                d => ((this.#noCache = d instanceof ReadableStream), d)
            );
            data = await this.#dataResult;
            if (this.#noCache) {
                // Don't hang onto results we're not going to use again.
                this.#dataResult = undefined;
            }
        }
        if (data instanceof ReadableStream && type !== 'stream') {
            let result = [];
            const reader = await data.getReader();
            let value: any;
            let done: boolean = false;
            let count = 0;
            while (!done) {
                const r = await reader.read();
                if (r.value) {
                    result.push(r.value);
                    count += r.value.byteLength;
                }
                done = done || r.done;
            }
            const buffer = new ArrayBuffer(count);
            const ar = new Uint8Array(buffer);
            let offset = 0;
            for (const chunk of result) {
                ar.set(chunk, offset);
                offset += chunk.byteLength;
            }
            return buffer;
        }
        if (!this.#noCache) {
            this.data = data;
        }
        return data;
    }

    /**
     * Return the data as JSON (as a Promise)
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` that resolves to a JSON value.
     */
    async json(opts: DataOptions = { utf8: true }) {
        const data = await this.getData('json', opts);
        if (
            data instanceof Blob ||
            data instanceof ReadableStream ||
            data instanceof ArrayBuffer
        ) {
            return JSON.parse(await this.text(opts));
        }
        return data;
    }

    /**
     * Return the data as a string.
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` that resolves to a text string.
     */
    async text(opts: DataOptions = { utf8: true }) {
        const { utf8 = true } = opts;
        const data = await this.getData('text', opts);
        if (typeof data === 'string') return data;
        if (data instanceof ArrayBuffer) {
            if (utf8) {
                return new TextDecoder().decode(new Uint8Array(data));
            } else {
                return String.fromCodePoint(...new Uint16Array(data));
            }
        }
        if (data instanceof Blob) {
            if (utf8) {
                return new TextDecoder().decode(
                    new Uint8Array(await data.arrayBuffer())
            );
            } else {
                return String.fromCodePoint(
                    ...new Uint16Array(await data.arrayBuffer())
            );
            }
        }
        return JSON.stringify(data);
    }

    /**
     * Obtain a data URL with the data. Unlike [FileAttachment](https://observablehq.com/@observablehq/file-attachments),
     * this is async, that is, it returns a `Promise` to the URL.
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` that resolves to a data URL with the data.
     */
    async url(opts: DataOptions = { utf8: true }) {
        const data = await this.getData('url', opts);
        const mime = this?.['content-type'];
        if (typeof data === 'string') {
            return `data:${mime};UTF-8,${data}`;
        }
        const buf = await this.arrayBuffer();
        const arr = new Uint8Array(buf);
        const str = fromByteArray(arr)
        return `data:${mime};base64,${str}`;
    }

    /**
     * Return the data in an `ArrayBuffer` backed with a byte array.
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` which resolves to an array buffer with the data
     */
    async arrayBuffer(opts: DataOptions = { utf8: true }) {
        const { utf8 = true } = opts;
        const data = await this.getData('arrayBuffer', opts);
        if (data instanceof ArrayBuffer) {
            return data;
        }
        if (data instanceof Blob) {
            return data.arrayBuffer();
        }
        if (utf8) {
            return new TextEncoder().encode(await this.text({ utf8 })).buffer;
        } else {
            return encodeString(await this.text());
        }
    }

    /**
     * Return the data in the form of a `Blob`
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` that resolves to a `Blob`
     */
    async blob(opts: DataOptions = {utf8: true}) {
        const data = await this.getData('blob', opts);
        if (data instanceof Blob) {
            return data;
        }
        return new Blob([new Uint8Array(await this.arrayBuffer(opts))]);
    }

    /**
     * Interpret the data as CSV text. Uses D3's CSV/TSV parser.
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` which returns the data parsed as CSV
     */
    async csv(opts: DataOptions = { utf8: true }) {
        const data = await this.getData('csv', opts);
        if (Array.isArray(data)) return data;
        if (data.constructor === Object) return data;
        return dsv(await this.text(), ",", opts);
    }

    /**
     * Interpret the data as TSV text. Uses D3's CSV/TSV parser.
     * @param opts Options. The valid option is `utf8`, which defaults to true
     * @returns A `Promise` which returns the data parsed as TSV
     */
    async tsv(opts: DataOptions = { utf8: true }) {
        const data = await this.getData('tsv', opts);
        if (Array.isArray(data)) return data;
        if (data.constructor === Object) return data;
        return dsv(await this.text(), "\t", opts);
    }

    async stream(opts: DataOptions = { utf8: true }) {
        let data = await this.getData('stream', opts);
        if (data instanceof ReadableStream) {
            return data;
        }
        return new ReadableStream({
            pull: async controller => {
            const data = await this.arrayBuffer();
            const array = new Uint8Array(data);
            controller.enqueue(array);
            controller.close();
            }
        });
    }

    /**
     * Convenience method to construct a [[Files]] array from a list of data versions
     * @param name the name of the file
     * @param data The data for each version. (Typically, just one entry)
     * @returns a [[Files]] array
     */
    static from(name: string, ...data: any[]): Files {
        return data.map(d => new AFile(name, d));
    }

    /**
     * Convenience method to add an entry to a directory, supplying the name just once.
     * The result should be spliced into the directory.
     *
     * @param name
     * @param data
     * @returns A [[Tree] with a [[Files]] array under the given _name_.
     */
    static entry<T extends string>(name: T, ...data: any[]) {
        return {
            [name as T]: this.from(name, ...data)
        } as {[k in T]: Files};
    }

    /**
     * Preserve the class name across minification.
     */
    [Symbol.toStringTag]: 'AFile';
}

