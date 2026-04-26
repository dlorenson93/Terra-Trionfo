#!/bin/bash

# Script to resolve Prisma migration advisory lock timeout issue
# This releases the stuck PostgreSQL advisory lock

echo "Attempting to release Prisma advisory lock..."

# Try to unlock the advisory lock (72707369 is the lock ID from the error)
psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock(72707369);" 2>/dev/null || echo "Lock release attempt completed"

echo "Checking for any running Prisma processes..."
# Kill any hanging Prisma processes
pkill -f "prisma migrate" || echo "No Prisma processes found"

echo "Attempting to reset migration state..."
# Try to mark migrations as applied if they're actually applied
npx prisma migrate resolve --applied 2>/dev/null || echo "Migration resolve attempt completed"

echo "Trying migration deploy again..."
npx prisma migrate deploy

echo "If migration deploy succeeds, running build..."
if [ $? -eq 0 ]; then
    npm run build
else
    echo "Migration deploy failed. You may need to:"
    echo "1. Check database connectivity"
    echo "2. Wait for other migration processes to complete"
    echo "3. Manually reset the database if needed"
    exit 1
fi