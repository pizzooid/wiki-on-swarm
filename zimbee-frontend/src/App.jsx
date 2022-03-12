import axios from 'axios'
import './App.css'

var NUM_BUCKETS = 28;
var getBucketNo = (str) => str.charCodeAt(0) % NUM_BUCKETS;

const buckets = Array(NUM_BUCKETS).fill(null);

const getIdx = async (bucket) => {
  if(buckets[bucket] == null){
    const { data } = await axios.get('../index/bucket' + String(bucket).padStart(2, '0') + '.json')
    buckets[bucket] = lunr.Index.load(data)
  }
  return buckets[bucket];
}

const searchContents = async (search) => {
  const bucket = getBucketNo(search)
  const idx = await getIdx(bucket);
  return idx.search(search);
}

function App() {
  return (
    <div id="my-outer-header">
      <div className="my-header">
        <input type="search" id="search-box" />
        <div className="search-results">
          <div>
            Results
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
