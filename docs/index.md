# SOAKP (Secure OpenAI Proxy) Documentation

Table of contents:

1. [Checkout and Setup](./RepoSetup.md) - configure repository for every type of use.
2. [SSL Certificates](./ConfigureSSL.md) - create certificates for `localhost` or live domain.
3. [Generate JWT](./GenerateJWT.md) - get JWT to acess `/openai/*` endpoints.
4. [Communicate with OpenAI](./QueryOpenAI.md) - communicate with OpenAI API using JWT token instead of your plain API key.

[SOAKP](https://github.com/lehcode/soakp) is a Node.js application and library that facilitates secure usage of the [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) through a proxy-like application.

It stores your OpenAI API keys securely and provides a mechanism to interact with the OpenAI API without directly exposing its keys by using a secure personal JWT token. The library leverages Docker to automatically generate renewable SSL certificates using [Certbot](https://certbot.eff.org/) for live domains.

This package features an [companion NPM library](https://www.npmjs.com/package/@lehcode/soakp-client) for client-side browser applications where revealing API keys is a security concern.

## Features

1. **Enhanced Security**: Keep your OpenAI API key safe from unauthorized access and exposure. SOAKP Server ensures the confidentiality of your OpenAI key by securely managing and validating it within your application.

2. **Secure JWT Generation**: Generate unlimited secure JWTs for authorized users, enabling them to access the OpenAI API without directly exposing your key. Maintain granular control over API usage while ensuring high-level security.

3. **Web Client Compatibility**: `SOAKP Server`'s companion library specifically designed for modern web browsers, [soakp-client](https://github.com/lehcode/soakp-client), acts as a secure connection module, eliminating the need to expose the OpenAI API key in client-side code. `Soakp-client` seamlessly interacts with the OpenAI API using JWT-based authorization.

4. **Simplified Integration**: Seamlessly integrate `SOAKP Server` into your web applications and services. Both SOAKP and client library offer familiar APIs, making it easy to incorporate OpenAI capabilities without extensive setup or configuration.

5. **Documentation and Support**: Benefit from detailed documentation and community support. Both SOAKP and SOAKP client are provided with clear instructions and examples to guide you through the integration process, ensuring a smooth and hassle-free experience.
