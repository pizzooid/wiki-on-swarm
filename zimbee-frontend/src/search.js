import axios from 'axios'
import lunr from 'lunr'

var NUM_BUCKETS = 28;
var getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

let page_index = null;
export const getTitlesIdx = async(abortControler) => {
  if(page_index === null){
    const { data } = await axios.get('../index/bucket.titles.json', {signal: abortControler.signal})
    page_index = lunr.Index.load(data)
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

const buckets = Array(NUM_BUCKETS).fill(null);
export const getIdx = async (bucket, abortControler) => {
  if(buckets[bucket] === null){
    const { data } = await axios.get('../index/bucket' + String(bucket).padStart(2, '0') + '.json', {signal: abortControler.signal})
    buckets[bucket] = lunr.Index.load(data)
  }
  return buckets[bucket];
}

export const searchContents = async (_search, abortController) => {
  const search = _search.toLowerCase();
  const bucket = getBucketNo(search)
  const idx = await getIdx(bucket, abortController);
  const res = idx.search(search);
  if (res.length > 0){
    return res;
  }
  const res2 = idx.search(search+'*');
  return res2;
}