import { useEffect, useState } from 'react';
import './App.css'
import {searchContents, searchTitles} from './search';
import create from 'zustand'

const pagesPrefix = "../../dump/A/"
const MAX_RESULTS = 7;
const MAX_RESULTS_TOTAL = 10; // RESULTS + FULLTEXT_RESULTS
const useStore = create((set, get) => ({
  isSearching: false,
  results: null,
  resultsView: null, // only display < MAX_RESULTS
  isSearchingFulltext: false,
  fulltextResults: null,
  fulltextResultsView: null,
  selected: -1,
  selectedResult: null,
  // embedSrc: '../../dump/A',
  embedSrc: 'about:blank',
  selectNext: () => set((state)=>{
    const numResults = (state.resultsView?.length || 0) + (state.fulltextResults?.length || 0);
    const selected = Math.min(state.selected+1, numResults -1, MAX_RESULTS_TOTAL-1)
    let selectedResult = getSelectedResult(state, selected);
    return {selected:selected, selectedResult: selectedResult} 
  }),
  selectPrevious: () => set((state)=>{
    const selected = Math.max(-1, state.selected-1);
    let selectedResult = getSelectedResult(state, selected);
    return {selected:selected, selectedResult: selectedResult} 
  }),
  setResults: (results) => set({ results: results, isSearching: false, selected:-1, resultsView: results?.slice(0,MAX_RESULTS)||[] }),
  setSearching: () => set({ results: null, isSearching: true, selected:-1 }),
  setFulltextResults: (results) => {
    set(state=>{ 
      const numRes = (state?.resultsView?.length || 0);
      console.log(state?.resultsView)
      const resView = results
      //?.filter(ftr=>!state?.resultsView?.some(r=>ftr.ref===r.ref))
      ?.slice( 0, MAX_RESULTS_TOTAL-numRes ) || [] ;
      return { fulltextResults: results, isSearchingFulltext: false, selected: -1, fulltextResultsView: resView } })},
  setSearchingFulltext: () => set({ fulltextResults: null, isSearchingFulltext: true, selected: -1 }),
  setEmbedToResult: ()=>set(state=>{
    const src = state?.selectedResult?.ref;
    return {
      embedSrc:src?pagesPrefix+src+'.html':'about:blank'

    }}),
}))

function getSelectedResult(state, selected) {
  const numPageResults = state.resultsView?.length ?? 0;
  let selectedResult = null;
  if (selected >= 0) {
    if (selected < numPageResults) {
      selectedResult = state.results[selected];
    } else {
      selectedResult = state.fulltextResults[selected - numPageResults];
    }
  }
  return selectedResult;
}

function Results(props) {
  const pageResults = useStore(state=>state.resultsView);
  const setPageResults = useStore(state=>state.setResults);
  const searchingPages = useStore(state=>state.isSearching);
  const setSearchingPages = useStore(state=>state.setSearching);
  const fulltextResults = useStore(state=>state.fulltextResultsView);
  const setFulltextResults = useStore(state=>state.setFulltextResults);
  const setSearchingFulltext = useStore(state=>state.setSearchingFulltext);
  let selectedResult = useStore(state=>state.selectedResult);

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
    }).catch((e) => { console.log(e) } );
    return function () {
      unmounted = true;
      abortController.abort("Cancelling in cleanup");
    };
  }
  ,[props.searchString])

  const setContent = (page) => {
    console.log(pagesPrefix + page);
    document.getElementById('wiki-embed').src = pagesPrefix+page+'.html';
  };

  return (
        <div className='results-list'>
          <div key='titles.search.title' className='results-list-heading'>Page Results</div>
          { 
          searchingPages ? <div className='results-list'>Loading ...</div> :
          pageResults === null || pageResults === undefined || pageResults.length===0 ? <div className='results-list'>No matching pages</div> :
          pageResults.map(r =>
            <div key={r.ref} className={"results-list-item" + (selectedResult===r ?' result-active':'')} onClick={()=>setContent(r.ref)}>
              {r.ref}
            </div>
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
  const [embedSrc, setEmbedToResult] = useStore(state=>[state.embedSrc, state.setEmbedToResult]);
  console.log(embedSrc);
  const embedHeight = 500;
  const handleKeyPress = (event) => {
    setShowSearchBox(true);
    if (event.key === 'ArrowDown') {
      selectNext();
      event.preventDefault();
    }
    if (event.key === 'ArrowUp') {
      selectPrevious();
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      setEmbedToResult();
      setShowSearchBox(false);
      event.preventDefault();
    }
  }
  return (
    <>
      <div id="my-outer-header">
        <div className="my-header">
          <input autoFocus={true}
            type="search"
            id="search-box"
            onKeyDown={(e) => handleKeyPress(e)}
            onChange={(e) => setSearchString(e.target.value)}
            onFocus={() => setShowSearchBox(true)}
            onBlur={() => setShowSearchBox(false)}
          />
          {showSearchBox && searchString &&
            <div className="search-results">
              <Results search="" searchString={searchString} />
            </div>
          }
        </div>
      </div>
      <div>
        <embed type="text/html" src={embedSrc} width="100%" height={embedHeight} />
      </div>
    </>
  )
}

export default App
