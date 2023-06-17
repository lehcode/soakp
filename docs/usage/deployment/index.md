# Deployment Options

[SOAKP](https://github.com/lehcode/soakp) offers various deployment options, including AWS Lambda using serverless architecture, allowing for quick deployment of a secured server instance. Additionally, the library supports multiple cloud DNS providers such as *Route53*, *Ovh*, *Cloudflare*, [*DigitalOcean*](https://bit.ly/434c5IW), *Google*, *DNSimple*, [*Linode*](https://bit.ly/ghlinode), and others, ensuring flexibility in choosing the desired DNS service.

To deploy the server script, you have the choice to host it on a cloud platform or a local machine. You can use the `npm run build` or `yarn build` command to build the necessary JavaScript files for deployment.

SOAKP can be run using the `ts-node` environment without the need for generating separate JavaScript files. Please consult the [ts-node documentation](https://www.npmjs.com/package/ts-node) for instructions on how to achieve this, it's easy.

Ultimately, you can [build the JavaScript](./ProductionBuild.md) files to run directly on any platform with Node.js, or choose to [deploy the application to AWS Lambda Cloud](./AWSLambda.md) for efficient and scalable serverless deployment.

---

[Home](../../index.md) | [Usage Scenarios](../Scenarios.md)
