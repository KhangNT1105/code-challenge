import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Database connection configuration
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

console.log("connectionString", connectionString);
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