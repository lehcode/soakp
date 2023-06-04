FROM alpine/openssl

LABEL maintainer="Lehcode <3556648+lehcode@users.noreply.github.com>"
LABEL description="OpenSSL/CA service"

ARG key_pass
ARG key_len
ARG days
ARG ca_cn
ARG server_cn
ARG debug
ARG host_user_uid
ARG ssl_certs_dir
ARG host_docker_gid

ENV DEBUG="${debug}"
ENV WORKDIR="/etc/myca"

COPY entrypoint.sh /init.sh

WORKDIR "${WORKDIR}"
COPY openssl.conf .

# Generate certificates
RUN if [ "${debug}" == "yes" ]; then set -ex && env; else set -e; fi \
    && addgroup --system --gid ${host_docker_gid} docker \
    && sed -i 's/__CN__/"${ca_cn}"/g' ./openssl.conf \
    && sed -i 's/^(default_bits = )/\1"${key_len}"/' ./openssl.conf \
    && mkdir ca cert \
    && ls -al \
    # Generate a new private key
    && openssl genrsa -out $(pwd)/ca/cakey.pem \
    -passout pass:${key_pass} ${key_len} \
    && ls -al $(pwd)/ca/ \
    # Create the CA certificate using the generated key file
    && openssl req -new -key $(pwd)/ca/cakey.pem -passin pass:${key_pass} \
    -x509 -days ${days} -nodes \
    -out $(pwd)/ca/cacrt.pem \
    -subj "/CN=${ca_cn}" \
    -config $(pwd)/openssl.conf \
    && ls -al $(pwd)/ca/ \
    # Create the private key for the server certificate
    && openssl genrsa -out $(pwd)/cert/${server_cn}-key.pem -passout pass:${key_pass} ${key_len} \
    # Create the certificate signing request for the server certificate
    && openssl req -new -key $(pwd)/cert/${server_cn}-key.pem -passin pass:${key_pass} \
    -out $(pwd)/cert/${server_cn}.csr \
    -subj "/CN=${server_cn}" \
    -config $(pwd)/openssl.conf \
    && ls -al $(pwd)/cert/ \
    && openssl req -text -noout -in $(pwd)/cert/${server_cn}.csr \
    && ls -al $(pwd)/cert/ \
    # Create the server certificate
    && openssl x509 -req -sha256 -days ${days} \
    -in $(pwd)/cert/${server_cn}.csr -passin pass:${key_pass} \
    -CA $(pwd)/ca/cacrt.pem -CAkey $(pwd)/ca/cakey.pem -CAcreateserial \
    -out $(pwd)/cert/${server_cn}-crt.pem \
    -extfile $(pwd)/openssl.conf -extensions v3_req \
    && ls -al $(pwd)/cert/ \
    # Create the CA PEM file
    && cat $(pwd)/cert/${server_cn}-key.pem  $(pwd)/cert/${server_cn}-crt.pem > $(pwd)/cert/${server_cn}.pem \
    && chown -R ${host_user_uid}:${host_docker_gid} $(pwd)/ca/ $(pwd)/cert/ \
    && ls -al $(pwd)/ \
    && ls -al $(pwd)/ca/ \
    && ls -al $(pwd)/cert/ \
    && chmod u+x /init.sh
