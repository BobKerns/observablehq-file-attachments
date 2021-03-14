# Change Log for observablehq-file-attachments

## Release 0.1.3
* Better typing of `AFile` and document that `AFile.url()` is async.
* Make `AFileSystem.find()` synchronous again, with a proxy. The access methods
* (`.json()`, `.text()`, etc.) now resolve to `undefined` if the file is not found.
* The `.exists` accessor can be used to get a version that rejects with a `VirtualFileNotFound` error.
* The documentation has been organized and expanded.
* The necessary `d3-dsv` parser is now included in the build.
* Add `AFile.from()` and `AFile.entry()` convenience functions.
* `VERSION` export contains information about the build. (Currently has extra info, will trim it down later.)
* Only ESM modules are built. It is time for other formats to **_DIE_**.

## Release 0.1.2
Update transpilation for ESM modules and statically include our dependencies.

## Release 0.1.1
Bundle up the exports into index.ts for convenent import.

## Release 0.1.0

Initial release, translated from the original ObservableHQ notebook.