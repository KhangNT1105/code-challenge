import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export client for manual queries if needed
export { client }; 