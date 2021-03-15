import './node-polyfills';
import { dsv, toArrayBuffer } from "../util";

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
            expect([...new Uint8Array(toArrayBuffer('this'))]).toStrictEqual('this'.split('').map(a => a.charCodeAt(0))))
    });
});