# Prisma Migration Lock Fix

## Problem
Getting P1002 error: "Timed out trying to acquire a postgres advisory lock" during `prisma migrate deploy`

## Root Cause
PostgreSQL advisory lock (ID: 72707369) is stuck, preventing new migrations from acquiring the lock.

## Solutions (try in order):

### 1. Manual Lock Release
```bash
# Connect to database and release the lock
psql "$DATABASE_URL" -c "SELECT pg_advisory_unlock(72707369);"
```

### 2. Kill Hanging Processes
```bash
# Kill any running Prisma migration processes
pkill -f "prisma migrate"
```

### 3. Reset Migration State
```bash
# Mark current migration state as applied
npx prisma migrate resolve --applied
```

### 4. Force Reset (if needed)
```bash
# WARNING: This will reset your database
npx prisma db push --force-reset
```

### 5. Retry Migration
```bash
npx prisma migrate deploy && npm run build
```

## Prevention
- Ensure only one migration process runs at a time
- Check database connectivity before deploying
- Use `prisma migrate deploy` in CI/CD rather than `prisma db push`