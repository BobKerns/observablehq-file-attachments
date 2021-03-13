# Project ObservableHQ FileAttachment Virtual Filesystem

This provides more flexibility for working with [ObservableHQ's](https://observablehq.com) FileAttachment objects, by placing them in a virtual directory structure.

Virtualization also allows for supplying alternate sources for the data, and dynamic updates to the data. The AsyncGenerator paradigm is used to allow dynamic updates while allowing proper updating of dependencies.

# Features


# Content

## Primary organization

The important files are the outputs included in the published module, and the sources that
produce them. The rest are supporting mechanisms.

## package.json



## Continuous Integration Integration
Three free Continuous Integration workflows are configured out of the box.  Remove any you
you do not need, or disable them in the relevant service.

You probably do not need multiple builds on multiple services, but this will let you see each and make a choice. For simple things at least, the features are very similar. It is very useful to be able to build and test on multiple environments in parallel, something each of the services provides.

* [Circle CI](https://circleci.com)
* [Travis CI](https://travis-ci.com)
* [GitHub Workflows (CI)](https://github.com)

