import './node-polyfills';
import { dsv, file, fromArrayBuffer, toArrayBuffer } from "../util";
import { AFile } from '../AFile';
import { METADATA, TAGS } from '../symbols';
import { range } from 'genutils';

describe('Data conversion', () => {

    /**
     * Convert a regular array of results to one annotated with a `columns` field
     * with the order of columns.
     *
     * @param array an array of result objects.
     * @param columns The columns, in the order they appear in the file.
     * @returns the array, with the `columns` field added.
     */
    const withColumns = <T extends Array<any>>(array: T, ...columns: string[]) =>
        ((array as any).columns = columns, array);

    describe('csv', () => {
        const delim = ',';
        const single = 'foo';
        const multi = `foo${delim}bar\n71${delim}28`;
        test('single untyped', () =>
            expect(dsv(single, delim, {array: true}))
                .toStrictEqual([["foo"]]));

        test('multiple untyped', () =>
            expect(dsv(multi, delim, {array: true}))
                .toStrictEqual([["foo", "bar"], ["71", "28"]]));

        test('single typed', () =>
            expect(dsv(single, delim, {array: true, typed: true}))
                .toStrictEqual([["foo"]]));

        test('multiple typed', () =>
            expect(dsv(multi, delim, {array: true, typed: true}))
                .toStrictEqual([["foo", "bar"], [71, 28]]));

        test('single untyped object', () =>
            expect(dsv(single, delim, {array: false}))
                .toStrictEqual(withColumns([], 'foo')));

        test('multiple untyped object', () =>
            expect(dsv(multi, delim, {array: false}))
                .toStrictEqual(withColumns([{foo: "71", bar: "28"}], 'foo', 'bar')));

        test('single typed object', () =>
            expect(dsv(single, delim, {array: false, typed: true}))
                .toStrictEqual(withColumns([], 'foo')));

        test('multiple typed object', () =>
            expect(dsv(multi, delim, {array: false, typed: true}))
                .toStrictEqual(withColumns([{foo: 71, bar: 28}], 'foo', 'bar')));
    });

    describe('tsv', () => {
        const delim = '\t';
        const single = 'foo';
        const multi = `foo${delim}bar\n71${delim}28`;
        test('single untyped', () =>
            expect(dsv(single, delim, {array: true}))
                .toStrictEqual([["foo"]]));

        test('multiple untyped', () =>
            expect(dsv(multi, delim, {array: true}))
                .toStrictEqual([["foo", "bar"], ["71", "28"]]));

        test('single typed', () =>
            expect(dsv(single, delim, {array: true, typed: true}))
                .toStrictEqual([["foo"]]));

        test('multiple typed', () =>
            expect(dsv(multi, delim, {array: true, typed: true}))
                .toStrictEqual([["foo", "bar"], [71, 28]]));

        test('single untyped object', () =>
            expect(dsv(single, delim, {array: false}))
                .toStrictEqual(withColumns([], 'foo')));

        test('multiple untyped object', () =>
            expect(dsv(multi, delim, {array: false}))
                .toStrictEqual(withColumns([{foo: "71", bar: "28"}], 'foo', 'bar')));

        test('single typed object', () =>
            expect(dsv(single, delim, {array: false, typed: true}))
                .toStrictEqual(withColumns([], 'foo')));

        test('multiple typed object', () =>
            expect(dsv(multi, delim, {array: false, typed: true}))
                .toStrictEqual(withColumns([{foo: 71, bar: 28}], 'foo', 'bar')));
    });

    describe('arrayBuffer', () => {
        test('toArrayBuffer utf8', () =>
            expect([...new Uint8Array(toArrayBuffer('this'))])
                .toStrictEqual('this'.split('').map(a => a.charCodeAt(0))));


        test('toArrayBuffer utf16', () =>
            expect([...new Uint16Array(toArrayBuffer('this', {utf8: false}))])
                .toStrictEqual('this'.split('').map(a => a.charCodeAt(0))));


        test('fromArrayBuffer utf8', () =>
            expect(fromArrayBuffer(toArrayBuffer('that')))
                .toStrictEqual('that'));


        test('fromArrayBuffer utf16', () =>
            expect(fromArrayBuffer(toArrayBuffer('that', {utf8: false}), {utf8: false}))
                .toStrictEqual('that'));

        const big = range(0, 1000).map(() => '0123456789').join();
        test('fromArrayBuffer utf16 big', () =>
            expect(fromArrayBuffer(toArrayBuffer(big, {utf8: false}), {utf8: false}))
                .toStrictEqual(big));
        });
});

describe('Convenience functions', () => {
    describe('file', () => {
        const simple = file('simple', 'data1');
        test('simple is array', () =>
            expect(simple.constructor)
                .toBe(Array));
        test('simple length', () =>
            expect(simple.length)
                .toBe(1));

        test('simple content', () =>
            expect(simple[0])
                .toBeInstanceOf(AFile));

        test('simple meta', () =>
            expect(simple[0][METADATA])
                .toStrictEqual({name: 'simple', contentType: 'text/plain'}));

        const withMetadata = file('withMetadata', 'data2', {date: 'now'}, 'myLabel');

        test('withMetadata', () =>
            expect(withMetadata[METADATA])
                .toStrictEqual({
                    name: 'withMetadata',
                    contentType: 'text/plain',
                    date: 'now'
                }));

        test('withMetadata file no numeric version', () =>
            expect(withMetadata[0])
                .toBe(undefined));


        test('withMetadata label', () =>
            expect(withMetadata[TAGS]?.['myLabel'][METADATA])
                .toStrictEqual({
                    name: 'withMetadata',
                    contentType: 'text/plain',
                    date: 'now'
                }));

        const noMetadata = file('noMetadata', 'data3', 2, 'myLabel');

        test('noMetadata', () =>
            expect(noMetadata[METADATA])
                .toStrictEqual({
                    name: 'noMetadata',
                    contentType: 'text/plain'
                }));

        test('noMetadata 1', () =>
                expect(noMetadata[1])
                    .toBeInstanceOf(AFile));

        test('noMetadata myLabel', () =>
            expect(noMetadata[TAGS]?.['myLabel'])
                .toBeInstanceOf(AFile));

        test('noMetadata 0', () =>
            expect(withMetadata[0])
                .toBe(undefined));
    });
});