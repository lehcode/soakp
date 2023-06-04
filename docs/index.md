# SOAKP (Secure OpenAI Proxy) Documentation

Table of contents:

1. [Checkout and Setup](./RepoSetup.md) - configure repository for every type of use.
2. [SSL Certificates](./ConfigureSSL.md) - create certificates for `localhost` or live domain.
3. [Generate JWT](./GenerateJWT.md) - get JWT to acess `/openai/*` endpoints.
4. [Communicate with OpenAI](./QueryOpenAI.md) - communicate with OpenAI API using JWT token instead of your plain API key.

[SOAKP](https://github.com/lehcode/soakp) is a Node.js application and library that facilitates secure usage of the [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) through a proxy-like application.

It stores your OpenAI API keys securely and provides a mechanism to interact with the OpenAI API without directly exposing its keys using a secure personal JWT token. To ensure optimal security, the library leverages Docker to automatically generate renewable SSL certificates using [Certbot](https://certbot.eff.org/).

This package features a companion library for client-side browser applications where revealing API keys is a security concern.

## Features

**1. Secure Key Storage:** SOAKP securely stores your OpenAI API keys as JWTs encrypted with a custom (your) secret string. OpenAI API key is not stored unencrypted at all since JWT is a "container" for it. The keys are never directly exposed to any party other than OpenAI.

**2. Proxy-like Interaction:** Instead of directly calling the OpenAI API from the browser environment, and possibly revealing your keys, you can send your requests to this application, which forwards them to the OpenAI API and sends back a filtered (though untweaked in any manner) JSON response. The responses from OpenAI are then returned to your application, ensuring a seamless experience.

**3. Unique Bearer Tokens:** Upon saving the OpenAI API key, the application provides a unique custom Bearer token. This token is used for future authentication, replacing the need to directly use the OpenAI API key.

**4. Integration with OpenAI API:** SOAKP is designed to work seamlessly with the OpenAI API. Any endpoint, method, or feature available on the OpenAI API can be accessed via this package, ensuring you don't lose any functionality while gaining enhanced security.
