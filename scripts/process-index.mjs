#!/usr/bin/env zx
import { $, fs } from 'zx';
import path from 'path';
import { indexDir } from './constants.mjs';

// export const indexDir = path.join(process.cwd(), 'zimbee-frontend','public','index');
export const indexFile = path.join(indexDir,'pages');

const GeneratorUtils = {
    * entriesOf(iter) {
        let i = 0;
        for (let value of iter) {
            yield [i++, value];
        }
    }
};

function* recursiveFileIterator(tld) {
  const dirs = fs.readdirSync(tld, {withFileTypes:true});
  for(let file of dirs) {
    if(file.isDirectory()){
      yield* recursiveFileIterator(path.join(tld, file.name));
    } else if(file.isFile()){
      yield path.join(tld, file.name);
    }
  }
}

const main = async () => {
  const files = recursiveFileIterator(indexDir);
  for(const [index, file] of GeneratorUtils.entriesOf(files)){
    console.log(file);
    if(index >= 10) break;
  }
};
main();