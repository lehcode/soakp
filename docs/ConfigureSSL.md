# Configure SSL Cerificates Storage

SOAKP provides flexible options for SSL certificate usage. For local development, you can use existing certificate for localhost or generate new ones for a specific hostname using the myca Docker service.

To generate self-signed SSL certificate for development purposes, you can use the command $ docker compose up myca. These certificate can be used to establish secure connections and interact with the OpenAI API. However, since self-signed certificate are not inherently trusted by web browsers, additional steps may be required to make Chrome trust the generated certificate.

Alternatively, you can choose to generate SSL certificate using a fake CA or Certbot, depending on your specific requirements and security needs.

## Use Existing Certificate

Repository already contains SSL certificate `docker/myca/certs/localhost-crt.pem` and `docker/myca/certs/localhost-key.pem` key files for `localhost` in `docker/myca/certs` folder. You can use them right away.

## Generate SSL Certificate

`docker compose up myca` will generate self-signed certificate in the folder specified in `myca` service volume specification. Yo need to relace part before colon(`:`) with desired path on your machine where you want to keep your locally generated SSL cerificates. Don't forget to create directory first and set appropriate permissions.

```yaml
...
volumes:
      - [/usr/local/lib/soakp]:${SSL_CERTS_DIR:?}
...
```

Run `docker compose up myca` to generate self-signed SSL certificate. It will exit with status 0 which means successful execution.

Check your folder for generated certificate.

[Home](./index.md)
