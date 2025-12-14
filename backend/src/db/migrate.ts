import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, closeConnection } from './index.js';

async function runMigrations() {
  console.log('🔄 Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

runMigrations();
