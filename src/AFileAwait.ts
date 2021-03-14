/**
 * Proxy wrapper for returned values.
 *
 *  @module
 */

import { IAFile, JsonObject, Metadata, VFile } from "./types";

/**
 * This accepts a `Promise`, and delegates its methods to the resolved result of the `Promise`.
 *
 * If the eventual result is null, the invoking the data access methods will return `undefined`.
 *
 * Use {@link AFileAwait.exists} to throw an {@link VirtualFileNotFound} error if the file is not found.
 * ```javascript
 * const data = FS.find('/nofile').exists.json();
 * ```
 */
export class AFileAwait {
    #target: Promise<VFile|null>;
    #name: string | undefined = '(unresolved)';
    /**
     *
     * @param target The `Promise` of a result.
     * @param name The name of the file, if available.
     */
    constructor(target: Promise<VFile|null>, name?: string) {
        if (name === undefined) {
            this.#target = target
                .then(t => {
                    if (t) {
                        this.#name = t.name ?? this.#name;
                    }
                    return t;
                });
        } else {
            this.#name = name;
            this.#target = target;
        }
    }
    async url(): Promise<string|undefined> {
        return (await this.#target)?.url();
    }
    async json(): Promise<JsonObject|undefined> {
        return (await this.#target)?.json();
    }
    async blob(): Promise<Blob|undefined> {
        return (await this.#target)?.blob();
    }
    async text(): Promise<string|undefined> {
        return (await this.#target)?.text();
    }
    async arrayBuffer(): Promise<ArrayBuffer|undefined> {
        return (await this.#target)?.arrayBuffer();
    }

    /**
     * @returns the name, if it was supplied on construction, or if
     * the promise has resolved. Otherwise, returns `'(unresolved)'`;
     */
    get name(): string|undefined {
        return this.#name;
    }

    /**
     * Awaiting on this will yield the original result, including `null` if not found.
     */
    get target() {
        return this.#target;
    }

    /**
     * Chaining method that throws an error if the file was not found.
     * @returns The underlying file object.
     */
    get exists() {
        const ntarget = this.#target
            .then(t => {
                if (!t) {
                    throw new VirtualFileNotFound(`Virtual file not found: ${this.name}`);
                }
                return t;
            });
        return new AFileAwait(ntarget, this.#name);
    }


    /**
     * Preserve the class name across minification.
     */
    [Symbol.toStringTag]: 'AFileAwait';
}

/**
 * The error thrown when a file is not found in the virtual filesystem.
 * This is only thrown by [.check()](#AFileAwait.check).
 */
export class VirtualFileNotFound extends Error {
    constructor(message = `Virtual file not found`) {
        super(message);
    }

    /**
     * Preserve the class name across minification.
     */
    [Symbol.toStringTag]: 'VirtualFileNotFound';
}