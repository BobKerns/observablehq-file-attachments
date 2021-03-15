# Project ObservableHQ FileAttachment Virtual Filesystem

For full documentation, please see:
* The [API Documentation Site](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/).
* The [Release Site](https://bobkerns.github.io/observablehq-file-attachments/docs/).
* [Github source](https://github.com/BobKerns/observablehq-file-attachments/)

This provides more flexibility for working with [ObservableHQ's](https://observablehq.com) [FileAttachment](https://observablehq.com/@observablehq/file-attachments) objects, by placing them in a virtual directory structure. Generated and static data exist side-by-side.

This addresses several issues with [FileAttachment](https://observablehq.com/@observablehq/file-attachments).

* You can't compute what attachment to use. The string argument must be a literal.
* The namespace is flat. This imposes a lack of organization; it would be compounded were we able to compute what attachment to reference.
* I need to be able to switch between a computed value and a value loaded from an attachment. Often, my attachments are cached computations that start with loading external data. I need to be able to easily recompute them without changing the code that references them.
* Being able to prototype a potential [FileAttachment](https://observablehq.com/@observablehq/file-attachments) in-notebook would be very handy.
  * This could include filtering or altering existing sources.
* It should be easier to switch between versions, and tagging/labeling versions would be a big help.
* It should be easier to track what attachments and versions are in use in old revisions. Replacing an old version with a new in the current notebook clutters up the set of unused attachments, cluttering up "unused" with "obsolete".
* No metadata is associated with [FileAttachment](https://observablehq.com/@observablehq/file-attachments) instances. \`Content-length\`, \`Content-type\`, and \`last-modified\` are particularly useful, and are obtained by this code. In addition, the [meta](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/modules/util.html#meta) operation can be used to attach metadata to files.
* I want to be able to request information, corresponding to resources on the net, that I optionally can substitute a [FileAttachment](https://observablehq.com/@observablehq/file-attachments).

By indirecting through a constructed directory, [AFileSystem](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afilesystem.afilesystem-1.html), these shortcomings can be mitigated. The cost, of course, is a bit of extra setup.

Virtualization also allows for supplying alternate sources for the data, and dynamic updates to the data. The AsyncGenerator paradigm is used to allow dynamic updates while allowing proper updating of dependencies.

# Features
* The ability to organize data sources hierarchically.
* Generated data can be accessed via the [FileAttachment](https://observablehq.com/@observablehq/file-attachments) API for compatibility, serialized or deserialized as needed
* The ability to freely switch between computed data and data cached as a [FileAttachment](https://observablehq.com/@observablehq/file-attachments).
* The ability to store any type of data without needing to parse it at point-of-use.
* Contents can be updated on on the fly.
* The reactive control flow is preserved through the use of async generators.
* Implements a versioned, tagged filesystem, facilitating comparing different versions of the same data.
* Provides for discovered data; directories can be populated on-demand.
* Works smoothly with ObservableHQ's attachment usage tracking and renumbering on reupload.

# Usage
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

### [class `AFileSystem`](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afilesystem.afilesystem-1.html)
The `AFileSystem` constructor takes a single argument, which represents an initial filesystem content. Every Object (not subclasses, but literal objects) represent a directory, while every array holds the versions of a logical file.

Versions are specified on lookup by appending `@version` to the path. No version specified is the same as `@latest`, which obtains the highest numbered version (the last in the array). You can ignore named versions (labels), or even multiple versions, but files are always identified by being in an array.

A file is either an [FileAttachment](https://observablehq.com/@observablehq/file-attachments) or an [AFile](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afile.afile-1.html); they implement the same interface

Implementation: [AFileSystem on GitHub](https://github.com/BobKerns/observablehq-file-attachments/blob/main/src/AFileSystem.ts)

### [class `AFile`](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afile.afile-1.html)

`new AFile(`_name_, _data_, _metadata_`)`

This implements the same interface as [FileAttachment](https://observablehq.com/@observablehq/file-attachments), but works with supplied data in a variety of forms:
* String—depending on the type requested, this may involve parsing or converting to an ArrayBuffer, Blob, or ReadableStream. _options_ arguments to the various extractors can include `{utf8: _false_}` to use UTF16 rather than UTF8 encoding.
* ArrayBuffer
* ReadableStream
* Blob
* JSON-compatible objects
* Arrays such as would be returned from `.csv()` or `.tsv()`. Non-arrays will be converted to strings and parsed.
* A function. returning the value or a promise to the value. This is the most useful form, as it defers computation until needed. For example, it can be used to dynamically fetch data using `fetch`. Except in the case of a `ReadableStream`, the result is cached. The function is called with the following arguments:
    * _file_: the [AFile](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afile.afile-1.html).
    * _method_: One of `json`, `text`. `arrayBuffer`, `stream`, `url`, `csv`, `tsv`. These indicate how the data will be used, allowing the function to choose how to represent it. the usual conversions will be applied as needed, however, so it may be safely ignored.
    * _options_: The [DataOptions](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/interfaces/types.dataoptions.html) supplied to the method accessing the data.
* Arbitrary data not described above, which can be retrieved unchanged via the `.json()` method
* A `Promise` that resolves to any of the above.

_metadata_ is either an object with metadata to be combined, or a string, which is interpreted as the `contentType`, as a shorthand when that is the only metadata being supplied.

All operations are asynchronous.

Implementation: [AFile on GitHub](https://github.com/BobKerns/observablehq-file-attachments/blob/main/src/AFile.ts)

### [function meta(_file_, _metadata_)](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/modules/util.html#meta)
Associate a _metadata_ object with the specified file (or array of file versions). This is normally used to annotate entries in the [AFileSystem](https://bobkerns.github.io/observablehq-file-attachments/docs/current/api/classes/afilesystem.afilesystem-1.html) tree.

Implmentation: [meta on GitHub](https://github.com/BobKerns/observablehq-file-attachments/blob/main/src/util.ts)

# Content

## Primary organization

The important files are the outputs included in the published module, and the sources that
produce them. The rest are supporting mechanisms.

* `src/` contains the source code for the library.<br/>
* `src/__tests__` contains the tests<br/>
* `notebook/` contains the corresponding [ObservableHQ notebook](https://github.com/BobKerns/observablehq-file-attachments/blob/main/notebook/index.html). Currently, this is the original code; it will be changed to import this library and demonstrate is usage once this version is working and tested.

The [current version of the notebook](https://observablehq.com/@bobkerns/file-attachments) can be found at the site.

The local version can be viewed by running the script `npm run serve` and [accessing it via that server on port 5111](http://localhost:5111/notebook/index.html)

## Continuous Integration
The project is configured to use GitHub Actions, doing a build/test of the code on any push to the main branch,
and a build of the code and documentation on defining a release and release tag on Github.

The release tag must be of the form `v${verson}`, e.g. `v1.2.3`. The name field is typically "Release 1.2.3",
and the description is copied from the CHANGELOG verbatim.

Once defined, the release build builds a production build, builds the documentation, publishes the documentation to
the [GitHub Pages site](https://bobkerns.github.io/observablehq-file-attachments/docs/), and the module to [NPM](https://www.npmjs.com/package/observablehq-file-attachments).
