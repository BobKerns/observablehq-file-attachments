/**
 * Tests of AFile and AFileAwait
 */

import './node-polyfills';
import { AFile } from "../AFile";
import { AFileAwait } from "../AFileAwait";
import { Metadata } from "../types";

// ASCII only...
function str2ab(str: string) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

type SUTMaker<T> = (name: string, data: any, meta?: Partial<Metadata>) => T;

describe('Common AFile tests', () => {
    // Run common tests on both classes.
    // For IDE integration reasons, these are copy-pasted rather than invoked as a function.
    describe('AFile', () => {
        const cnst: SUTMaker<AFile> = (name, data, meta) => new AFile(name, data, meta);
        // BEGIN DUPLICATED CODE
        describe('Simple create', () => {
            test('named', () =>
                expect(cnst('file1', 'data1').name)
                    .toBe('file1'))
            test('value', async () =>
                expect(await cnst('file1', 'data1').json())
                    .toBe('data1'))
            test('valueJSON', async () =>
                expect(await cnst('file1',
                                    str2ab('"data1"'),
                                    {contentType: 'application/json', utf8: true})
                                .json())
                    .toBe('data1'))
        });
        // END DUPLICATED CODE
    });

    describe('AFileAwait', () => {
        const cnst: SUTMaker<AFileAwait> = (name, data, meta) => new AFileAwait(Promise.resolve(new AFile(name, data, meta)), name);
        // BEGIN DUPLICATED CODE
        describe('Simple create', () => {
            test('named', () =>
                expect(cnst('file1', 'data1').name)
                    .toBe('file1'))
            test('value', async () =>
                expect(await cnst('file1', 'data1').json())
                    .toBe('data1'))
            test('valueJSON', async () =>
                expect(await cnst('file1',
                                    str2ab('"data1"'),
                                    {contentType: 'application/json', utf8: true})
                                .json())
                    .toBe('data1'))
        });
        // END DUPLICATED CODE
    });
});
