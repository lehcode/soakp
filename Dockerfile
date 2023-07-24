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
ARG host_user_pass
ARG host_user_uid
ARG host_user_gid
ARG host_user_name
ARG host_docker_gid
ARG ssl_cert_dir
ARG data_dir

ENV DEBUG=${debug}
ENV NODE_ENV=${node_env}
ENV NODE_VERSION=${node_version}
ENV AUTH_USER=${auth_user}
ENV AUTH_PASS=${auth_pass}
ENV HOST_USER_PASS=${host_user_pass}
ENV HOST_USER_UID=${host_user_uid}
ENV HOST_USER_GID=${host_user_gid}
ENV HOST_USER_NAME=${host_user_name}
ENV HOST_DOCKER_GID=${host_docker_gid}
ENV SSL_CERT_DIR=${ssl_cert_dir}
ENV SERVER_ROOT="/srv/soakp"
ENV DATA_DIR=${data_dir}

WORKDIR ${SERVER_ROOT}

COPY entrypoint.sh /init.sh

RUN if [ "${debug}" != "yes" ]; then set -e; else set -ex; fi \
  && export HOST_USER_PASS=$(openssl passwd -1 "${host_user_pass}") \
  && sh -c 'export DEBIAN_FRONTEND="noninteractive"' \
  && userdel node \
  && groupadd -g ${host_docker_gid} docker \
  && groupadd -g ${host_user_gid} ${host_user_name} \
  && mkdir "/home/${host_user_name}" \
  && useradd --home "/home/${host_user_name}" \
    --gid "${host_user_name}" \
    --groups docker \
    --uid "${host_user_uid}" \
    --password "${HOST_USER_PASS}" "${host_user_name}" \
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
  && mkdir -p ${data_dir}/jsonl \
  && chown -R ${host_user_name}:docker "${SERVER_ROOT}" "/home/${host_user_name}" "${data_dir}"

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY *.ts .

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
