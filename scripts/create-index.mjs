#!/usr/bin/env zx
// require("time-require");
// import 'zx/globals';
import {load} from 'cheerio'
// import {createHash, Hash} from 'crypto'
import lunr from 'lunr'
import fs from 'fs-extra'
import { argv, exit } from 'process'
import path from 'path'
import pako from 'pako'
// import { fs } from 'zx'

let zimdir = null;
if (argv.length >=3 ) {
  if(fs.ensureDirSync(argv[2])){
    process.stderr.write(`Path ${argv[2]} does not exist or is no directory.\n`)
    showHelp()
    exit(1);
  }
  zimdir = argv[2];
}
console.log(`Zim dir: ${zimdir}`)
export const cwd = process.cwd();
export const zDumpDir = path.join(zimdir??path.join(cwd,'dump'),'A');
export const frontendDir = path.join(cwd, 'zimbee-frontend');
export const indexDir = path.join(frontendDir,'public','index');
console.log(`Output: ${indexDir}`)

function showHelp() {
  process.stdout.write('Usage: \n npm createIndex <zim_dir>')
}

const main = async () => {
  const indexFile = path.join(indexDir,'page-index');

  console.log(`Reading source directory: ${zDumpDir}`)
  const files = fs.readdirSync(zDumpDir, {withFileTypes: true});

  console.log(`Creating search index for ${files.length} files.`)
  createPageIndex(files, indexDir, indexFile);
  createSearchIdces(zDumpDir, indexDir);
};
main();


function createPageIndex(files, indexDir, indexFile) {
  const builder = new lunr.Builder();
  builder.ref('name');
  builder.field('field');
  files.forEach((fname, idx) => {
    process.stdout.write('Adding pages to index ' + Math.round(100 * idx / files.length) + '% complete ... \r');
    let name = fname.name;
    if(!fname.isDirectory())
      if (fname.name.endsWith('.html')) {
        name = fname.name.slice(0, -5);
      } else {
        const fpath = path.join(zDumpDir, fname.name);
        fs.moveSync(fpath, fpath + '.html', { overwrite: true })
      }
    builder.add({ name: name, field: name.toLowerCase() });
  });
  process.stdout.write('Adding pages to index 100% complete. \n');
  process.stdout.write('Building index \n');
  if (!fs.pathExistsSync(indexDir))
    fs.mkdirSync(indexDir, { recursive: true });
  console.log("Serializing 1/2")
  const idx = builder.build();
  console.log("Serializing 2/2")
  const json = idx.toJSON();
  const indexFileName = indexFile + '.json'
  process.stdout.write(`Writing index file (${indexFileName}) ... \n`);
  // fs.writeFileSync(indexFileName, JSON.stringify(json));
  const bytes = pako.gzip(JSON.stringify(json));
  fs.writeFileSync(indexFileName+'.zlib', bytes,"binary");
  process.stdout.write('Writing files 100% complete. \n');
}

function createSearchIdces(zDumpDir, targetDIr) {
  const files = fs.readdirSync(zDumpDir, {withFileTypes: true});
  const builder = new lunr.Builder();
  builder.ref('name');
  builder.field('field');
  let i = 0;
  for (const fname of files) {
    i % 20 === 0 && process.stdout.write('Creating fulltext index ' + Math.round(1000*i/files.length)/10+ '% complete... \r'); i++;
    if(fname.isDirectory())
      continue;
    const name = fname.name.endsWith('.html')? fname.name.slice(0, -5) : fname.name;
    builder.add({ name: name, field: name.toLowerCase() });
    let contents = getFileContents(fname.name);
    const words = contents
      .split(/['".,\/#!$%\^&\*;:{}=+\-_`~()\n\r\s]+/) // TODO: add special chars
      .filter(s => s.length >= 3);

    builder.add({ name: name, field: words });
  }
  process.stdout.write('Creating fulltext index 100% complete... \n');

  console.log("Serializing 1/2")
  const idx = builder.build();
  // console.log('demo search ("afrik*")')
  // console.log(idx.search("afrik*")?.slice(0,3));
  console.log("Serializing 2/2")
  const json = idx.toJSON();
  process.stdout.write('Writing files ... \n');
  const fulltextFile = path.join(indexDir, 'fulltext.json')
  // fs.writeFileSync(fulltextFile, JSON.stringify(json));
  fs.writeFileSync(fulltextFile+'.zlib', pako.deflate(JSON.stringify(json)));
  return;

  function getFileContents(fname) {
    try{
      const flname = path.join(zDumpDir, fname);
      const file = fs.readFileSync(flname, 'utf-8');
      const html = load(file);
      let contents = html('body').text().toLowerCase();
      return contents;
    } catch (e) {
      console.log(`Error reading file: ${fname}`);
      console.log(e.message);
      return ""
    }
  }
}