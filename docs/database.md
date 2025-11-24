# Database Management Guide

A guide for collaborators on how to work with the database using MikroORM.

## Table of Contents
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Common Commands](#common-commands)
- [Common Pitfalls](#common-pitfalls)
- [Additional Resources](#additional-resources)

---

## Quick Start

This project uses **MikroORM** with **PostgreSQL** as the database. All database schema changes are managed through migrations in a code-first approach.

**Key concepts:**
- **Entities** (`database/models/`) - TypeScript classes that define your database schema
- **Migrations** (`database/migrations/`) - SQL scripts that apply schema changes
- **Snapshot** (`database/migrations/.snapshot-pfa.json`) - Tracks the current database state for generating migrations

---

## Development Workflow

Follow these steps when making database changes:

### 1. Modify Entities

Edit entity files in `database/models/`:

```typescript
// database/models/User.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // Add new field
  @Property({ nullable: true })
  email?: string;
}
```

**Important:**
- Use `!` for required fields (non-null)
- Use `?` for optional fields (nullable)
- Always add `{ nullable: true }` for optional fields to match database schema

### 2. Check for Schema Differences

Verify your entities differ from the database:

```bash
pnpm db migration:check
```

**Expected output:**
- ✅ "Your database schema is up-to-date" - No changes needed
- ⚠️ "Schema not in sync" - Changes detected, proceed to create migration

### 3. Create Migration

Generate a migration from your entity changes:

```bash
pnpm db migration:create -n describe_your_change
```

**Examples:**
```bash
pnpm db migration:create -n add_email_to_users
pnpm db migration:create -n create_comments_table
pnpm db migration:create -n rename_status_to_state
```

**Note:** Use underscores or hyphens (no spaces) in migration names.

This creates:
- A new migration file in `database/migrations/`
- Updates the `.snapshot-pfa.json` file

### 4. Review the Migration

Open the generated migration file and verify the SQL looks correct:

```typescript
export class Migration20251124_add_email_to_users extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "email" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "email";`);
  }
}
```

**Check:**
- SQL syntax is correct
- Column types match your intent
- Down migration reverses the changes (for rollback capability)

### 5. Apply the Migration Locally

Run the migration on your local database:

```bash
pnpm db migration:up
```

**Verify it worked:**
```bash
pnpm db migration:check  # Should say "up-to-date"
```

### 6. Commit Your Changes

Commit **all three** components:

```bash
git add database/models/User.ts \
        database/migrations/Migration*.ts \
        database/migrations/.snapshot-pfa.json
        
git commit -m "Add email field to User entity"
git push
```

**Critical:** Always commit the snapshot file! It's the baseline for the next migration.

---

## Branch Switching & Database State

A common question: **"Should I migrate down before switching back to master?"**

**Answer: No!** Your local database state doesn't need to match your git branch.

### The Workflow

When you finish work on a feature branch:

```bash
# 1. Push your feature branch
git add database/models/ database/migrations/
git commit -m "Add new feature with DB changes"
git push origin feature/add-email-field

# 2. Switch back to master
git checkout master

# 3. Continue working on new tickets
# Your database STILL has the migration from your feature branch applied
# This is perfectly fine!
```

### Why This Works

**Key insight:** Migrations move forward only, even as you switch branches.

- Migration files have **timestamps** (e.g., `Migration20251124023758_...`)
- MikroORM tracks applied migrations in a `mikro_orm_migrations` table in your database
- When your PR merges and teammates pull, they run `pnpm db migration:up` to apply your new migration
- The system handles migrations applied in different orders across different developer machines

### What About the Snapshot?

The snapshot file **is branch-specific** and switches with git:

- On `master`: snapshot reflects master's schema
- On `feature/add-email`: snapshot includes your new changes
- Switch between branches: git automatically switches the snapshot file

**This is fine!** The snapshot is only used for **generating new migrations**, not for tracking what's applied to your database.

### When You SHOULD Care About Database State

You only need to roll back migrations when:

**1. Testing master without your feature's schema:**
```bash
git checkout master
pnpm db migration:down  # Roll back your feature's migration
# Test master branch
git checkout feature/add-email
pnpm db migration:up    # Reapply when switching back
```

**2. Two branches conflict on the same entity:**
- Choose which schema to keep locally
- You may need to manually adjust your database or start fresh

**3. You have conflicting test data:**
- Clean up test data that conflicts
- Schema changes can remain

### Working on Multiple Feature Branches

**Scenario:** You have two feature branches with different migrations.

```bash
# Branch A adds 'email' column
git checkout feature/add-email
pnpm db migration:up    # Database now has 'email' column

# Switch to Branch B which adds 'phone' column  
git checkout feature/add-phone
pnpm db migration:up    # Database now has BOTH 'email' and 'phone'

# Switch back to master
git checkout master
# Database still has both columns - this is OK!
```

**Why it's OK:** When both PRs merge, all developers will get both migrations and end up with the same schema.

### Summary

✅ **DO:** Keep your local database at the "latest" state across all your branches  
✅ **DO:** Run `migration:up` after pulling changes  
❌ **DON'T:** Migrate down every time you switch branches  
❌ **DON'T:** Worry if your database has "future" migrations from unmerged branches  

---

## Order-Dependent Migrations

**Problem:** Migrations with dependencies on other migrations can break when branches merge in unexpected order.

### The Scenario

```bash
# Your branch creates two migrations:
# Migration20251124120000 - creates 'users' table
# Migration20251124130000 - creates trigger that uses 'users.status' column

# Meanwhile, teammate merges to master:
# Migration20251124125000 - adds 'status' column to users

# Your migrations work locally because you have the full history
# BUT new developers pulling both branches might get failures
```

**The issue:** Your trigger migration assumes `status` exists, but you never tested it against a clean database that includes the `125000` migration in the correct order.

### Solutions

#### 1. Merge Master Into Your Branch (Recommended)

Always update your branch with master before creating a PR:

```bash
# Fetch latest changes from remote
git fetch origin master

# Merge master into your feature branch
git checkout feature/add-trigger
git merge origin/master

# If there are conflicts, resolve them:
# - Edit conflicting files (especially .snapshot-pfa.json)
# - git add <resolved-files>
# - git commit

# Apply any new migrations from master
pnpm db migration:up

# Verify your migrations still work
pnpm db migration:check

# Push your updated branch
git push origin feature/add-trigger
```

**Why update before merging?** This ensures you test your migrations against the latest master state, catching any order-dependent issues before your PR is merged.

#### 2. Test Against Clean Database

Before merging, verify migrations work from scratch:

```bash
# Create a test database
createdb pfa_test

# Temporarily point to test database (or modify mikro-orm.config.ts)
# Then run all migrations
pnpm db migration:up

# If this fails, your migration has hidden dependencies
```

**Pro tip:** Add this to your PR checklist.

#### 3. Make Migrations Self-Contained

**Bad - Assumes another migration ran:**
```typescript
// Migration20251124130000
export class Migration20251124130000 extends Migration {
  override async up(): Promise<void> {
    // ❌ Assumes 'status' column exists from another migration
    this.addSql(`
      CREATE TRIGGER check_status 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION validate_status();
    `);
  }
}
```

**Good - Includes dependencies:**
```typescript
// Migration20251124130000
export class Migration20251124130000 extends Migration {
  override async up(): Promise<void> {
    // ✅ Ensures prerequisite exists
    this.addSql(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'active';
    `);
    
    this.addSql(`
      CREATE TRIGGER check_status 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION validate_status();
    `);
  }
}
```

**Alternative:** Use PostgreSQL's conditional SQL:
```sql
-- Only create trigger if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='status'
  ) THEN
    CREATE TRIGGER check_status ...;
  END IF;
END $$;
```

#### 4. Split Into Multiple PRs

For complex dependent changes:

1. **PR #1:** Add the prerequisite (e.g., `status` column)
2. Wait for PR #1 to merge
3. **PR #2:** Add the dependent feature (e.g., trigger using `status`)

This ensures the dependency is in master before the dependent code.

#### 5. Rename Migration Timestamp (Last Resort)

If you discover a dependency issue before pushing:

```bash
# Your migration: Migration20251124130000
# Master now has: Migration20251124135000 (which yours depends on)

# Rename yours to come AFTER master's migration
mv database/migrations/Migration20251124130000_add_trigger.ts \
   database/migrations/Migration20251124140000_add_trigger.ts

# Update the class name inside the file:
# Change: class Migration20251124130000 extends Migration
# To:     class Migration20251124140000 extends Migration

# Regenerate snapshot
rm database/migrations/.snapshot-pfa.json
pnpm db migration:create --blank -n temp
rm database/migrations/Migration*temp.ts

# Test everything
pnpm db migration:up
```

**⚠️ Warning:** Only do this if the migration hasn't been pushed or merged. Never rename migrations that teammates might have already applied.

### Prevention: CI/CD Pipeline

Set up your CI to catch these issues:

```yaml
# .github/workflows/test.yml (example)
- name: Test Migrations
  run: |
    # Create fresh test database
    createdb pfa_ci_test
    
    # Run all migrations from scratch
    pnpm db migration:up
    
    # Run application tests
    pnpm test
```

This ensures every PR's migrations work against a clean slate.

### Key Takeaways

🎯 **Order-dependent migrations are a warning sign** - they indicate tight coupling  
🎯 **Always rebase and test before merging** - verify migrations work in the correct order  
🎯 **Make migrations idempotent when possible** - use `IF NOT EXISTS`, `IF EXISTS`  
🎯 **CI should test from clean database** - catches hidden dependencies  
🎯 **When in doubt, split into multiple PRs** - ensures dependencies merge first  

---

## Common Commands

### Migration Commands

```bash
# Create a new migration from entity changes
pnpm db migration:create -n migration_name

# Create an initial migration (first time only)
pnpm db migration:create --initial -n initial_schema

# Create a blank migration (for custom SQL)
pnpm db migration:create --blank -n custom_data_migration

# Run pending migrations
pnpm db migration:up

# Rollback the last migration
pnpm db migration:down

# List all migrations and their status
pnpm db migration:list

# Show pending (not yet run) migrations
pnpm db migration:pending

# Check if database schema matches entities
pnpm db migration:check
```

### Schema Commands (Development Only - Don't use in production!)

```bash
# Preview what schema:update would do
pnpm db schema:update -d

# Apply schema changes directly (bypasses migrations)
pnpm db schema:update -r

# Drop all tables
pnpm db schema:drop -r

# Create all tables from entities
pnpm db schema:create -r
```

**Warning:** `schema:*` commands modify the database directly without migrations. Only use in development for prototyping.

---

## Common Pitfalls

### 1. **Forgetting to commit the snapshot file**

**Problem:**
```bash
git add database/migrations/Migration*.ts
git commit  # ❌ Forgot .snapshot-pfa.json
```

**Impact:** Teammates can't generate consistent migrations.

**Solution:** Always commit the snapshot:
```bash
git add database/migrations/.snapshot-pfa.json
```

---

### 2. **Deleting entity before creating migration**

**Problem:**
```bash
rm database/models/OldEntity.ts  # Delete entity first
pnpm db migration:create         # ❌ Error: No entities found
```

**Solution:** Create a blank migration first:
```bash
pnpm db migration:create --blank -n drop_old_table
# Edit migration to add DROP TABLE statement
pnpm db migration:up
# Now delete the entity file
rm database/models/OldEntity.ts
```

---

### 3. **Running migrations out of order**

**Problem:**
```bash
# Pull changes from teammate
git pull
# Start working without running their migrations
# Your entities don't match your database
```

**Solution:** Always run migrations after pulling:
```bash
git pull
pnpm db migration:up  # Apply any new migrations
```

---

### 4. **Using spaces in migration names**

**Problem:**
```bash
pnpm db migration:create -n "add user email"  # ❌ Spaces break filename
```

**Solution:** Use underscores or hyphens:
```bash
pnpm db migration:create -n add_user_email  # ✅
```

---

### 5. **Snapshot conflicts after merge**

**Problem:** After merging branches, `.snapshot-pfa.json` has merge conflicts.

**Solution:** Regenerate the snapshot:
```bash
rm database/migrations/.snapshot-pfa.json
pnpm db migration:create --blank -n temp
rm database/migrations/Migration*temp.ts
git add database/migrations/.snapshot-pfa.json
git commit -m "Regenerate snapshot after merge"
```

---

### 6. **TypeScript says property is optional but database requires it**

**Problem:**
```typescript
@Property()          // ❌ Creates NOT NULL column
subtitle?: string;   // But TypeScript allows undefined
```

**Solution:** Keep TypeScript and database in sync:
```typescript
@Property({ nullable: true })  // ✅ DB allows NULL
subtitle?: string;              // ✅ TS allows undefined
```

---

### 7. **Migration applied but entity still doesn't match**

**Problem:** You ran `migration:up` but `migration:check` still shows errors.

**Cause:** Snapshot is out of sync.

**Solution:**
```bash
rm database/migrations/.snapshot-pfa.json
pnpm db migration:create --blank -n temp
rm database/migrations/Migration*temp.ts
pnpm db migration:check  # Should be in sync now
```

---

## Workflow Summary

**For every database change:**

1. ✅ Modify entities in `database/models/`
2. ✅ Run `pnpm db migration:check` to verify changes
3. ✅ Run `pnpm db migration:create -n description` to generate migration
4. ✅ Review the generated SQL in the migration file
5. ✅ Run `pnpm db migration:up` to apply locally
6. ✅ Commit entity + migration + snapshot files
7. ✅ Push to remote

**After pulling changes:**

1. ✅ Run `pnpm db migration:up` to apply teammate's migrations
2. ✅ Verify with `pnpm db migration:check`

---

## Additional Resources

- **MikroORM CLI Documentation:** https://mikro-orm.io/docs/quick-start#setting-up-the-commandline-tool
- **MikroORM Migrations Guide:** https://mikro-orm.io/docs/migrations
- **Entity Definition Reference:** https://mikro-orm.io/docs/defining-entities

---

## Project-Specific Setup

This project uses:
- **Database:** PostgreSQL (`pfa` database, `pfa` user)
- **Metadata Provider:** TsMorphMetadataProvider (analyzes TypeScript source files)
- **Migration Path:** `database/migrations/`
- **Entity Path:** `database/models/`
- **Command Alias:** `pnpm db` = `pnpm mikro-orm`

All MikroORM commands can be run with either:
```bash
pnpm db migration:up
# or
pnpm mikro-orm migration:up
```
