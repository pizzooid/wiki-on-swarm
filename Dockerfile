FROM openzim/zim-tools

RUN apk --no-cache add curl bash npm
RUN npm install --global @ethersphere/swarm-cli

ENTRYPOINT [ "/bin/bash" ]