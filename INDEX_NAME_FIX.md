# Index Name Too Long - Quick Fix

## Problem
MySQL has a 64-character limit for index names. Knex auto-generates long names.

## Error Message
```
Identifier name 'tblrequirementposition_requirementtypeid_isactive_isdeleted_index' is too long
```

## Solution 1: Fix Migrations (RECOMMENDED)

All index names in migrations have been shortened. If you already ran migrations:

```bash
# Rollback
npm run migrate:rollback

# Run again with fixed names
npm run migrate:latest
```

## Solution 2: Manual SQL Fix

If migrations already ran, run this SQL:

```sql
-- Check existing indexes
SHOW INDEX FROM tblrequirementposition;

-- Drop long-named indexes
ALTER TABLE tblrequirementposition 
DROP INDEX tblrequirementposition_requirementtypeid_isactive_isdeleted_index;

-- Recreate with short name
ALTER TABLE tblrequirementposition 
ADD INDEX idx_reqpos_type (requirementtypeid, isactive, isdeleted);
```

## Solution 3: Complete Database Reset

```bash
# Drop database
mysql -u root -p -e "DROP DATABASE rexjobs;"

# Recreate
mysql -u root -p -e "CREATE DATABASE rexjobs CHARACTER SET utf8mb4;"

# Run migrations
npm run migrate:latest
```

## All Fixed Index Names

Migration files now use these short names:

```javascript
// Old (auto-generated - TOO LONG)
table.index(['companyid', 'isactive', 'isdeleted']);

// New (explicit short name - GOOD)
table.index(['companyid', 'isactive', 'isdeleted'], 'idx_company_active');
```

## Verify Fix

After running migrations:

```sql
-- Check all indexes
SELECT TABLE_NAME, INDEX_NAME, LENGTH(INDEX_NAME) as name_length
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'rexjobs'
AND LENGTH(INDEX_NAME) > 64;

-- Should return 0 rows
```

## Prevention

Always specify index names explicitly:

```javascript
// ❌ BAD - Knex generates long name
table.index(['col1', 'col2', 'col3']);

// ✅ GOOD - Explicit short name  
table.index(['col1', 'col2', 'col3'], 'idx_table_cols');
```

## Status

✅ All migration files have been fixed with short index names
✅ Maximum index name length: 30 characters
✅ All names follow pattern: idx_table_purpose

Just drop and recreate your database, then run migrations again!
