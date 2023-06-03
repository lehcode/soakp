# Node.js Library

You can import the package into your project and use it as follows:

```typescript
import { SoakpServer } from './src/SoakpServer';
import { KeyStorage, StorageType } from './src/KeyStorage';

const server = new SoakpServer();

async function start() {
  try {
    const storage = await KeyStorage.getInstance(storageType, storageConfig);
    try {
      await server.start(serverPort, storage);
    } catch (initErr) {
      console.error('Error initializing server:', initErr);
      process.exit(1);
    }
  } catch (storageErr) {
    console.error('Error getting storage instance:', storageErr);
    process.exit(1);
  }
}

start();
```
