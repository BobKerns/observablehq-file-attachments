For an overview, see the project [README.md](https://github.com/BobKerns/observablehq-file-attachments/blob/main/README.md)

* [AFileSystem](classes/afilesystem.afilesystem-1.html) is your starting point.
* [AFile](classes/afile.afile-1.html) lets you work with non-attachment data.
* [Full API documentation](modules.html)

~~~javascript
import { AFileSystem, AFile} from '@bobkerns/file-attachments'

F = new AFileSystem(
    {
        data: {
            // Arrays denote file versions.
            table1: [
                FileAttachment('Table1.json'),
                FileAttachment('Table1.json@2')
            ],
            table2: [AFile('table2', {data: [[1, 5, 3] [2, 6, 4]]})]
        },
        test: {
            table1: [FileAttachment('Table1-test.json')]
        }
    }
  });
// Make table2 appear in the /test directory as well.
F.copy('/data/table2', '/test/table2'); // Perhaps more like a hard link
// Label Version 2 of /data/table1 as 'release'
// It can then be referenced as /label/table1@release, even if additional
// versions are added later.
F.label('/data/table1@2', 'release');

// The notebook awaits
TABLE1 = F.find('/data/table1').json();

// Doesn't exist, so returns undefined
NO_FILE = F.find('/noFile').json();

// To get an error if the file doesn't exist:
ERROR_FILE = F.find('/noFile').exists.json();

// To get a file, once it is available
AWAIT_FILE = F.waitFor('/notYet').json();

// To add a file:
F.add('/notYet', new AFile('notYet', {Some: 'data'}));

// To get a file's data when added and receive updates.
UPDATED_FILE = F.watch('/updatedFile').json();

// Add some updates.
{
    for (i in range(0, 10)) {
        await sleep(1000);
        F.add('/updatedFile', new AFile('/updatedFile', {data: i}));
    }
}

// Metadata
METADATA_TABLE1 = F.metadata('/test/table2');
~~~
