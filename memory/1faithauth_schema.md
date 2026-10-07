---
name: 1faithauth table schema
description: Schema for the 1faithauth table in the onefaith project — internal tool auth with admin-managed users
type: project
---

**Table name:** `1faithauth`

**Columns:**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, default `gen_random_uuid()` |
| `username` | VARCHAR | UNIQUE, NOT NULL — used for login |
| `password` | VARCHAR | Hashed with bcrypt |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `display_name` | VARCHAR | User's display name |
| `is_admin` | BOOLEAN | Default `false` — only the main admin account is true |
| `blocked` | BOOLEAN | Default `false` — blocks user from logging in |
| `is_logged_in` | BOOLEAN | Default `false` — tracks currently logged-in status (active/inactive) |

**Auth flow:**
- Admin creates users by inserting directly into `1faithauth` table
- Users can change their own username and password
- No email required — pure username + password auth
- Custom auth logic (not using Supabase Auth built-in), password hashing via bcryptjs

**Why not Supabase Auth:** Chose a fully custom table approach over Supabase's built-in auth.
