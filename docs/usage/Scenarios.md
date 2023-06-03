# Usage Scenarios

The SOAKP offers various options for running the key server. You can use Docker, which is the simplest and preferred way, or you can serve the application directly using Node.js; you can also add it as a library to your application. The library is designed to work on any platform and ensures your machine's port is available externally if you use this approach.

Once the repository was cloned, don't forget to `cp .env.dist .env` and adjust variables to suit your system.

1. [Docker Compose application]() - simplest and safest.
2. [AWS Lambda](./usage/AWSlambda.md) - auto-deployment to cloud.
2. [Node.js library](./usage/NodejsLibrary.md) - use in your application as dependency.
3. [Node.js application](./usage/NodejsApplication.md) - run standalone from command line on any machine with Node.
4. [Docker image](./usage/DockerImage.md) - run prebuilt `lehcode/soakp` Docker image from command line.
