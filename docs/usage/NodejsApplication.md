# Node.js application

This works for any platform from the command line. You need Node.js 16+ to have `npm` (Node Package Manager) software available.

## Get the code

Clone the repository from `https://github.com/lehcode/soakp.git`

## Configure SSL Cerificates Storage

`docker compose up myca` will generate self-signed certificates in the folder specified in `myca` service volume specification. Yo need to relace part before colon(`:`) with desired path on your machine where you want to keep your locally generated SSL cerificates. Don't forget to create directory first.

```yaml
...
volumes:
      - [/usr/local/lib/soakp]:${SSL_CERTS_DIR:?}
...
```

Run `docker compose up myca` to generate self-signed SSL certificates.

## Configure `Server` Docker Service

You need to apply abother small modification into `docker-compose.yml` file. Update `server` service's volume path to point to the directory where SSL certificates were installed at previous step.

```yaml
...
volumes:
      - [/usr/local/lib/soakp]:${SSL_CERTS_DIR:?}
      ...
...
```

## Start The Server

Use `docker compose up` to start the server.
Use `docker compose up myca` to re-generate SSL certificates.
Use `docker compose up --build` to rebuild image if you updated variables in `.env` file.

Read the [Certbot](../services/Certbot.md) section for instructions on how to create SSL certificates for live web domain.

[Home](../../README.md) | [Up](../index.md)
