#! /usr/bin/env node
import 'zx/globals';
import {load} from 'cheerio';
import {createHash, Hash} from 'crypto';
import lunr from 'lunr';
import lz from 'lz-string'

void async function () {
  const _cwDir = (await $`pwd`).stdout.trim();
  const zDumpDir = path.join(_cwDir, 'zim','dump','A');
  const folderHash = await computeMetaHash(zDumpDir);
  const indexFile = path.join(_cwDir, 'zim','dump',folderHash?.toString()+'.json.compressed')
  const files = await fs.readdir(zDumpDir);

  console.log('creating search index')
  const idx = await createSearchIndex(files, zDumpDir);
  var serializedIdx = lz.compress(JSON.stringify(idx));
  var deserialzzedIdx = lunr.Index.load(JSON.parse(lz.decompress(serializedIdx)||""));

  console.log('writing search index to disk: ',indexFile)
  fs.writeFileSync(indexFile, serializedIdx);

  console.log(deserialzzedIdx.search('London'));
  // await $`ls -la zim`
}()

async function createSearchIndex(files, zDumpDir) {
  let documents = [];
  for (const fname of files) {
    const file = await fs.readFileSync(path.join(zDumpDir, fname), 'utf-8');
    const html = load(file);
    const contents = html('body').text();
    const doc = {
      name: fname,
      contents: contents
    };
    documents.push(doc);
  }
  const idx = lunr((builder) => {
    builder.ref('name');
    builder.field('contents');
    documents.forEach((doc) => {
      builder.add(doc);
    });
  });
  return idx;
}

// from https://stackoverflow.com/questions/68074935/hash-of-folders-in-nodejs
async function computeMetaHash(folder, inputHash = null) {
    const hash = inputHash ? inputHash : createHash('sha256');
    const info = await fs.readdir(folder, { withFileTypes: true });
    // construct a string from the modification date, the filename and the filesize
    for (let item of info) {
        const fullPath = path.join(folder, item.name);
        if (item.isFile()) {
            const statInfo = await fs.stat(fullPath);
            // compute hash string name:size:mtime
            const fileInfo = `${fullPath}:${statInfo.size}:${statInfo.mtimeMs}`;
            hash.update(fileInfo);
        } else if (item.isDirectory()) {
            // recursively walk sub-folders
            await computeMetaHash(fullPath, hash);
        }
    }
    // if not being called recursively, get the digest and return it as the hash result
    if (!inputHash) {
        return hash.digest('hex');
    }
}