# Fix: "Could not find a relationship" Error

## Problem
You're seeing this error:
```
Could not find a relationship between 'tickets' and 'agents' in the schema cache
```

This happens when the foreign key constraints don't have the explicit names that the code expects.

## Solution

### Option 1: Re-run the Updated Schema (If tables don't exist yet)
1. Go to Supabase Dashboard → SQL Editor
2. Drop all existing tables (if any)
3. Run the updated `supabase_schema.sql` file

### Option 2: Fix Existing Tables (Recommended if tables already exist)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `fix_foreign_keys.sql`
3. Click **Run**

This script will:
- Remove any existing foreign key constraints with auto-generated names
- Add properly named foreign key constraints that match what the code expects

### Option 3: Manual Fix via Dashboard
1. Go to Supabase Dashboard → Table Editor
2. For each table, go to **Settings** → **Foreign Keys**
3. Check if the foreign keys exist with the correct names:
   - `tickets_assigned_agent_fkey` (tickets.assigned_agent_id → agents.id)
   - `tickets_whatsapp_number_fkey` (tickets.whatsapp_number → whatsapp_numbers.phone_number)
   - `whatsapp_numbers_assigned_agent_fkey` (whatsapp_numbers.assigned_agent → agents.id)
   - And others as needed

## Required Foreign Key Names

The code expects these specific constraint names:

| Table | Constraint Name | References |
|-------|----------------|------------|
| `tickets` | `tickets_assigned_agent_fkey` | `agents(id)` |
| `tickets` | `tickets_whatsapp_number_fkey` | `whatsapp_numbers(phone_number)` |
| `whatsapp_numbers` | `whatsapp_numbers_assigned_agent_fkey` | `agents(id)` |
| `status_history` | `status_history_ticket_id_fkey` | `tickets(id)` |
| `status_history` | `status_history_updated_by_agent_fkey` | `agents(id)` |
| `whatsapp_messages` | `whatsapp_messages_ticket_id_fkey` | `tickets(id)` |
| `user_sessions` | `user_sessions_assigned_agent_fkey` | `agents(id)` |
| `chat_messages` | `chat_messages_session_id_fkey` | `user_sessions(session_id)` |
| `chat_messages` | `chat_messages_ticket_id_fkey` | `tickets(id)` |
| `chat_messages` | `chat_messages_sender_id_fkey` | `agents(id)` |

## After Running the Fix

1. Refresh your application
2. The error should be resolved
3. You should be able to query tickets with their assigned agents

## Verify It Worked

Run this query in SQL Editor to verify all constraints exist:

```sql
SELECT 
    tc.table_name, 
    tc.constraint_name
FROM information_schema.table_constraints AS tc
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name LIKE '%_fkey'
ORDER BY tc.table_name;
```

You should see all the constraint names listed above.

