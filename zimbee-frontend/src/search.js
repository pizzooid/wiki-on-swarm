import axios from 'axios'
import lunr from 'lunr'

var NUM_BUCKETS = 28;
var getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

let page_index = null;
export const getTitlesIdx = async(abortControler) => {
  if(page_index === null){
    const { data } = await axios.get('index/pages.json', {signal: abortControler.signal})
    page_index = lunr.Index.load(data)
    console.log(page_index)
  }
  return page_index;
}
export const searchTitles = async (_search, abortController) => {
  const search = _search.toLowerCase();
  const idx = await getTitlesIdx(abortController);
  const res = idx.search(search+'*');
  if (res.length > 0){
    return res;
  }
}

let fulltext_index = null;
export const getIdx = async (abortControler) => {
  if(fulltext_index === null){
    const { data } = await axios.get('index/fulltext.json', {signal: abortControler.signal})
    fulltext_index = lunr.Index.load(data)
  }
  return fulltext_index;
}

export const searchContents = async (_search, abortController) => {
  console.log(_search);
  const search = _search.toLowerCase();
  const idx = await getIdx(abortController);
  const res = idx.search(search);
  if (res.length > 0){
    return res;
  }
  const res2 = idx.search(search+'*');
  return res2;
}