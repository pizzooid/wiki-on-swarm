# wiki-on-swarm

This is a submission for the WAM Hackathon on Github: [Best search mechanism for Wikipedia offline snapshots](https://gitcoin.co/issue/fairdatasociety/wam/19/100027845)

## How to run
Simply download a file and execute the provided docker container:
```bash
mkdir zim
cd zim
wget https://download.kiwix.org/zim/wikipedia/wikipedia_en_100_mini_2022-03.zim
docker run -v ${PWD}:/zim -it quay.io/pizzooid/zimbee convert.sh
```
The folder now contains an offline version of wikipedia with browser based search.

## How to display the search page
The folder created by this script creates a directory called frontend just open it. e.g.
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


<!-- TODO: File size comparison -->