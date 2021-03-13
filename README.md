# Project ObservableHQ FileAttachment Virtual Filesystem

This provides more flexibility for working with [ObservableHQ's](https://observablehq.com) [FileAttachment](https://observablehq.com/@observablehq/file-attachments) objects, by placing them in a virtual directory structure. Generated and static data exist side-by-side.

Virtualization also allows for supplying alternate sources for the data, and dynamic updates to the data. The AsyncGenerator paradigm is used to allow dynamic updates while allowing proper updating of dependencies.

# Features
* The ability to organize data sources hierarchically.
* Generated data can be accessed via the [FileAttachment](https://observablehq.com/@observablehq/file-attachments) API for compatibility, serialized or deserialized as needed
* The ability to freely switch between computed data and data cached as a [FileAttachment](https://observablehq.com/@observablehq/file-attachments).
* The ability to store any type of data without needing to parse it at point-of-use.
* Contents can be updated on on the fly.
* The reactive control flow is preserved through the use of async generators.
* Implements a versioned, tagged filesystem, facilitating comparing different versions of the same data.

# Content

## Primary organization

The important files are the outputs included in the published module, and the sources that
produce them. The rest are supporting mechanisms.

* `src/` contains the source code for the library.<br/>
* `src/__tests__` contains the tests<br/>
* `notebook/` contains the corresponding [ObservableHQ notebook](notebook/index.html). Currently, this is the original code; it will be changed to import this library and demonstrate is usage once this version is working and tested.

The [current version of the notebook](https://observablehq.com/@bobkerns/file-attachments) can be found at the site.

The local version can be viewed by running the script `npm run serve` and [accessing it via that server on port 5111](http://localhost:5111/notebook/index.html)

## package.json



## Continuous Integration
Three free Continuous Integration workflows are configured out of the box.  Remove any you
you do not need, or disable them in the relevant service.

You probably do not need multiple builds on multiple services, but this will let you see each and make a choice. For simple things at least, the features are very similar. It is very useful to be able to build and test on multiple environments in parallel, something each of the services provides.

* [Circle CI](https://circleci.com)
* [Travis CI](https://travis-ci.com)
* [GitHub Workflows (CI)](https://github.com)

