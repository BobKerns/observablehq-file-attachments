import { AFile } from "../AFile";
import { AFileSystem } from "../AFileSystem";
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
            test('empty in root', async () =>
                expect(sut.find('/nofile'))
                    .toBeInstanceOf(Promise));
            test('empty in root', async () =>
                expect(await sut.find('/nofile'))
                    .toBeNull());

            test('empty in subdir', async () =>
                expect(await sut.find('/nodir/nofile'))
                    .toBeNull());

            // Repeat the tests without a leading slash.
            test('noslash empty in root', async () =>
                expect(await sut.find('nofile'))
                    .toBeNull());

            test('noslash empty in subdir', async () =>
                expect(await sut.find('nodir/nofile'))
                    .toBeNull());
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
                expect(await sut.find('/aFile'))
                    .toBe(file1));
            test('inSubdir', async () =>
                expect(await sut.find('/subdir/anotherFile'))
                    .toBe(file2));
            test('Deeper', async () =>
                expect(await sut.find('/subdir/deeper/versions'))
                    .toBe(file2));
            test('Deeper@latest', async () =>
                expect(await sut.find('/subdir/deeper/versions@latest'))
                    .toBe(file2));
            test('Deeper@2', async () =>
                expect(await sut.find('/subdir/deeper/versions@2'))
                    .toBe(file2));
            test('Deeper@1', async () =>
                expect(await sut.find('/subdir/deeper/versions@1'))
                    .toBe(file1));
        });
    });
});
//