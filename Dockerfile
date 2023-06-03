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
ARG data_file_dir
ARG node_user_pwd

ENV DEBUG=${debug}
ENV NODE_ENV=${node_env}
ENV NODE_VERSION=${node_version}
ENV AUTH_USER=${auth_user}
ENV AUTH_PASS=${auth_pass}
ENV DATA_FILE_DIR=${data_file_dir}
ENV NODE_USER_PWD=${node_user_pwd}

WORKDIR ${workdir}

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY *.ts .
COPY entrypoint.sh /init.sh

RUN if [ "${debug}" != "yes" ]; then set -e; else set -ex; fi \
  && sh -c 'export DEBIAN_FRONTEND="noninteractive"' \
  && userdel node \
  && groupadd -g 1000 node \
  && useradd -d /home/node -g 1000 -m -u 1000 -p ${node_user_pwd} node \
  && apt-get update \
  && apt-get -y upgrade \
  && apt-get -y --no-install-recommends --no-install-suggests install sudo curl tzdata locales gnupg ca-certificates apache2-utils \
  && ln -fs /usr/share/zoneinfo/${tz} /etc/localtime \
  && echo ${tz} > /etc/timezone \
  && dpkg-reconfigure -f noninteractive tzdata \
  && apt-get clean \
  && echo "node ALL=(ALL:ALL) NOPASSWD: /bin/chown,/bin/chmod,/bin/ls,/bin/cat" | tee -a /etc/sudoers \
  && npm install -g npm \
  && npm --force install -g yarn \
  && npm cache clean --force \
  && htpasswd -cb .htpasswd ${auth_user} ${auth_pass} \
  && chmod a+x /init.sh \
  && chown -R node:node ${workdir} \
  && chown -R 777 /tmp ${data_file_dir}

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
