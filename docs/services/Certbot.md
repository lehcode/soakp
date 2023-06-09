# Certbot service



**Certbot works only for live domains.** You cannot generate certificates for `localhost` with it.

```bash
$ git clone https://github.com/lehcode/soakp.git
$ cd soakp
```



# $ docker compose up certbot
$ node -r ts-node/register server.ts
```

Use any service to make your machine's port SECURE_PORT (in .env) available externally if you use this approach.
Once started, server is available at `https://[your-domain]:[SECURE_PORT]` with a completely valid SSL certificate. You need to specify `localhost` as `CB_DOMAIN` and leave empty `CB_WILDCARD_DOMAIN`

## Support for Cloud DNS Providers

1. Route53
2. Ovh
3. Cloudflare
4. Digitalocean
5. Google
6. DNSimple
7. Linode
8. DNSMadeeasy
9. Nsone
10. Luadns
11. Sakuracloud
12. Cloudxns
13. Gehirn

Supports RFC2136.

Consider configuring your domain's DNS servers prior to starting Certbot.
Remember that changes in domain DNS may need some time to propagate over the internet nameservers.
Usually, this is 24-48 hours but often happens faster.

## Usage

1. Create `/usr/local/var/certbot` directory, it will keep certificates once they are generated by Certbot.
