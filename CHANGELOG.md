# Change Log for observablehq-file-attachments

## Release 0.1.12
* **DOC**: Fix `README.md` links to take advantage of published current documentation.
* **DOC**: Document the Continuous Integration.

## Release 0.1.11
* **FIX**: Fix CSV/TSV untyped parsing.
* **FIX**: Inconsistencies between the types of file objects.
* **TEST**: Choose a better Jest integration for VSCode.
* **TEST**: Factor out the unit tests' Node polyfills into a common import.
* **BUILD**: Allow running server on a specified port with SERVE=_port_.
* **BUILD**: Check in the documentation root index.html file.
* **BUILD**: Provide a copy of the current documentation at a non-version-dependent location.

## Release 0.1.10
* Preserve the class name across minification to make things less confusing.
* Include the API docs in the documentation publishing step.
* Set up the root of the documentation site as a copy of the `README.md`.
* Link the documentation site from the `README.md`

## Release 0.1.9
* **BUILD**: Forgot the actual fix in 0.1.8, LOL!

## Release 0.1.8
* **BUILD**: Fix documentation publishing (don't copy non-existing doc/ dir).

## Release 0.1.7
* **BUILD**: Add more diagnostics to documentation publishing step.

## Release 0.1.6
* **BUILD**: Publish the docs to the GitHub Pages site.

## Release 0.1.5
* **BUILD**: Remove extraneous files from the npm build
* **BUILD**: Minify the output again now that terser is updated.
* **BUILD**: Don't build docs on every build.
* **BUILD**: Reduce `VERSION` info

## Release 0.1.4
* **BUILD**: Restore UMD builds; the world is not QUITE ready...

## Release 0.1.3
* Better typing of `AFile` and document that `AFile.url()` is async.
* Make `AFileSystem.find()` synchronous again, with a proxy. The access methods
* (`.json()`, `.text()`, etc.) now resolve to `undefined` if the file is not found.
* The `.exists` accessor can be used to get a version that rejects with a `VirtualFileNotFound` error.
* Add `AFile.from()` and `AFile.entry()` convenience functions.
* **BUILD**: `VERSION` export contains information about the build. (Currently has extra info, will trim it down later.)
* **BUILD**: Only ESM modules are built. It is time for other formats to **_DIE_**.
* **BUILD**: The necessary `d3-dsv` parser is now included in the build.
* **DOC**: The documentation has been organized and expanded.
## Release 0.1.2
* **BUILD**: Update transpilation for ESM modules and statically include our dependencies.

## Release 0.1.1
* **BUILD**: Bundle up the exports into index.ts for convenent import.

## Release 0.1.0

Initial release, translated from the original ObservableHQ notebook.