import React, {ReactDOM} from 'react';

const Search = () => {
  return (
    <div className="my-header">
      <input type="search" id="search-box" />)
      <div style={{ position: "relative" }}>
        Results
      </div>
    </div>
  )
}

const Header = 
    <div id="my-outer-header">
        <Search />
    </div>

const domContainer = document.querySelector('#react-search');
ReactDOM.render(Header, domContainer);