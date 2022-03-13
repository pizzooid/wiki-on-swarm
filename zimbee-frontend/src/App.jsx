import { useEffect, useState } from 'react';
import './App.css'
import {searchContents, searchTitles} from './search';
import create from 'zustand'

const useStore = create((set, get) => ({
  isSearching: false,
  results: null,
  isSearchingFulltext: false,
  fulltextResults: null,
  selected: null,
  setResults: (results) => set({ results: results, isSearching: false }),
  setSearching: () => set({ results: null, isSearching: true }),
  setFulltextResults: (results) => {console.log('results', results); set({ fulltextResults: results, isSearchingFulltext: false })},
  setSearchingFulltext: () => set({ fulltextResults: null, isSearchingFulltext: true }),
  getNumResults: () => { get().results?.length || 0 },
}))

function Results(props) {
  const resultsTitles = useStore(state=>state.results);
  const setResultsTitles = useStore(state=>state.setResults);
  const searching = useStore(state=>state.isSearching);
  const setSearching = useStore(state=>state.setSearching);
  const results = useStore(state=>state.fulltextResults);
  const setResults = useStore(state=>state.setFulltextResults);
  const setSearchingFulltext = useStore(state=>state.setSearchingFulltext);

  useEffect(() => {
    setSearching();
    setSearchingFulltext()
    let unmounted = false;
    const abortController = new AbortController();
    searchTitles(props.searchString, abortController).then((result) => {
      if (unmounted)
        return;
      setResultsTitles(result)
    }).catch((e) => { console.log(e) } ); // TODO: handle errors correctly (skip e.message === 'canceled')
    searchContents(props.searchString, abortController).then((result) => {
      if (unmounted)
        return;
      setResults(result)
    }).catch((e) => { console.log(e) } );
    return function () {
      unmounted = true;
      abortController.abort("Cancelling in cleanup");
    };
  }
  ,[props.searchString])

  return (
        <div className='results-list'>
          <div key='titles.search.title' className='results-list-heading'>Page Results</div>
          { 
          searching ? <div className='results-list'>Loading ...</div> :
          resultsTitles === null || resultsTitles === undefined || resultsTitles.length===0 ? <div className='results-list'>No matching pages</div> :
          resultsTitles.slice(0, 8).map(r =>
            <div key={r.ref} className="results-list-item">{r.ref}</div>
          )}
          <div key='fulltext.search.title' className='results-list-heading'>Fulltext Results</div>
          {
          results === null ? <div className='results-list'>Loading ...</div> :
          results.length === 0 ? <div className='results-list'>No matching fulltext results</div> :
            <>
              {results.slice(0, 3).map(r =>
                <div key={r.ref} className="results-list-item">{r.ref}</div>
              )}
            </>
          }
        </div>
      )
}

function App() {
  const [searchString, setSearchString] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  return (
    <div id="my-outer-header">
      <div className="my-header">
        <input autoFocus={true}
          type="search"
          id="search-box"
          onChange={(e) => setSearchString(e.target.value)}
          onFocus={() => setShowSearchBox(true)}
          onBlur={() => false && setShowSearchBox(false)}
          />
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
