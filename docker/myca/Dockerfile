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

COPY openssl.conf /etc/ssl/openssl.conf

WORKDIR /etc/ssl/certs

# Generate certificates
RUN if [ "${debug}" == "yes" ]; then set -ex && env; else set -e; fi \
    && sed -i 's/__CN__/"${ca_cn}"/g' ../openssl.conf \
    && sed -i 's/^(default_bits = )/\1"${key_len}"/' ../openssl.conf \
    # Generate a new private key
    && openssl genrsa \
        -out cakey.pem -passout pass:${key_pass} ${key_len} \
    # Create the CA certificate using the generated key file
    && openssl req -new -x509 -days ${days} -nodes \
        -key cakey.pem -passin pass:${key_pass} \
        -out cacrt.pem \
        -subj "/CN=${ca_cn}" \
        -config ../openssl.conf \
    # Create the private key for the server certificate
    && openssl genrsa -out ${server_cn}-key.pem -passout pass:${key_pass} ${key_len} \
    # Create the certificate signing request for the server certificate
    && openssl req -new \
        -key ${server_cn}-key.pem -passin pass:${key_pass} \
        -out ${server_cn}.csr \
        -subj "/CN=${server_cn}" \
        -config ../openssl.conf \
    && openssl req -text -noout -in ${server_cn}.csr \
    # Create the server certificate
    && openssl x509 -req -sha256 -days ${days} \
        -in ${server_cn}.csr -passin pass:${key_pass} \
        -CA cacrt.pem -CAkey cakey.pem -CAcreateserial \
        -out ${server_cn}-crt.pem \
        -extfile ../openssl.conf -extensions v3_req \
    # Create the CA PEM file from the CA certificate and intermediate certificate
    && cat ${server_cn}-key.pem  ${server_cn}-crt.pem > ${server_cn}.pem \
    && chown -R ${host_user_uid} ./${server_cn}* ./*.pem
