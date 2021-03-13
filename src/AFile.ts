import {AFileSystem} from './AFileSystem';
import { CACHED_METADATA, METADATA } from './symbols';
import { Metadata } from './types';
import { encodeString } from './util';
import {fromByteArray} from 'base64-js';


export class AFile {
    [METADATA]: Metadata;
    [CACHED_METADATA]: Metadata;
    name: string;
    data: any;
    ['content-type']: string;
    #dataResult: any;
    #noCache: boolean = false;
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

    async getData(type: string, opts: any) {
        let data = await ((!this.#noCache && this.#dataResult) || this.data);
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

    async json(opts = { utf8: true }) {
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

    async text(opts = { utf8: true }) {
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

    async url(opts = { utf8: true }) {
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
    
    async arrayBuffer(opts = { utf8: true }) {
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

    async blob(opts: any = {utf8: true}) {
        const data = await this.getData('blob', opts);
        if (data instanceof Blob) {
            return data;
        }
        return new Blob([new Uint8Array(await this.arrayBuffer(opts))]);
    }

    async csv(opts = { utf8: true }) {
        const data = await this.getData('csv', opts);
        if (Array.isArray(data)) return data;
        if (data.constructor === Object) return data;
        return dsv(await this.text(), ",", opts);
    }

    async tsv(opts = { utf8: true }) {
        const data = await this.getData('tsv', opts);
        if (Array.isArray(data)) return data;
        if (data.constructor === Object) return data;
        return dsv(await this.text(), "\t", opts);
    }

    async stream(opts = { utf8: true }) {
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
    }

function dsv(arg0: string, arg1: string, opts: { utf8: boolean; }) {
    throw new Error('Function not implemented.');
}
    