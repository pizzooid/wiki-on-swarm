#!/usr/bin/env zx
import { $, fs } from 'zx';
import path from 'path';

export const indexDir = path.join(process.cwd(), 'zimbee-frontend','public','index');
export const indexFile = path.join(indexDir,'pages');

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
  for(const file of files){
    
  }
};
main();