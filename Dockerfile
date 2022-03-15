FROM openzim/zim-tools

RUN apk --no-cache add curl bash npm
RUN npm install --global @ethersphere/swarm-cli

COPY . /zimbee
RUN cd /zimbee/zimbee-frontend && npm install
RUN npm install -g zx
npm install https://github.com/nextapps-de/flexsearch/tarball/0.7.0
ENTRYPOINT [ "/bin/bash" ]