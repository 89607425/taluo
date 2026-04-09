import 'dotenv/config';
import { ensureSchema } from './schema';
import { db } from './db';

async function run() {
  await ensureSchema();
  await db.end();
  // eslint-disable-next-line no-console
  console.log('Database schema initialized.');
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
