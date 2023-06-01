# Secure OpenAI Key Proxy (SOAKP)

SOAKP is a Node.js library that facilitates secure usage of the [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) through a proxy-like application.

It stores you OpenAI API keys securely and provides a mechanism to interact with the OpenAI API without directly exposing it's keys using secure personal JWT token. To ensure optimal security, the library leverages Docker to automatically generate renewable SSL certificates using [Certbot](https://certbot.eff.org/).

This package is particularly useful for client-side applications where revealing API keys is a security concern.

## Features

**1. Secure Key Storage:** SOAKP securely stores your OpenAI API keys as JWTs encrypted with a custom (your) secret string. OpenAI API key is not stored unencrypted at all since JWT is a "container" for it. The keys are never directly exposed to any party other than OpenAI.

**2. Proxy-like Interaction:** Instead of directly calling the OpenAI API from the browser environment, and possibly revealing your keys, you can send your requests to this application, which forwards them to the OpenAI API and sends back a filtered (though untweaked in any manner) JSON response. The responses from OpenAI are then returned to your application, ensuring a seamless experience.

**3. Unique Bearer Tokens:** Upon saving the OpenAI API key, the application provides a unique custom Bearer token. This token is used for future authentication, replacing the need to directly use the OpenAI API key.

**4. Integration with OpenAI API:** SOAKP is designed to work seamlessly with the OpenAI API. Any endpoint, method, or feature available on the OpenAI API can be accessed via this package, ensuring you don't lose any functionality while gaining enhanced security.

## Deployment Options

The library provides a number of deployment options, including AWS Lambda using serverless for a super-quick deployment of your secured server instance. It also supports a range of cloud DNS providers, including Route53, Ovh, Cloudflare, [DigitalOcean](https://bit.ly/434c5IW), Google, DNSimple, [Linode](https://bit.ly/ghlinode), and others.

## Installation

You can install this package via npm:

```bash
npm install soakp
```

## Usage

After installation, you can import the package into your project and use it as follows:

```javascript
const soakp = require('soakp');

// Save your OpenAI key securely
let myToken = soakp.saveKey('your-openai-key');

// Use the returned token for future requests
let response = soakp.request(myToken, 'openai-api-endpoint', 'request-parameters');

// 'response' now holds the response from the OpenAI API
```

## Usage Scenarios

### Running Locally
The SOAKP library offers various options for running the key server locally. You can use Docker Desktop, which is the simplest and preferred way, or you can server directly using Node.js. The library is designed to work on any platform and ensures your machine's port is available externally if you use this approach.

### Node.js application

This works for any platform.

1. Install Node.js 16+ to have `npm` (Node Package Manager) software available.
2. Update environment variables in .env file, in specific related to domain. Certbot works only for live server. You cannot generate certificates for localhost with it.

```
$ mkdir ~/keyserver && cd ~/keyserver
$ npm install
$ npm run build
$ docker compose up --build certbot \\ OR
$ docker compose up --build myca \\ to use fake CA for self-signed certificate
$ node dist/index.js
```

Use any service to make your machine's port SERVER_PORT (in .env) available externally if you use this approach.
Once started, server is available at `https://[your-domain]:3033` with a completely valid SSL certificate. You need to specify `localhost` as `CB_DOMAIN` and leave empty `CB_WILDCARD_DOMAIN`

SOAKP is a perfect solution for developers looking for a secure and seamless way to interact with the OpenAI API. It hides the complexities of key management and API interaction behind a simple, easy-to-use interface.

Please note that while this package enhances the security of your API key usage, it's always important to follow best practices for security, including regularly rotating keys and monitoring usage for any suspicious activity.

## TODOS

1. Better query parameters validation
2. Add encryption to SQLite Database (SQLCipher)
3. Add file storage with encryption
4. Add memory storage with encryption
