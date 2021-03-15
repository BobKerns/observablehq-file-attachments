// https://observablehq.com/@bobkerns/file-attachments@1289
export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([["ROLL_SENATE_2020_292.json",new URL("./files/4c287e3a83fe5dd9030daa225a8ee4e23c47824012c3c7d3ee502c18cc9b70cb4abbe973341e1d23fc0efa287b5dd9f95c00909af1bfbf5b060af2129596f730",import.meta.url)]]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], function(md){return(
md`# File Attachments`
)});
  main.variable(observer()).define(["md","FileAttachment_link","meta_link","AFileSystem_link","AFile_link"], function(md,FileAttachment_link,meta_link,AFileSystem_link,AFile_link){return(
md`Make file attachments act like a versioned filesystem.

This addresses several issues with ${FileAttachment_link}.

* You can't compute what attachment to use. The string argument must be a literal.
* The namespace is flat. This imposes a lack of organization; it would be compounded were we able to compute what attachment to reference.
* I need to be able to switch between a computed value and a value loaded from an attachment. Often, my attachments are cached computations that start with loading external data. I need to be able to easily recompute them without changing the code that references them.
* Being able to prototype a potential ${FileAttachment_link} in-notebook would be very handy.
  * This could include filtering or altering existing sources.
* It should be easier to switch between versions, and tagging/labeling versions would be a big help.
* It should be easier to track what attachments and versions are in use in old revisions. Replacing an old version with a new in the current notebook clutters up the set of unused attachments, cluttering up "unused" with "obsolete".
* No metadata is associated with ${FileAttachment_link} instances. \`Content-length\`, \`Content-type\`, and \`last-modified\` are particularly useful, and are obtained by this code. In addition, the ${meta_link} operation can be used to attach metadata to files.
* I want to be able to request information, corresponding to resources on the net, that I optionally can substitute a ${FileAttachment_link}.

By indirecting through a constructed directory, ${AFileSystem_link}, these shortcomings can be mitigated. The cost, of course, is a bit of extra setup. For a single, unchanging file, ${FileAttachment_link} will be adequate for most uses. However, the ${AFile_link} stand-in for ${FileAttachment_link} instances may be of use on its own, to allow prototyping in-notebook for data to be loaded from an attachment later.
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Usage
~~~javascript
import { AFileSystem, AFile, meta, DIRECTORY, FILE } from '@bobkerns/file-attachments'

F = {
  const F = new AFileSystem(
  {
    data: {
        // Arrays denote file versions.
        table1: [FileAttachment('Table1.json'), FileAttachment('Table1.json@2')],
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
  // It can then be referenced as /label/table1@release, even if additional versions
  // are added later.
  F.label('/data/table1@2', 'release');
  return F;
}
~~~
`
)});
  main.variable(observer("AFileSystem_doc")).define("AFileSystem_doc", ["md","FileAttachment_link"], function(md,FileAttachment_link){return(
md`### AFileSystem
The \`AFileSystem\` constructor takes a single argument, which represents an initial filesystem content. Every Object (not subclasses, but literal objects) represent a directory, while every array holds the versions of a logical file.

Versions are specified on lookup by appending _@version_ to the path. No version specified is the same as _@latest_, which obtains the highest numbered version (the last in the array). You can ignore named versions (labels), or even multiple versions, but files are always identified by being in an array.

A file can be any value, but normally they will be either an ${FileAttachment_link} or an [AFile](#AFile_doc); they implement the same interface
`
)});
  main.variable(observer()).define(["md","FILE_link","DIRECTORY_link"], function(md,FILE_link,DIRECTORY_link){return(
md`The special symbols ${FILE_link} and ${DIRECTORY_link} are used to dynamically compute directory entries. These should be a function that accepts \`(\`_fs_, _path_, _name_, _version_, _rest_, _tree_\`)\`.

For files, _version_ will be \`-1\` in the case where no version is supplied. The result should be an array with at least one version, including the requested one. The helper fileVersion can be use to make this simpler, taking the version name and the file. The _rest_ argument will be an empty array.

For directories, _version_ will be \`null\`. The _rest_ argument will be a list of remaining directory levels and final file destination, which can be processed at this level if desired. Alternatively, the function can return a directory with its own ${DIRECTORY_link} and/or ${FILE_link} entry to handle subsequent levels.`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`To look up a value, use \`AFileSystem.prototype.find(\`_path_\`)\`, e.g.
~~~javascript
votes = F.find('/senate')
~~~`
)});
  main.variable(observer()).define(["md","AFileSystem_link","FileAttachment_link"], function(md,AFileSystem_link,FileAttachment_link){return(
md`The operations on an ${AFileSystem_link} are:
* \`find(\`_path_\`)\`: Find the value (normally a ${FileAttachment_link} or ${AFileSystem_link} at that path, or return \`null\` if there is none.
* \`waitFor(\`_path_\`)\`: returns an async generator, which yields a value when a non-null value is available at path. Only one value is yielded, then the generator returns.
* \`watch(\`_path_, _nullOK_\`=false)\`: Returns an async generator, which yields each successive value the path would return with \`find(\`_path_\`)\`. The generator never returns.
* \`metadata(\`_path_\`)\`: Return the metadata associated with the path.
* \`add(\`_path_, _file_\`)\`: Add a file to a given _path_. If now version or label is set in the _path_, it is added as the latest version. If _file_ is \`null\` it is essentially a deletion.
* \`copy(\`_from_, _to_\`)\`: Copy an entry from one path to another.
* \`label(\`_path_, _label_\`)\`: Label the version at the _path_ with _label_.

All operations are synchronous, except for \`waitFor\` and \`watch\`, which synchronously return async generators.

Implementation: [AFileSystem](#AFileSystem)
`
)});
  main.variable(observer("AFile_doc")).define("AFile_doc", ["md","FileAttachment_link","AFile_link"], function(md,FileAttachment_link,AFile_link){return(
md`### class \`AFile\`

\`new AFile(_name_, _data_, _metadata_)\`

This implements the same interface as ${FileAttachment_link}, but works with supplied data in a variety of forms:
* String—depending on the type requested, this may involve parsing or converting to an ArrayBuffer, Blob, or ReadableStream. _options_ arguments to the various extractors can include \`{utf8: _false_}\` to use UTF16 rather than UTF8 encoding.
* ArrayBuffer
* ReadableStream
* Blob
* JSON-compatible objects
* Arrays such as would be returned from \`.csv()\` or \.tsv()\`. Non-arrays will be converted to strings and parsed.
* A function. returning the value or a promise to the value. This is the most useful form, as it defers computation until needed. Except in the case of a \`ReadableStream\`, the result is cached. The function is called with the following arguments:
    * _file_: the ${AFile_link}.
    * _method_: One of \`json\`, \`text\`. \`arrayBuffer\`, \`stream\`, \`url\`, \`csv\`, \`tsv\`. These indicate how the data will be used, allowing the function to choose how to represent it. the usual conversions will be applied as needed, however, so it may be safely ignored.
    * _options_: The options supplied to the method accessing the data.
* A \`Promise\` that resolves to any of the above.

_metadata_ is either an object with metadata to be combined, or a string, which is interpreted as the \`contentType\`, as a shorthand when that is the only metadata being supplied.

All operations are asynchronous.

Implementation: [AFile](#AFile)
`
)});
  main.variable(observer("viewof meta_doc")).define("viewof meta_doc", ["md","AFileSystem_link"], function(md,AFileSystem_link){return(
md`### function meta(_file_, _metadata_)
Associate a _metadata_ object with the specified file (or array of file versions). This is normally used to annotate entries in the ${AFileSystem_link} tree.

Implementation: [meta](#meta)`
)});
  main.variable(observer("meta_doc")).define("meta_doc", ["Generators", "viewof meta_doc"], (G, _) => G.input(_));
  main.variable(observer("versionedFile_doc")).define("versionedFile_doc", ["md"], function(md){return(
md`### function versionedFile(_version_, _file_)
Convenience function that returns an array with the _file_ version. If _version_ is -1 or falsey, returns \`[\`_file_\`]\`.

Implmentation: [versionedFile](#versionedFile)`
)});
  main.variable(observer("viewof DIRECTORY_doc")).define("viewof DIRECTORY_doc", ["md"], function(md){return(
md`### Symbol DIRECTORY
Indicates a function to auto-create directories. Should be a function that takes \`(\`_fs_, _path_, _name_, _version_, _rest_, _tree_\`)\` and returns a directory structure (or null to indicate it should continue to not exist).

Implementation: [DIRECTORY](#DIRECTORY)`
)});
  main.variable(observer("DIRECTORY_doc")).define("DIRECTORY_doc", ["Generators", "viewof DIRECTORY_doc"], (G, _) => G.input(_));
  main.variable(observer("viewof FILE_doc")).define("viewof FILE_doc", ["md","versionedFile_link"], function(md,versionedFile_link){return(
md`### Symbol FILE
Indicates a function to auto-create files. Should be a function that takes \`(\`_fs_, _path_, _name_, _version_, _rest_, _tree_\`)\` and returns an array with the specified file (or null to indicate it should continue to not exist).

_version_ will be -1 for unversioned files; otherwise the file should be placed at the specified version if the request is to be satisfied.

See also: ${versionedFile_link}

Implementation: [FILE](#FILE)`
)});
  main.variable(observer("FILE_doc")).define("FILE_doc", ["Generators", "viewof FILE_doc"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], function(md){return(
md`## Example`
)});
  main.variable(observer("F")).define("F", ["AFileSystem","AFile","encodeString","FILE","DIRECTORY","meta","FileAttachment"], function(AFileSystem,AFile,encodeString,FILE,DIRECTORY,meta,FileAttachment){return(
new AFileSystem({
  foo: [7],
  bar: {
    baz: [88, 99, 128],
    depth: Object.assign([], {
      first: new AFile("first", "first"),
      last: new AFile("last", "last")
    }),
    blob: {
      utf8: [new AFile("utf8", new Blob([new TextEncoder().encode("cow")]))],
      utf16: [
        new AFile("utf16", new Blob([new Uint8Array(encodeString("pig"))]))
      ]
    },
    [FILE]: (fs, path, name, version, rest, tree) => {
      if (version === -1) {
        // Unversioned case.
        return [new AFile(name, [fs, path, name, version, rest, tree])];
      } else {
        // Versioned case. Must create AT LEAST the requested version.
        const files = [];
        files[version] = new AFile(name, [fs, path, name, version, rest, tree]);
        return files;
      }
    },
    [DIRECTORY]: (fs, path, name, version, rest, tree) => ({
      call: [new AFile(name, [fs, path, name, version, rest, tree])]
    })
  },
  senate: meta(
    [meta(FileAttachment("ROLL_SENATE_2020_292.json"), { revision: 'final' })],
    { chamber: 'senate' }
  ),
  attachment: [
    new AFile('stream', (file, type) =>
      FileAttachment("ROLL_SENATE_2020_292.json")[type]()
    )
  ],
  stream: [
    new AFile('stream', (file, type) =>
      FileAttachment("ROLL_SENATE_2020_292.json").stream()
    )
  ]
})
)});
  main.variable(observer()).define(["md"], function(md){return(
md`We can extract text from Blobs`
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/blob/utf8').text({ utf8: true })
)});
  main.variable(observer()).define(["md"], function(md){return(
md`If it's not UTF-8 encoded, we need to inform \`.text()\` of that.`
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/blob/utf16').text()
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/blob/utf16').text({ utf8: false })
)});
  main.variable(observer()).define(["md"], function(md){return(
md`We can get metadata. In this case, it gets a mix of supplied metadata on all versions of \`/senate\`, the specific version 0, and metadata obtained from the attachment itself.

Getting \`length\`, \`contentType\`, \`etag\`, and \`modificationDate\` require a \`HEAD\` operation on the url; this is done once on inquiry, and cached.`
)});
  main.variable(observer()).define(["F"], function(F){return(
F.metadata('/senate')
)});
  main.variable(observer()).define(["F"], function(F){return(
[F.find('/bar/baz@earliest'), F.find('/bar/baz@latest')]
)});
  main.variable(observer()).define(["md"], function(md){return(
md`We can add new entries, and we can label specific versions, then ask for that version via that label.`
)});
  main.variable(observer()).define(["F"], function(F)
{
  F.add('/cow', 888);
  F.label('/cow@1', 'beef');
  F.add('/cow', 9234);
  return [F.find('/cow@beef'), F.find('/cow')];
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`We can directly add entries with either a label or a version number. We can delete them by setting them to null.`
)});
  main.variable(observer()).define(["F"], function(F)
{
  F.add('/pig@pork', 899);
  F.add('/pig', 999);
  return [
    F.find('/pig'),
    F.add('/pig@1', null),
    F.find('/pig'),
    F.find('/pig@pork')
  ];
}
);
  main.variable(observer()).define(["md","FileAttachment_link"], function(md,FileAttachment_link){return(
md`We set \`/attachment\` to proxy to the ${FileAttachment_link}, so of course, we can call .json on it.`
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/attachment').json()
)});
  main.variable(observer()).define(["md"], function(md){return(
md`But we set \`/stream\` to a stream, and we can still get the JSON data from it. The default is for the data to be in UTF8 format, rather than UTF16; here, we specify it explicitly for illustration.`
)});
  main.variable(observer("V")).define("V", ["F"], function(F){return(
F.find('/stream').json({ utf8: true })
)});
  main.variable(observer()).define(["md","FILE_link","DIRECTORY_link","AFile_link"], function(md,FILE_link,DIRECTORY_link,AFile_link){return(
md`We can rely on the ${FILE_link} and ${DIRECTORY_link} mechanisms to create new entries automatically. Here, we create an ${AFile_link} with an array of the arguments, to illustrate how each function is called.`
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/sand').json()
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/bell@foo').json()
)});
  main.variable(observer()).define(["F"], function(F){return(
F.find('/bar/dive/call').json()
)});
  main.variable(observer()).define(["md"], function(md){return(
md`## Implementation`
)});
  main.variable(observer("AFileSystem")).define("AFileSystem", ["FILE","DIRECTORY","Throw","regenerator","FileAttachment"], function(FILE,DIRECTORY,Throw,regenerator,FileAttachment)
{
  let nameNum = 0;
  const METADATA = Symbol.for('METADATA');
  const CACHED_METADATA = Symbol.for('CACHED_METADATA');
  const meta = (obj, metadata) =>
    obj && Object.defineProperty(obj, METADATA, { value: metadata });
  // Traverse the filesystem, ultimately performing _action_ on the found file.
  // Missing files or directories are handled by createAction; the default is to
  // return null.
  const traverse = (filesystem, path, tree, action, createAction = () => null) => {
    const recurse = ([head, ...rest], tree) => {
      if (!tree) return null;
      if (head === '') {
        // Allows an initial '/'.
       return !tree ? null : recurse(rest, tree);
      } if (head === undefined) {
        throw new Error(`Accessing root as file.`);
     } else if (rest.length === 0) {
       // We're at the end of the path, so this names the file.
       const [name, versionName] = head.split('@');
       let files = tree[name];
       // 'latest' and 'earliest' are hardwired. Otherwise, if it's a number, parse it.
       // -1 means "latest".
       const version =
          (versionName || 'latest') === 'latest'
          ? -1
          : (versionName || 'earliest') === 'earliest'
            ? 0
            : /^\d+$/.test(versionName)
              ? Number.parseInt(versionName)
              : versionName;
       if (!files) {
          files = tree[FILE]?.(filesystem, path, name, version, rest, tree)
          || createAction(filesystem, path, name, rest, tree);
          if (!files) return null;
         tree[name] = files;
       }
       return action(filesystem, path, name, version, tree, files);
     } else {
       let ntree = tree[head];
       if (ntree === undefined || ntree === null) {
         const fn = tree[DIRECTORY];
         if (fn) {
           tree[head] = ntree = fn(filesystem, path, head, null, rest, tree)
         }
       }
       return recurse(rest, ntree);
     }
   };  
   return recurse(path.split('/'), tree);
  };
  
  const errorWrapper = (fs, op, ...args) => fn => {
    try {
      return fn();
    } catch (e) {
      e.message = `${fs.name}.${op}(${args.map(a => JSON.stringify(a)).join(', ')}) ${e.message}`;
      throw e;
    }
  };
  
  // The actual class that implements all this.
  class AFileSystem {
    constructor(tree, {readOnly, name} = {}) {
      this.readOnly = !!readOnly;
      this.name = name || `FS_${++nameNum}`;
      this.tree = tree || Throw(`Missing tree.`);
      this.subscription = regenerator(this);
      this.subscription.next();
    }
    // Find the requested path.
    find(path) {
      return errorWrapper(this, 'find', path)(() => {
      const getFile = (fs, path, name, version, tree, files) => {
        if (files.constructor === Object) {
          throw new Error(`${path} is a directory.`);
        }
        const file = files[version === -1 ? files.length - 1 : version];
        if (!file) return null;
        if (Array.isArray(file) || file.constructor === Object) {
          throw new Error(`${path} is a directory`);
        }
        return file;
      };
      return traverse(this, path, this.tree, getFile);
      })
    }
    
    // Wait for the requested path. The return value is an async generator
    // that yields once when the requested path is available.
    async *waitFor(path) {
      let v = this.find(path);
      if (v) {
        yield v;
        return;
      }
      for await (const fs of this.subscription) {
        const nv = fs.find(path);
        if (nv) {
          v = nv;
          yield v;
          return;
        }
      }
    }
    
    // Wait for the requested path. The return value is an async generator
    // that yields once for each value stored at path.
    async *watch(path, nullOK = false) {
      let v = this.find(path);
      if (v || nullOK) {
        yield v;
      }
      for await (const fs of this.subscription) {
        const nv = fs.find(path);
        if (nv !== v) {
          v = nv;
          if (nullOK || v) {
            yield v;
          }
        }
      }
    }
    
    // Return the metadata for the requested path.
    async metadata(path) {
      return errorWrapper(this, 'metadata', path)(() => {
      const getMeta = async (fs, path, name, version, tree, files) => {
        const file = files[version === -1 ? files.length - 1 : version];
        if (!file) return null;
        const filesMeta = files[METADATA] || {};
        if (file instanceof FileAttachment && !file[CACHED_METADATA]) {
          const headers = await (await fetch(await file.url(), {
            method: 'HEAD'
          })).headers;
          const attachMeta = { name: file.name, url: await file.url() };
          headers.forEach((v, k) => {
            switch (k) {
              case 'content-length':
                attachMeta.length = Number.parseInt(v);
                break;
              case 'last-modified':
                attachMeta.modificationDate = new Date(v);
                break;
              case 'etag':
                attachMeta.etag = v;
                break;
              case 'content-type':
                attachMeta.contentType = v;
                break;
              default:
            }
          });
          const fileMeta = file[METADATA] || {};
          Object.defineProperty(file, CACHED_METADATA, {value: { ...filesMeta, ...fileMeta, ...attachMeta }});
        }
        const contentType = file['content-type'];
        const fileMeta = contentType ? { 'content-type': contentType } : {};
        return { ...filesMeta, ...fileMeta, ...(file[CACHED_METADATA] || {}) };
      };
      return traverse(this, path, this.tree, getMeta);
      });
    }
    
    // Add a new file at the specified path. If no version, or 'latest', adds a new version.
    // Otherwise sets the specified version or label.
    add(path, file) {
      return errorWrapper(this, 'add', path, file)(() => {
      if (this.readOnly) throw new Error(`Read only filesystem.`);
      const createDir = (fs, path, name, rest, tree) => {
        if (rest.length === 0) {
          return (tree[name] = [file]);
        }
        return (tree[name] = {});
      };
      const setFile = (fs, path, name, version, tree, files) => {
        if (version === -1) {
          files.push(file);
        } else {
          files[version] = file;
        }
        return file;
      };
      try {
        return traverse(this, path, this.tree, setFile, createDir);
      } catch (e) {
        this.errored(e);
      } finally {
        this.updated();
      }});
    }
    
    // Copy file from to. If 'latest' or unspecified, copies only the latest.
    copy(from, to) {
      return this.add(to, this.find(from));
    }
    
    // Label the version at the specified path with 'label'.
    label(path, label) {
      const exp = path.split('/');
      const end = exp[exp.length - 1].split('@')[0];
      exp[exp.length - 1] = `${end}@${label}`;
      const to = exp.join('/');
      return this.copy(path, to);
    }
  }
  // Exports
  AFileSystem.meta = meta;
  AFileSystem.METADATA = METADATA;
  return AFileSystem;
}
);
  main.variable(observer("AFile")).define("AFile", ["AFileSystem","ReadableStream","encodeString","dsv"], function(AFileSystem,ReadableStream,encodeString,dsv){return(
class AFile {
  constructor(name, data, metadata = {}) {
    // Allow specifying the contentType by just giving the mime type.
    if (typeof metadata === 'string') {
      metadata = { contentType: metadata };
    }
    this.name = name;
    this.data = data;
    let { contentType } = metadata;
    this.contentType = contentType =
      contentType ||
      (typeof data === 'string'
        ? 'text/plain'
        : data.constructor === Array
        ? 'application/json'
        : data.constructor === Object
        ? 'application/json'
        : 'application/binary');
    Object.defineProperty(this, AFileSystem.METADATA, {
      value: { ...metadata, contentType }
    });
  }
  async getData(type, opts) {
    let data = await ((!this.noCache && this.dataResult) || this.data);
    if (typeof data === 'function') {
      this.dataResult = Promise.resolve(data(this, type, opts)).then(
        d => ((this.noCache = d instanceof ReadableStream), d)
      );
      data = await this.dataResult;
      if (this.noCache) {
        // Don't hang onto results we're not going to use again.
        delete this.dataResult;
      }
    }
    if (data instanceof ReadableStream && type !== 'stream') {
      let result = [];
      const reader = await data.getReader();
      let value,
        done,
        count = 0;
      while (!done) {
        const r = await reader.read();
        if (r.value) {
          result.push(r.value);
          count += r.value.byteLength;
        }
        done |= r.done;
      }
      const buffer = new ArrayBuffer(count);
      const ar = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of result) {
        ar.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return buffer;
    }
    if (!this.noCache) {
      this.data = data;
    }
    return data;
  }
  async json(opts = { utf8: true }) {
    const data = await this.getData('json', opts);
    if (
      data instanceof Blob ||
      data instanceof ReadableStream ||
      data instanceof ArrayBuffer
    ) {
      return JSON.parse(await this.text(opts));
    }
    return data;
  }
  async text(opts = { utf8: true }) {
    const { utf8 = true } = opts;
    const data = await this.getData('text', opts);
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) {
      if (utf8) {
        return new TextDecoder().decode(new Uint8Array(data));
      } else {
        return String.fromCodePoint(...new Uint16Array(data));
      }
    }
    if (data instanceof Blob) {
      if (utf8) {
        return new TextDecoder().decode(
          new Uint8Array(await data.arrayBuffer())
        );
      } else {
        return String.fromCodePoint(
          ...new Uint16Array(await data.arrayBuffer())
        );
      }
    }
    return JSON.stringify(data);
  }
  async url(opts = { utf8: true }) {
    const data = await this.getData('url', opts);
    const mime = await this.mime;
    if (typeof data === 'string') {
      return `data:${mime};UTF-8,${data}`;
    }
    return `data:${mime};base64,${btoa(this.arrayBuffer())}`;
  }
  async arrayBuffer(opts = { utf8: true }) {
    const { utf8 = true } = opts;
    const data = await this.getData('arrayBuffer', opts);
    if (data instanceof ArrayBuffer) {
      return data;
    }
    if (data instanceof Blob) {
      return data.arrayBuffer();
    }
    if (utf8) {
      return new TextEncoder().encode(await this.text({ utf8 })).buffer;
    } else {
      return encodeString(await this.text());
    }
  }
  async blob(opts) {
    const data = await this.getData('blob', opts);
    if (data instanceof Blob) {
      return data;
    }
    return new Blob([new Uint8Array(await this.arrayBuffer(opts))]);
  }
  async csv(opts = { utf8: true }) {
    const data = await this.getData('csv', opts);
    if (Array.isArray(data)) return data;
    if (data.constructor === Object) return data;
    return dsv(await this.text(), ",", opts);
  }
  async tsv(opts = { utf8: true }) {
    const data = await this.getData('tsv', opts);
    if (Array.isArray(data)) return data;
    if (data.constructor === Object) return data;
    return dsv(await this.text(), "\t", opts);
  }
  async stream(opts = { utf8: true }) {
    let data = await this.getData('stream', opts);
    if (data instanceof ReadableStream) {
      return data;
    }
    return new ReadableStream({
      pull: async controller => {
        const data = await this.arrayBuffer();
        const array = new Uint8Array(data);
        controller.enqueue(array);
        controller.close();
      }
    });
  }
}
)});
  main.variable(observer("meta")).define("meta", ["AFileSystem"], function(AFileSystem){return(
AFileSystem.meta
)});
  main.variable(observer("versionedFile")).define("versionedFile", function(){return(
(version, file) => {
  if (version === -1 || !version) {
    // Unversioned case.
    return [file];
  } else {
    // Versioned case: supply the specified version.
    const files = [];
    files[version] = file;
    return files;
  }
}
)});
  main.variable(observer("DIRECTORY")).define("DIRECTORY", function(){return(
Symbol.for('DIRECTORY')
)});
  main.variable(observer("FILE")).define("FILE", function(){return(
Symbol.for('FILE')
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Appendix`
)});
  main.variable(observer("regenerator")).define("regenerator", function()
{
  return async function* regenerator(obj) {
    let p = Promise.resolve(obj);
    obj.updateCount = 0;
    while (true) {
      p = new Promise((acc, rej) => {
        obj.updated = acc;
        obj.errored = rej;
      });
      yield obj;
      await p;
      obj.updateCount++;
    }
  };
}
);
  main.variable(observer("isString")).define("isString", function(){return(
s => typeof s === 'string'
)});
  main.variable(observer("Throw")).define("Throw", function(){return(
e => {
  if (e instanceof Error) {
    throw e;
  }
  throw new Error(e && e.toString());
}
)});
  main.variable(observer("dsv")).define("dsv", ["require"], function(require){return(
async function dsv(data, delimiter, { array = false, typed = false } = {}) {
  const [text, d3] = await Promise.all([
    data,
    require("d3-dsv@2.0.0/dist/d3-dsv.min.js")
  ]);
  return (delimiter === "\t"
    ? array
      ? d3.tsvParseRows
      : d3.tsvParse
    : array
    ? d3.csvParseRows
    : d3.csvParse)(text, typed && d3.autoType);
}
)});
  main.variable(observer("encodeString")).define("encodeString", function(){return(
s => {
  const ab = new ArrayBuffer(s.length * 2);
  const buf = new Uint16Array(ab);
  for (let i = 0; i < s.length; i++) {
    buf[i] = s.codePointAt(i);
  }
  return ab;
}
)});
  main.variable(observer("FileAttachment_link")).define("FileAttachment_link", function(){return(
`[\`FileAttachment\`](https://github.com/observablehq/stdlib#file-attachments)`
)});
  main.variable(observer("AFileSystem_link")).define("AFileSystem_link", function(){return(
`[\`AFileSystem\`](#AFileSystem_doc)`
)});
  main.variable(observer("AFile_link")).define("AFile_link", function(){return(
`[\`AFile\`](#AFile_doc)`
)});
  main.variable(observer("meta_link")).define("meta_link", function(){return(
"[\`meta\`](#meta_doc)"
)});
  main.variable(observer("versionedFile_link")).define("versionedFile_link", function(){return(
"[versionedFile](#versionedFile_doc)"
)});
  main.variable(observer("DIRECTORY_link")).define("DIRECTORY_link", function(){return(
"[DIRECTORY](#DIRECTORY_doc)"
)});
  main.variable(observer("FILE_link")).define("FILE_link", function(){return(
"[FILE](#FILE_doc)"
)});
  return main;
}
