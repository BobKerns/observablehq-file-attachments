import { find } from "ramda";
import { AFile } from "../AFile";
import { AFileAwait, VirtualFileNotFound } from "../AFileAwait";
import { AFileSystem } from "../AFileSystem";

import {ReadableStream} from 'web-streams-polyfill/ponyfill/es2018';
(globalThis as any)['ReadableStream'] = ReadableStream;

describe('AEFunction', () => {
    describe('creation', () => {
        test('CreateEmpty',() =>
            expect(new AFileSystem({}).tree)
                .toEqual({}));
        test('Name', () =>
            expect(new AFileSystem({}, {name: 'Fred'}).name)
                .toBe('Fred'));
        test('Default Writable', () =>
            expect(new AFileSystem({}).readOnly)
                .toBe(false));
        test('ReadOnly', () =>
            expect(new AFileSystem({}, {readOnly: true}).readOnly)
                .toBe(true));
    });
    describe('find', () => {
        describe('empty', () => {
            const sut = new AFileSystem({}, {readOnly: true, name: 'SUT'});
            test('empty in root', () =>
                expect(sut.find('/nofile'))
                    .toBeInstanceOf(AFileAwait));
            test('empty in root', () =>
                expect(sut.find('/nofile').target)
                    .resolves.toBeNull());

            test('empty in subdir', () =>
                expect(sut.find('/nodir/nofile').target)
                    .resolves.toBeNull());

            // Repeat the tests without a leading slash.
            test('noslash empty in root', () =>
                expect(sut.find('nofile').target)
                    .resolves.toBeNull());

            test('noslash empty in subdir', () =>
                expect(sut.find('nodir/nofile').target)
                    .resolves.toBeNull());

            test('latest', () =>
                expect(sut.find('nodir/nofile:latest').target)
                    .resolves.toBeNull());

            test('earliest', () =>
                expect(sut.find('nodir/nofile:earliest').target)
                    .resolves.toBeNull());
        });
        describe('simple', () => {
            const file1 = new AFile('file1', 'data1');
            const file2 = new AFile('file2', 'data2');
            const sut = new AFileSystem({
                aFile: [file1],
                subdir: {
                    anotherFile: [file2],
                    deeper: {
                        versions: [file1, file2]
                    }
                }
            }, {readOnly: true, name: 'SUT-Simple'});
            test('inRoot', async () =>
                expect(await sut.find('/aFile').target)
                    .toBe(file1));
            test('inSubdir', async () =>
                expect(await sut.find('/subdir/anotherFile').target)
                    .toBe(file2));
            test('Deeper', async () =>
                expect(await sut.find('/subdir/deeper/versions').target)
                    .toBe(file2));
            test('Deeper@latest', async () =>
                expect(await sut.find('/subdir/deeper/versions@latest').target)
                    .toBe(file2));
            test('Deeper@earliest', async () =>
                expect(await sut.find('/subdir/deeper/versions@earliest').target)
                    .toBe(file1));
            test('Deeper@2', async () =>
                expect(await sut.find('/subdir/deeper/versions@2').target)
                    .toBe(file2));
            test('Deeper@1', async () =>
                expect(await sut.find('/subdir/deeper/versions@1').target)
                    .toBe(file1));

            test('Deeper@-1', async () =>
                expect(await sut.find('/subdir/deeper/versions@-1').target)
                    .toBe(file2));
            test('Deeper@-2', async () =>
                expect(await sut.find('/subdir/deeper/versions@-2').target)
                    .toBe(file1));
            test('Deeper@-3', async () =>
                expect(await sut.find('/subdir/deeper/versions@-3').target)
                    .toBe(null));

            test('check error', async () =>
                 expect(sut.find('/noFile').exists.json())
                    .rejects.toBeInstanceOf(VirtualFileNotFound));

            test('check resolves', async () =>
                expect(sut.find('/aFile').exists.text())
                    .resolves.toBe('data1'));
        });
    });
});
//