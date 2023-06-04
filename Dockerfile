ARG node_version
FROM node:${node_version} AS install

LABEL maintainer="Lehcode <3556648+lehcode@users.noreply.github.com>"
LABEL description="A lightweight though secured Nodejs server."

ARG debug
ARG node_version
ARG node_env
ARG tz
ARG server_workdir
ARG auth_user
ARG auth_pass
ARG data_dir
ARG host_user_pass
ARG host_user_uid
ARG host_user_name

ENV DEBUG=${debug}
ENV NODE_ENV=${node_env}
ENV NODE_VERSION=${node_version}
ENV AUTH_USER=${auth_user}
ENV AUTH_PASS=${auth_pass}
ENV DATA_DIR=${data_dir}
ENV HOST_USER_PASS=${host_user_pass}
ENV HOST_USER_UID=${host_user_uid}
ENV HOST_USER_NAME=${host_user_name}

WORKDIR ${server_workdir}

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY *.ts .
COPY entrypoint.sh /init.sh

RUN if [ "${debug}" != "yes" ]; then set -e; else set -ex; fi \
  && export HOST_USER_PASS=$(openssl passwd -1 "${host_user_pass}") \
  && sh -c 'export DEBIAN_FRONTEND="noninteractive"' \
  && userdel node \
  && groupadd -g 1000 node \
  && useradd -d "/home/${host_user_name}" -g "${host_user_name}" -m -u "${host_user_uid}" -p "${HOST_USER_PASS}" "${host_user_name}" \
  && apt-get update \
  && apt-get -y upgrade \
  && apt-get -y --no-install-recommends --no-install-suggests \
    install sudo curl tzdata locales gnupg ca-certificates apache2-utils \
  && ln -fs /usr/share/zoneinfo/${tz} /etc/localtime \
  && echo ${tz} > /etc/timezone \
  && dpkg-reconfigure -f noninteractive tzdata \
  && apt-get clean \
  && echo "${host_user_name} ALL=(ALL:ALL) NOPASSWD: /bin/chown,/bin/chmod,/bin/ls,/bin/cat" | tee -a /etc/sudoers \
  && npm install -g npm \
  && npm --force install -g yarn \
  && npm cache clean --force \
  && htpasswd -cb .htpasswd ${auth_user} ${auth_pass} \
  && chmod a+x /init.sh \
  && chown -R ${host_user_name}:${host_user_name} ${server_workdir} ${data_dir}

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
