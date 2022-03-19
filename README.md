# wiki-on-swarm
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This is a submission for the WAM Hackathon on Github: [Best search mechanism for Wikipedia offline snapshots](https://gitcoin.co/issue/fairdatasociety/wam/19/100027845)

## How to run
Simply download a file and execute the provided docker container:
```bash
mkdir zim
cd zim
wget https://download.kiwix.org/zim/wikipedia/wikipedia_en_100_mini_2022-03.zim
docker run -v ${PWD}:/zim -it quay.io/pizzooid/zimbee convert.sh
```
The folder now contains an offline version of wikipedia with browser-based search.

## How to display the search page
The folder created by this script creates a directory called `frontend`. Just serve the *parent* directory containing all the pages, and open `http://localhost:8080/frontend` in the browser.
```bash
cd wikipedia_en_100_mini_2022-03
http-server
# open localhost:8080/frontend
```

# Documentation
The repository consists of multiple parts:
* The [Dockerfile](./Dockerfile) that is automatically compiled at [quay.io/pizzooid/zimbee](http://quay.io/pizzooid/zimbee)
* The shell script that runs the whole operation in the docker container [convert.sh](./convert.sh)
* The node script that generates the index [scripts/create-index.mjs](./scripts/create-index.mjs)
* The [frontend](./zimbee-frontend/) that displays the results from a static webserver

The index is created using a slightly modified version of [lunr.js](https://github.com/pizzooid/lunr.js) and compressed using [pako](https://github.com/nodeca/pako).

Results are scored using [Okapi BM25](https://en.wikipedia.org/wiki/Okapi_BM25).

Wildcards are supported. Example search terms: `*ar`, `b*r` or `ba*`
# Video demo
[https://youtu.be/pth1sxbjBQ8](https://youtu.be/pth1sxbjBQ8)

# Benchmark
|Input File|Input Size|Page Index Size|Fulltext Index Size|
|----------|----------|--------------|-------------------|
|https://download.kiwix.org/zim/wikipedia/wikipedia_ja_top_mini_2022-02.zim|2.1MB|85KB|343KB|
|https://download.kiwix.org/zim/wikipedia/wikipedia_en_chemistry_mini_2022-02.zim|27MB|921KB|11MB|
|https://download.kiwix.org/zim/wikipedia/wikipedia_en_100_maxi_2022-03.zim|30MB|85K|2.9M|
