#! /usr/bin/env node
import 'zx/globals';
import {load} from 'cheerio';
import {createHash, Hash} from 'crypto';
import lunr from 'lunr';
import { writeFileSync } from 'fs';

const NUM_BUCKETS = 28;
const getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

void async function () {
  const _cwDir = (await $`pwd`).stdout.trim();
  const zDumpDir = path.join(_cwDir, 'zim','dump','A');
  const folderHash = await computeMetaHash(zDumpDir);
  const indexFile = path.join(_cwDir, 'zim','dump',folderHash?.toString());
  const files = await fs.readdir(zDumpDir);

  console.log('creating search index')
  const searchIdcs = await createSearchIdces(files, zDumpDir);
  const search = "ma"
  console.log(getBucketNo(search))
  console.log(searchIdcs[getBucketNo(search)].search(search))
}()


async function createSearchIdces(files, zDumpDir, dbs) {
  let builders = Array(NUM_BUCKETS).fill(new lunr.Builder())
  builders.forEach(b => {
    b.ref('name');
    b.field('contents');
  });
  let i = 0;
  for (const fname of files) {
    i % 20 === 0 && process.stdout.write('Reading Files ' + Math.round(100*i/files.length)+ '% complete... \r');
    i++;
    const file = await fs.readFileSync(path.join(zDumpDir, fname), 'utf-8');
    const html = load(file);
    let contents = html('body').text().toLowerCase();
    const words = contents.split(/[\n\r\s]+/);
    for (let iBucket = 0; iBucket < NUM_BUCKETS; iBucket++) {
      const doc = {
        name: fname,
        contents: words.filter(s => typeof s==='string' && s.length > 3 && getBucketNo(s) === iBucket).join(' ')
      };
      if(doc.contents.length){
        await builders[iBucket].add(doc)
      }
    }
  }
  process.stdout.write('Reading Files 100% complete... \n');
  return builders.map(b => b.build());
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