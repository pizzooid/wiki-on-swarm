#!/usr/bin/env zx
// require("time-require");

import { cwd, indexDir, zDumpDir, frontendDir } from './constants.mjs'
// import 'zx/globals';
// import {load} from 'cheerio'
// import {createHash, Hash} from 'crypto'
import lunr from 'lunr'
import fs from 'fs-extra'
import { argv, exit } from 'process'
// import parseArgs from 'minimist'
import path from 'path'
// import { fs } from 'zx'

const getPageFile = (base, str) => {
  if(str.length < 1)
    throw new Error('search string must be at least 1 letters long');
  return path.join(base,str[0],'.idx');
};

const NUM_BUCKETS = 28;
const getIndexFile = (base, str) => {
  if(str.length < 3)
    throw new Error('search string must be at least 3 letters long');
  return path.join(base,str[0], str[1] + str[2] + '.idx');
};

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

const main = async () => {
  // const parsedArgs = parseArgs(argv);
  // if(!'u' in parsedArgs || !isValidURL(parsedArgs.u)){
  //   process.stderr.write('Invalid filename.\n')
  //   exit(1);
  // }
  // const url = parsedArgs.u;
  // console.log(`Loading ${url} to tmp`);
  // $`wget ${url} -o /tmp/download.zim` // TODO: enable download
  // $`zimdump dump --dir /tmp/zimdump -- /tmp/download.zim `
  const _cwDir = process.cwd();
  // const zDumpDir = path.join('', 'dump','A');
  // const folderHash = await computeMetaHash(zDumpDir);
  // const indexDir = path.join('/local', 'zimbee-frontend','public','index');
  // if(fs.existsSync(indexDir)){
  //   const deleteDir = await question(
  //   `${indexDir} exists, delete ([yes]/no)?`,
  //   {
  //     choices:["yes", "no"],
  //   });
  //   if(deleteDir !== "no" && deleteDir !== "n"){
  //     fs.rmSync(indexDir, {recursive: true});
  //   }
  // }
  const indexFile = path.join(indexDir,'pages');

  console.log(`Reading source directory: ${zDumpDir}`)
  const files = fs.readdirSync(zDumpDir);

  console.log(`Creating search index for ${files.length} files.`)
  createPageIndex(files, indexDir, indexFile);
  // fs.copyFileSync(path.join(cwd, 'scripts','serializer.mjs'), path.join(frontendDir, 'src', 'serializer.mjs'));
  // await createSearchIdces(files, zDumpDir, indexDir);
};
main();


function createPageIndex(files, indexDir, indexFile) {
  const builder = new lunr.Builder();
  builder.ref('name');
  builder.field('field');
  files.forEach((fname, idx) => {
    process.stdout.write('Adding pages to index ' + Math.round(100 * idx / files.length) + '% complete ... \r');
    const name = fname.endsWith('.html')? fname.slice(0, -5) : fname;
    builder.add({ name: name, field: name.toLowerCase() });
  });
  process.stdout.write('Adding pages to index 100% complete. \n');
  process.stdout.write('Building index \n');
  if (!fs.pathExistsSync(indexDir))
    fs.mkdirSync(indexDir, { recursive: true });
  // console.log(json)
  console.log("Serializing 1/2")
  const idx = builder.build();
  console.log("Serializing 2/2")
  const json = idx.toJSON();
  // console.log(JSON.stringify(avro.Type.forValue(json)));
  // console.log("Serializing 2/2")
  // const buffer = indexSerializer.toBuffer(json)
  process.stdout.write('Writing files ... \n');
  fs.writeFileSync(indexFile + '.json', JSON.stringify(json));
  process.stdout.write('Writing files 100% complete. \n');
}

async function createSearchIdces(files, zDumpDir, targetDIr) {
  let i = 0;
  for (const fname of files.slice(0,10000)) {
    i % 20 === 0 && process.stdout.write('Creating fulltext index ' + Math.round(1000*i/files.length)/10+ '% complete... \r'); i++;

    let contents = await getFileContents(fname);
    const words = contents
      .split(/['".,\/#!$%\^&\*;:{}=+\-_`~()\n\r\s]+/) // TODO: add special chars
      .filter(s => s.length >= 3);
    let wordScore = new Map();
    words.forEach((word, wIdx) => {
      const score = 1.0 / wIdx;
      if (wordScore.has(word))
        wordScore[word] += score;
      else
        wordScore.set(word, score);

    });
    wordScore.forEach((score, word) => {
      const targetFile = getIndexFile(targetDIr, word);
      const targetDir = path.parse(targetFile).dir;
      if(!fs.pathExistsSync(targetDir))
        fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetFile, word + ' ' + score + ':"' + encodeURI(fname) + '"', {flag:'w+'}); // space and : are separators so we can use them here
    })
  }
  process.stdout.write('Creating fulltext index 100% complete... \n');
  return;

  async function getFileContents(fname) {
    try{
      const file = await fs.readFileSync(path.join(zDumpDir, fname), 'utf-8');
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