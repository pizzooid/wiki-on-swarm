FROM openzim/zim-tools

RUN apk --no-cache add curl bash npm
# RUN npm install --global @ethersphere/swarm-cli

COPY . /zimbee
RUN cd /zimbee && npm install
RUN cd /zimbee/zimbee-frontend && npm install
RUN npm install -g zx
ENTRYPOINT [ "/bin/bash" ]