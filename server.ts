import dotenv from 'dotenv';
import { SoakpServer, fallback } from './src/SoakpServer';

dotenv.config();

const sslPort = parseInt(process.env.SERVER_PORT, 10) || fallback.serverPort;

(async () => {
  try {
    await new SoakpServer().start(sslPort);
  } catch (initErr) {
    console.error('Error initializing server:', initErr);
    process.exit(1);
  }
})();
