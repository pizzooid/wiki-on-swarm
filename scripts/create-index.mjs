#!/usr/bin/env zx

// import 'zx/globals';
import {load} from 'cheerio';
import {createHash, Hash} from 'crypto';
import lunr from 'lunr';
import { writeFileSync } from 'fs';
import { argv, exit } from 'process';
import parseArgs from 'minimist';

const NUM_BUCKETS = 28;
const getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

function isValidURL(str) {
    var regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexp.test(str)) {
        return true;
    } else {
        return false;
    }
}

function showHelp() {
  process.stdout.write('Usage: \n'+argv._[0]+' -u <zim_url>')
}

void async function () {
  const parsedArgs = parseArgs(argv);
  if(!'u' in parsedArgs || !isValidURL(parsedArgs.u)){
    process.stderr.write('Invalid filename.\n')
    exit(1);
  }
  const url = parsedArgs.u;
  console.log(`Loading ${url} to tmp`);
  // $`wget ${url} -o /tmp/download.zim` // TODO: enable download
  // $`zimdump dump --dir /tmp/zimdump -- /tmp/download.zim `
  const _cwDir = (await $`pwd`).stdout.trim();
  const zDumpDir = path.join('/tmp', 'zimdump','A');
  // const folderHash = await computeMetaHash(zDumpDir);
  const indexFile = path.join(_cwDir, 'zimbee-frontend','public','index','bucket');
  const files = await fs.readdir(zDumpDir);

  console.log('creating search index')
  const searchIdcs = await createSearchIdces(files, zDumpDir);
  for(let i = 0; i< searchIdcs.length; i++){
    i % 20 === 0 && process.stdout.write('Writing files ' + Math.round(100*i/searchIdcs.length)+ '% complete... \r');
    const sIdx = searchIdcs[i];
    await writeFileSync(indexFile+String(i).padStart(2,'0')+'.json', JSON.stringify(sIdx));
  }
  // page name index
  const builder = new lunr.Builder();
  builder.ref('name');
  builder.field('field');
  for (const fname of files) {
    builder.add({name:fname, field: fname.toLowerCase()});
  }
  const sIdx = builder.build();
  await writeFileSync(indexFile + '.titles.json', JSON.stringify(sIdx));
  process.stdout.write('Writing files 100% complete... \r');
}()


async function createSearchIdces(files, zDumpDir, dbs) {
  let builders = Array(NUM_BUCKETS);
  for(let i =0; i<NUM_BUCKETS; i++){
    builders[i] = new lunr.Builder();
  }
  builders.forEach(b => {
    b.ref('name');
    b.field('contents');
  });
  let i = 0;
  for (const fname of files) {
    i % 20 === 0 && process.stdout.write('Reading files ' + Math.round(100*i/files.length)+ '% complete... \r');
    i++;
    try {
      const file = await fs.readFileSync(path.join(zDumpDir, fname), 'utf-8');
      const html = load(file);
      let contents = html('body').text().toLowerCase();
      const words = contents.split(/[.,\/#!$%\^&\*;:{}=\-_`~()\n\r\s]+/);
      for (let iBucket = 0; iBucket < NUM_BUCKETS; iBucket++) {
        const doc = {
          name: fname,
          contents: words.filter(s => typeof s === 'string' && s.length > 3 && getBucketNo(s) === iBucket).join(' ')
        };
        if (doc.contents.length) {
          await builders[iBucket].add(doc)
        }
      }
    } catch (e) {
      console.log(`Error reading file: ${fname}`);
      console.log(e.message);
    }
  }
  process.stdout.write('Reading files 100% complete... \n');
  for (let iBucket = 0; iBucket < NUM_BUCKETS; iBucket++) {
    process.stdout.write('Indexing Files ' + Math.round(100*iBucket/NUM_BUCKETS)+ '% complete... \r');
  }
  process.stdout.write('Indexing Files ' + 100 + '% complete... \n');
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