#!/usr/bin/env node
/*
 * @module
 * Copyright 2020 by Bob Kerns. Licensed under MIT license.
 *
 * Github: https://github.com/BobKerns/observablehq-file-attachments
 */

/*
 * This file handles documentation releases. In the context of a github release workflow,
 * it expects the gh-pages branch to be checked out into build/docdest. The generated API
 * documentation will be installed into build/docdest/docs/{tag}/api, and the site glue
 * will be updated with appropriate links.
 *
 * We do a bit of shuffling:
 * * The project CHANGELOG.md is at the global (top) in the target.
 * * The project README.md is versioned to each release tag, and the most
 *   recent one is also put at top level.
 *
 * They are converted to HTML, and links adjusted accordingly.
 *
 * The observablehq/ directory is copied to the release tag, and its README.md
 * is translated to HTML.
 */

import { readFileSync } from 'fs';
import { join, resolve, dirname, basename} from 'path';

const pkg = JSON.parse(readFileSync(resolve('./package.json'), {encoding: 'utf8'}))

const { title, version } = pkg;
const github = process.env['GITHUB_WORKSPACE'];
const github_path = (github || pkg.name || process.cwd()).split('/');
const PROJECT = github_path[github_path.length - 1];

const TITLE = title ?? PROJECT;

const VERSION = version;
const TAG = github ? `v${VERSION}` : 'local';

import { copyFile, readdir, mkdir as _mkdir, readFile as _readFile, writeFile as _writeFile } from 'fs/promises';
import { promisify } from 'util';
const mkdir = async d => {
    try {
        await _mkdir(d);
        console.log(`Created: ${d}`);
    } catch (e) {
        if (e.code === 'EEXIST') {
            // already exists.
            console.log(`Exists: ${d}`)
        } else {
            throw e;
        }
    }
    return d;
}
const readFile = async f => _readFile(f, 'utf8');
const writeFile = async (f, data) => _writeFile(f, data, 'utf8');

import { execFile as _execFile } from 'child_process';
const execFile = promisify(_execFile);

import _pkg from 'highlight.js';
const { getLanguage, highlight } = _pkg;

import fetch from 'node-fetch';

/**
 * The root of our repo
 * @type {string}
 */
const ROOT = resolve('.');

// In the workflow, point this to where we checked out the gh-pages branch.
const DOCS =
    github
        ? join(github, 'build/docdest')
        : join(ROOT, 'build/docdest');

const SITEBASE =
    github
        ? `/${PROJECT}`
        : '/';

const DOCBASE = `${SITEBASE}/docs`

import marked from 'marked';
const {Renderer, setOptions} = marked;
setOptions({
    renderer: new Renderer(),
    highlight: function(code, language) {
        const validLanguage = getLanguage(language) ? language : 'plaintext';
        return highlight(validLanguage, code).value;
    },
    gfm: true,
});
const renderer = {
    link(href, title, text) {
        const rewrite = () => {
            if (href.match(/(?:\.\/)?README.md$/)) {
                return `${DOCBASE}/${TAG}/README.html`;
            } else if (href.match(/(?:\.\/)?CHANGELOG.md$/)) {
                return `${DOCBASE}/CHANGELOG.html`;
            }
            return href.replace(/\.md$/i, '.html');
        };
        const nHref = rewrite(href);
        console.log('link', href, title, text, nHref);
        return`<a href=${nHref} ${title ? `title="${title}"` : ''}>${text}</a>`;
    }
};

marked.use({renderer });

const exec = async (cmd, ...args) => {
    const {stdout, stderr} = await execFile(cmd, args, {cwd: DOCS});
    stderr && process.stderr.write(stderr);
    stdout && process.stdout.write(stdout);
};

const copy = async (from, to) => {
    const dir = dirname(to);
    await mkdir(dir);
    await copyFile(from, to);
}

const html = (title, body) => `<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css" integrity="sha384-zB1R0rpPzHqg7Kpt0Aljp8JPLqbXI3bhnPWROx27a9N0Ll6ZP/+DiW/UqRcLbRjq" crossorigin="anonymous">
    <!-- The loading of KaTeX is deferred to speed up page rendering -->
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.js" integrity="sha384-y23I5Q6l+B6vatafAwxRu/0oK/79VlbSz7Q9aiSZUvyWYIYsd+qj+o24G5ZU2zJz" crossorigin="anonymous"></script>
    <!-- To automatically render math in text elements, include the auto-render extension: -->
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/contrib/auto-render.min.js" integrity="sha384-kWPLUVMOks5AQFrykwIup5lo0m3iMkkHrD0uJ4H5cjeGihAutqP0yW0J6dpFiVkI" crossorigin="anonymous"
        onload="renderMathInElement(document.body, [{left: '$\`', right: '\`$', display: false},{left: '$$', right: '$$', display: true},{left: '\\(', right: '\\)', display: false},{left: '\\[', right: '\\]', display: true}]);"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@10.0.3/styles/xcode.css" integrity="sha256-OI7B0pICACICPVbs30FdQ/l6qL8TnsfhyGAdg5m5NzQ=" crossorigin="anonymous">
</head>
<body>${body}</body>
</html>`;

const convert = async (from, to, title) => {
    console.log('Converting', from, to);
    const dir = dirname(to);
    const fname = basename(to).replace(/\.md$/i, '.html');
    const htmlFile = join(dir, fname);
    await mkdir(dir);
    const content = await readFile(from);
    return await convertContent(content, htmlFile, title);
};

const convertContent = async (content, htmlFile, title) => {
    const extractTitle = () => {
        const t1 = content.match(/^# (.*)$/m);
        return t1 ? t1[1] : basename(htmlFile, '.html');
    }
    title = title || extractTitle();
    const dir = dirname(htmlFile);
    await mkdir(dir);
    const xFormed = marked(content);
    console.log(`Writing: ${htmlFile} (${title})`);
    await writeFile(htmlFile, html(title, xFormed));
    return htmlFile;
};

const releases = async () =>
    (await (await fetch(`https://api.github.com/repos/BobKerns/${PROJECT}/releases`))
        .json())
        .filter(e => e.published_at > '2021-03-13T18:25:38Z')
        .map(r => `* [${r.name}](https://bobkerns.github.io/${PROJECT}/docs/${r.tag_name}/api/index.html) ${r.prerelease ? ' (prerelease)' : ''}`)
        .join('\n');

const Throw = m => {
    throw new Error(m);
};

const thisRelease = async(tag) =>
    github ?
        (await (await fetch(`https://api.github.com/repos/BobKerns/${PROJECT}/releases`))
            .json())
            .filter(e => e.tag_name === tag)
            [0] || Throw(`No release tagged ${tag} found.`)
        : {name: 'Local Build', body: 'Local build'} // fake release

const run = async () => {
    const source = join(ROOT, 'build', 'docs');
    const docs = join(DOCS, 'docs');
    const target = join(docs, TAG);
    const current = join(docs, 'current');
    const ohq = join(ROOT, 'notebook');
    const target_ohq = join(target, 'notebook');

    process.stdout.write(`GITHUB_WORKSPACE: ${github}\n`);
    process.stdout.write(`ROOT: ${ROOT}\n`);
    process.stdout.write(`DOCS: ${DOCS}\n`);
    process.stdout.write(`docs: ${docs}\n`);
    process.stdout.write(`Source: ${source}\n`);
    process.stdout.write(`Destination: ${target}\n`);
    await mkdir(DOCS);
    await mkdir(docs);
    await mkdir(target);
    await mkdir(target_ohq);
    await mkdir(current);
    await Promise.all([
        ['CHANGELOG.md', 'Change Log'],
        ['README.md', TITLE],
        ['README.md', TITLE, join(DOCS, 'index.html')],
        ['README.md', TITLE, join(target, 'README.html')]
    ].map(([f, title, f2]) =>
        convert(join(ROOT, f), f2 || join(docs, f), title)));
    const release_body = await releases();
    const release_page = `# ${TITLE} release documentation
${!github ? `* [local](http://localhost:5000/docs/local/index.html)` : ``}
* [CHANGELOG](./CHANGELOG.html)
${release_body}`;
    await convertContent(release_page, join(docs, 'index.html'), `${TITLE} Releases`);
    const release = await thisRelease(TAG);
    const release_landing = `# ${release.name}
    ${release.body || ''}
* [Captured ObservableHQ Test Page](observablehq/testing-${PROJECT}/)
* [Live ObservableHQ Test Page](https://observablehq.com/@bobkerns/testing-${PROJECT})
* [Test Page Integration Instructions](observablehq/testing-${PROJECT}/README.html)
* [API documentation](api/index.html)
* [CHANGELOG](../CHANGELOG.html)
* [GitHub](https://github.com/BobKerns/${PROJECT}.git)
* [GitHub ${TAG} tree](https://github.com/BobKerns/${PROJECT}.git/tree/${TAG}/)
`;
    await convertContent(release_landing, join(target, 'index.html'), release.name);
    const copyTree = async (from, to) => {
        console.log('copyTree', from, to);
        const dir = await readdir(resolve(ROOT, from), {withFileTypes: true});
        return  Promise.all(dir.map(d =>
            d.isFile()
                ? d.name.endsWith('.md')
                ? convert(join(from, d.name), join(to, d.name.replace(/\.md$/, '.html')))
                : copyFile(join(from, d.name), join(to, d.name))
                : d.isDirectory()
                ? Promise.resolve(join(to, d.name))
                    .then(mkdir)
                    .then(t => copyTree(join(from, d.name), t))
                : Promise.resolve(null)));
    }
    await copyTree(source, target);
    await copyTree(ohq, target_ohq);
    // Provide a duplicate copy at current for version-independent linking.
    await copyTree(target, current);
    // Only check in as part of the packaging workflow.
    if (github) {
        await exec('git', 'config', 'user.email', '1154903+BobKerns@users.noreply.github.com');
        await exec('git', 'config', 'user.name', 'ReleaseBot');
        await exec('git', 'add', target);
        await exec('git', 'add', current);
        await exec('git', 'add', 'index.html');
        await exec('git', 'add', 'docs/index.html');
        await exec('git', 'add', 'docs/CHANGELOG.html');
        await exec('git', 'commit', '-m', `Deploy documentation for ${TAG}.`);
        await exec('git', 'push');
    }
}
run().catch(e => {
    process.stderr.write(`Error: ${e.message}\n${e.stack}`);
    process.exit(-128);
});