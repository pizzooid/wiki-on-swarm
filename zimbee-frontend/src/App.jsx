import { useEffect, useRef, useState } from 'react';
import './App.css'
import {searchContents, searchTitles} from './search';
import create from 'zustand'

const pagesPrefix = "../A/"
const MAX_RESULTS = 7;
const MAX_RESULTS_TOTAL = 10; // RESULTS + FULLTEXT_RESULTS
const useStore = create((set, get) => ({
  showResultsPage: false,
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
      const resView = results
      //?.filter(ftr=>!state?.resultsView?.some(r=>ftr.ref===r.ref))
      ?.slice( 0, MAX_RESULTS_TOTAL-numRes ) || [] ;
      return { fulltextResults: results, isSearchingFulltext: false, selected: -1, fulltextResultsView: resView } })},
  setSearchingFulltext: () => set({ fulltextResults: null, isSearchingFulltext: true, selected: -1 }),
  setEmbedSrc: (ref) => set(() => {
    return { embedSrc: ref ? pagesPrefix + ref + '.html' : 'about:blank', showResultsPage:false}
  }),
  onEnter: ()=>set(state=>{
    if (state.selected == -1) { // nothing selected display search results page
      return {showResultsPage: true};
    } 
    const src = state?.selectedResult?.ref;
    return {
      embedSrc:src?pagesPrefix+src+'.html':'about:blank',
      showResultsPage:false
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
  const setEmbedSrc = useStore(state=>state.setEmbedSrc);

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

  return (
        <div className='results-list'>
          <div key='titles.search.title' className='results-list-heading'>Page Results</div>
          { 
          searchingPages ? <div className='results-list'>Loading ...</div> :
          pageResults === null || pageResults === undefined || pageResults.length===0 ? <div className='results-list'>No matching pages</div> :
          pageResults.map((r) =>
            <div key={r.ref} style={{cursor:"pointer"}} className={"results-list-item" + (selectedResult===r ?' result-active':'')} onMouseDown={()=>setEmbedSrc(r.ref)}>
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
  const [embedSrc, onEnter] = useStore(state=>[state.embedSrc, state.onEnter]);
  const showResultsPage = useStore(state=>state.showResultsPage);
  const [height, setHeight] = useState(10);
  const embedContainer = useRef();
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
      onEnter();
      setShowSearchBox(false);
      event.preventDefault();
    }
  }
  useEffect(()=>{
    const handleResize = () => setHeight(embedContainer.current.clientHeight);
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  },[embedContainer])
  return (
    <div style={{display:'flex', flexDirection:'column', height:"100vh"}}>
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
          {!showResultsPage && showSearchBox && searchString &&
            <div className="search-results">
              <Results search="" searchString={searchString} />
            </div>
          }
        </div>
      </div>
      <div ref={embedContainer} style={{flexGrow:1, overflow:'hidden'}}>
        {showResultsPage
          ? 
          <div style={{overflow: 'auto', height:"100%"}}>
            <div style={{ maxWidth: '55.8em', marginLeft: "auto", marginRight: "auto" }}>
              <h1 className="section-heading">
                <span className="mw-headline" >Search Results</span>
              </h1>
              <Results search="" searchString={searchString} />
              <div><div style={{ clear: "both", backgroundImage: "linear-gradient(180deg, #E8E8E8, white)", borderTop: "dashed 2px #AAAAAA", padding: "0.5em 0.5em 0.5em 0.5em", marginTop: "1em", direction: "ltr" }}>
                Search results provided by zimbee.
              </div>
              </div>
            </div>
          </div>
          : <embed type="text/html" src={embedSrc} width="100%" height={height} />
        }
      </div>
    </div>
  )
}

export default App
