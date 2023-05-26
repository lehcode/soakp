ARG node_version
FROM node:${node_version} AS install

LABEL maintainer="Lehcode <3556648+lehcode@users.noreply.github.com>"
LABEL description="A lightweight though secured Nodejs server."

ARG debug
ARG node_version
ARG node_env
ARG tz
ARG workdir
ARG auth_user
ARG auth_pass

ENV DEBUG=${debug}
ENV NODE_ENV=${node_env}
ENV NODE_VERSION=${node_version}
ENV AUTH_USER=${auth_user}
ENV AUTH_PASS=${auth_pass}

WORKDIR ${workdir}

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
# COPY to-mjs.sh .
COPY keyserver.ts .
COPY entrypoint.sh /init.sh

RUN if [ "${debug}" != "yes" ]; then set -e; else set -ex; fi \
  && sh -c 'export DEBIAN_FRONTEND="noninteractive"' \
  && apt-get update \
  && apt-get -y upgrade \
  && apt-get -y --no-install-recommends --no-install-suggests install curl tzdata locales gnupg ca-certificates apache2-utils sudo nmap \
  && echo "node   ALL=(ALL:ALL)    NOPASSWD:ALL" | tee -a /etc/sudoers \
  && ln -fs /usr/share/zoneinfo/${tz} /etc/localtime \
  && echo ${tz} > /etc/timezone \
  && dpkg-reconfigure -f noninteractive tzdata \
  && apt-get clean \
  && npm install -g npm \
  && npm cache clean --force \
  && htpasswd -cb .htpasswd ${auth_user} ${auth_pass} \
  && chmod a+x /init.sh \
  && chown -R node:node ${workdir}

# Stage 1: Build the Node.js application
# FROM node:14-alpine AS build

# WORKDIR ${workdir}

# COPY package.json yarn-lock.json ./

# RUN yarn install --frozen-lockfile \
#     && yarn build

# COPY ./dist/ .

# # Stage 2: Create a minimal image to run the application
# FROM node:14-alpine

# WORKDIR ${workdir}

# COPY --from=builder ${workdir} .

#CMD ["node", "--trace-warnings", "keyserver.js"]
