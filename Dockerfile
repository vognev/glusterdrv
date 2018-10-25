FROM vognev/base

RUN apt-get update && apt-get install -y gnupg2 wget apt-transport-https && rm -rf /var/lib/apt/lists/*

RUN wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
echo 'deb https://deb.nodesource.com/node_10.x jessie main' > /etc/apt/sources.list.d/nodesource.list && \
apt-get update && apt-get install -y nodejs && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN wget -qO- https://download.gluster.org/pub/gluster/glusterfs/3.12/rsa.pub | apt-key add - && \
echo 'deb https://download.gluster.org/pub/gluster/glusterfs/3.12/LATEST/Debian/jessie/amd64/apt jessie main' > /etc/apt/sources.list.d/gluster.list && \
apt-get update && apt-get install -y glusterfs-client && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y python-pip && pip install gfapi && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ADD package.json /app
RUN npm install --no-dev --no-progress --no-interaction

ADD . /app
ADD entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "index.js"]