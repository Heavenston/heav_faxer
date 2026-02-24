import { getRequestEvent } from '$app/server';
import { drizzle } from 'drizzle-orm/node-postgres';

export function getDb() {
    const event = getRequestEvent();
}
