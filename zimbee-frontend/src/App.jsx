import axios from 'axios'
import { useEffect, useState } from 'react';
import './App.css'

var NUM_BUCKETS = 28;
var getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

const buckets = Array(NUM_BUCKETS).fill(null);

const getIdx = async (bucket, source) => {
  if(buckets[bucket] == null){
    const { data } = await axios.get('../index/bucket' + String(bucket).padStart(2, '0') + '.json', {cancelToken: source.token})
    buckets[bucket] = lunr.Index.load(data)
  }
  return buckets[bucket];
}

const searchContents = async (_search, source) => {
  const search = _search.toLowerCase();
  const bucket = getBucketNo(search)
  const idx = await getIdx(bucket, source);
  const res = idx.search(search);
  if (res.length > 0){
    return res;
  }
  const res2 = idx.search(search+'*');
  return res2;
}

function Results(props) {
  const [results, setResults] = useState(null);
  useEffect(() => {
    console.log(props);
    let unmounted = false;
    const source = axios.CancelToken.source();
    searchContents(props.searchString, source).then((result) => {
      if (unmounted)
        return;
      console.log("result", result)
      setResults(result)
    });
    return function () {
      unmounted = true;
      source.cancel("Cancelling in cleanup");
    };
  }
  ,[props.searchString])
  return results === null ? <div className='results-list'>Loading ...</div> :
  (
    <div className='results-list'>
      {results.slice(0,10).map(r=>
        <div key={r.ref}>{r.ref}</div>
      )}
    </div>
  )
}

function App() {
  const [searchString, setSearchString] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  return (
    <div id="my-outer-header">
      <div className="my-header">
        <input type="search" id="search-box" onChange={(e)=>setSearchString(e.target.value)} onFocus={()=>setShowSearchBox(true)} onBlur={()=>false && setShowSearchBox(false)} />
        {showSearchBox && searchString &&
          <div className="search-results">
            <Results search="" searchString={searchString} />
          </div>
        }
      </div>
    </div>
  )
}

export default App
