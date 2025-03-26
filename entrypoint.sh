#!/usr/bin/env sh

# Run migrations before starting the app
npx drizzle-kit generate --config=drizzle.config.ts
npx drizzle-kit migrate --config=drizzle.config.ts

# Start the application
exec npm start
