import { useEffect, useState } from 'react';
import './App.css'
import {searchContents, searchTitles} from './search';
import create from 'zustand'

const MAX_RESULTS = 10;
const useStore = create((set, get) => ({
  isSearching: false,
  results: null,
  isSearchingFulltext: false,
  fulltextResults: null,
  selected: -1,
  selectNext: () => set((state)=>{
    const numResults = (state.results?.length || 0) + (state.fulltextResults?.length || 0);
    const selected = Math.min(state.selected+1, numResults -1, MAX_RESULTS-1)
    return {selected};
  }),
  selectPrevious: () => set((state)=>({selected:Math.max(-1, state.selected-1)})),
  setResults: (results) => set({ results: results?.slice(0,7), isSearching: false, selected:-1 }),
  setSearching: () => set({ results: null, isSearching: true, selected:-1 }),
  setFulltextResults: (results) => {console.log('results', results); set({ fulltextResults: results, isSearchingFulltext: false, selected: -1 })},
  setSearchingFulltext: () => set({ fulltextResults: null, isSearchingFulltext: true, selected: -1 }),
}))

function Results(props) {
  const pageResults = useStore(state=>state.results);
  const numPageResults = pageResults?.length ?? 0;
  const setPageResults = useStore(state=>state.setResults);
  const searchingPages = useStore(state=>state.isSearching);
  const setSearchingPages = useStore(state=>state.setSearching);
  const fulltextResults = useStore(state=>state.fulltextResults)?.slice(0,MAX_RESULTS-numPageResults) || null;
  const setFulltextResults = useStore(state=>state.setFulltextResults);
  const setSearchingFulltext = useStore(state=>state.setSearchingFulltext);
  const [selected, setSelected] = useStore(state=>[state.selected, state.setSelected]);
  let selectedResult = null;
  if(selected >= 0){
    if(selected < numPageResults){
      selectedResult = pageResults[selected];
    } else {
      selectedResult = fulltextResults[selected - numPageResults];
    }
  }

  useEffect(() => {
    setSearchingPages();
    setSearchingFulltext();
    let unmounted = false;
    const abortController = new AbortController();
    searchTitles(props.searchString, abortController).then((result) => {
      if (unmounted)
        return;
      setPageResults(result);
    }).catch((e) => { console.log(e) } ); // TODO: handle errors correctly (skip e.message === 'canceled')
    searchContents(props.searchString, abortController).then((result) => {
      if (unmounted)
        return;
      setFulltextResults(result);
      setSelected(1);
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
          searchingPages ? <div className='results-list'>Loading ...</div> :
          pageResults === null || pageResults === undefined || pageResults.length===0 ? <div className='results-list'>No matching pages</div> :
          pageResults.map(r =>
            <div key={r.ref} className={"results-list-item" + (selectedResult===r ?' result-active':'')}>{r.ref}</div>
          )}
          <div key='fulltext.search.title' className='results-list-heading'>Fulltext Results</div>
          {
          fulltextResults === null ? <div className='results-list'>Loading ...</div> :
          fulltextResults.length === 0 ? <div className='results-list'>No matching fulltext results</div> :
            <>
              {fulltextResults.map(r =>
                <div key={r.ref} className={"results-list-item" + (selectedResult===r ?' result-active':'')}>{r.ref}</div>
              )}
            </>
          }
        </div>
      )
}

function App() {
  const [searchString, setSearchString] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectNext, selectPrevious] = useStore(state=>[state.selectNext, state.selectPrevious]);
  const handleKeyPress = (event) => {
    if (event.key === 'ArrowDown') {
      selectNext();
      event.preventDefault();
    }
    if (event.key === 'ArrowUp') {
      selectPrevious();
      event.preventDefault();
    }
  }
  return (
    <div id="my-outer-header">
      <div className="my-header">
        <input autoFocus={true}
          type="search"
          id="search-box"
          onKeyDown={(e)=>handleKeyPress(e)}
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
