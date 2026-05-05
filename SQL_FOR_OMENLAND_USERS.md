# SQL FOR USERS


### The public.profiles Table
In real-world apps, we create a separate table in the public schema to hold user details. This allows you to link users to posts, comments, or team memberships.

### Step A: Create the Table
Run this in your Supabase SQL Editor:

```sql
-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  phone_number text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);
```


### Automate the Sync from `auth` to `profile`
You don't want to manually create a profile row every time someone signs up. You can tell Supabase to do it automatically using a Trigger. 

This script watches the auth.users table and copies the name and avatar into your public.profiles table the moment they confirm their email.

```sql
-- 1. Create the function that the trigger will call
create or replace function public.handle_new_user() -- use public schema
returns trigger as $$ -- to be used with a trigger 
-- Everything inside $$ is the body of my function
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
```
### The trigger that will call `public.handle_new_user()`
```sql
create trigger on_auth_user_created  -- name of the trigger
  after insert on auth.users -- event to watch for
  for each row execute procedure public.handle_new_user(); -- for each new user created, do this
```

## The Workflow in Slow Motion
* The Event: A new user finishes signing up. Supabase inserts a row into auth.users.

* The Trigger Fires: The database sees the insert and says: "Aha! I have an AFTER INSERT trigger on this table. I must call the handle_new_user function now."

* The Function Runs: The function wakes up and looks at the new row. It sees the `raw_user_meta_data` column.

* The String Extracts: The code `new.raw_user_meta_data->>'full_name'` reaches into that row, pulls out the string "John Doe," and inserts it into your `public.profiles` table.

## Where can I view all the functions I've got?

1. Supabase UI
Database > Funcions 

2. SQL 
```sql
	SELECT 
	    n.nspname AS schema_name,
	    p.proname AS function_name,
	    pg_get_function_arguments(p.oid) AS arguments,
	    CASE WHEN p.prosecdef THEN 'Security Definer' ELSE 'Security Invoker' END AS security_type,
	    r.rolname AS owner,
	    l.lanname AS language
	FROM pg_proc p
	JOIN pg_namespace n ON n.oid = p.pronamespace
	JOIN pg_language l ON l.oid = p.prolang
	JOIN pg_roles r ON r.oid = p.proowner
	WHERE n.nspname IN ('public', 'auth', 'storage') -- Filter by your schemas
	ORDER BY schema_name, function_name;
```




### Security in Supabase is about Policies
Security in Supabase isn't about hiding the table; it's about the Policies attached to it.

Even though the table is in the public schema, a user can only update what your SQL policy explicitly allows.

> Supabase RLS, policies apply to the whole row for an UPDATE. 
To prevent a user from updating a specific column, you have two choices:

1. The insecure "Read-Only" Tier 
	You allow them to update their profile, but you simply don't include the tier column in your client-side update code. Since your RLS will verify that auth.uid() = id, they can only update their own row anyway.

2. The Robust Way - use a Trigger
	If you want to be 100% sure that even a "hacker" using the browser console can't change their tier, you use a Trigger to revert any unauthorized changes to that column.


### Update profiles Table to include `tier`
Set a default of 'free':

```sql
alter table public.profiles 
add column tier text default 'free' check (tier in ('free', 'pro', 'admin'));
```


### Add a trigger to revert unauthorized changes

```sql
-- This function ensures the tier stays the same during a user update
create or replace function public.preserve_tier()
returns trigger as $$
begin
  new.tier := old.tier; -- Overwrite whatever the user sent with the old value
  return new;
end;
$$ language plpgsql;

create trigger prevent_user_tier_update
  before update on public.profiles
  for each row
  execute procedure public.preserve_tier();
```


## What is PL/pgSQL?
PL/pgSQL stands for Procedural Language/PostgreSQL.

Standard SQL is great for fetching rows, but it struggles with complex logic—like an if/else statement or a for each loop. PL/pgSQL adds those "programming" features to your database.

#### The Key Ingredients:
* **Variables:** You can store values for later use in the function.
* **Control Structures:** IF, THEN, ELSE, and CASE.
* **Loops:** WHILE, FOR, and FOREACH.
* **Error Handling:** You can "catch" database errors so the whole app doesn't crash.


## Anatomy of a Function
Every time you run a script to create a function, it follows a very specific "recipe." 

Here is a breakdown of the user profiles function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() -- The name
RETURNS trigger -- What it returns (data, a boolean, or a 'trigger')
LANGUAGE plpgsql -- The language we are using
SECURITY DEFINER -- The "Superpower" setting (see below)
AS $$ -- Start of the code block
BEGIN -- Start of the logic
  -- This is the "How" logic
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  RETURN new; -- Triggers must return the 'new' row to proceed
END; -- End of the logic
$$; -- End of the code block
```


#### The "Security Definer" Secret
This is the most important concept for Supabase developers.

* Security Invoker (Default): The function runs with the permissions of the person calling it. If a user doesn't have permission to write to the profiles table, the function will fail.

* Security Definer: The function runs with the permissions of the person who created it (you, the Admin).

##### Why the security definer matters 
You want the `handle_new_user` function to have "God Mode" so it can create a profile row even if the user hasn't fully logged in yet or doesn't have RLS permissions yet.


#### Triggers: The Silent Watchers
A Trigger is just a "tripwire" that tells the database: "Whenever X happens, run Function Y."

##### For the profile updater function

* Event: A new row is added to `auth.users`.

* Tripwire: The Trigger catches the event.

* Action: It executes your `handle_new_user()` function.

The function uses the special keyword new to refer to the data that was just inserted (like the user's email and ID).



### new.raw_user_meta_data->>'full_name'
It's PostgreSQL Trigger syntax and JSONB navigation


## Adding SQL Check Constraints 
You can add rules to your `public.profiles` table to ensure, for example that names:
* are not too long
* are not empty
* don't contain suspicious characters.

```sql
ALTER TABLE public.profiles
ADD CONSTRAINT name_length_check 
CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 50),

ADD CONSTRAINT no_admin_impersonation 
CHECK (full_name !~* 'admin|superuser|support|root');
```
### You could go super strict
```sql
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS no_admin_impersonation; -- Clear the old one first

ALTER TABLE public.profiles
ADD CONSTRAINT clean_name_check 
CHECK (
  -- 1. No quotes (single or double)
  full_name !~ '[''"]' AND
  
  -- 2. No suspicious symbols (semicolons, dashes, etc)
  full_name !~ '[;--|/*|*/|#]' AND

  -- 3. No SQL keywords (wrapped in word boundaries \y to avoid blocking 'Victor')
  full_name !~* '\y(select|drop|delete|update|insert|into|table|from|where|union|grant)\y' AND

  -- 4. No admin impersonation
  full_name !~* '\y(admin|superuser|support|root|system|omenland)\y'
);
```


## Handling avatars
We are going to allow users to upload an avatar. This requires supabase storage, access contol on that storage and the stored URL of the pic to be inserted to public.profiles

##### Create the bucket

Supabase > Storage > Add Bucket > Name Bucket > Set as Public > Create


##### Protect the bucket
Add a policy to the `storage.objects` table.

```sql
	-- Allow users to upload an avatar to a folder named after their own ID
	CREATE POLICY "Users can upload their own avatar"
	ON storage.objects FOR INSERT
	TO authenticated
	WITH CHECK (
	  bucket_id = 'avatars' AND 
	  (storage.foldername(name))[1] = auth.uid()::text
	);

	-- Allow users to update/delete their own avatar
	CREATE POLICY "Users can update their own avatar"
	ON storage.objects FOR UPDATE/DELETE
	TO authenticated
	USING (
	  bucket_id = 'avatars' AND 
	  (storage.foldername(name))[1] = auth.uid()::text
);
```

##### Add SQL function that injects URL into profile

```sql
	create or replace function public.handle_storage_update()
	returns trigger
	language plpgsql
	security definer
	as $$
	declare
	  user_id uuid;
	  public_url text;
	begin
	  -- 1. Extract the User ID from the folder name (e.g., 'user-uuid/avatar.png')
	  -- We take the first part of the path
	  user_id := (storage.foldername(new.name))[1]::uuid;

	  -- 2. Construct the Public URL 
	  -- Replace 'your-project-id' with your actual project reference
	  public_url := 'https://dayjptytszrnudjdigvk.supabase.co/storage/v1/object/public/avatars/' || new.name;

	  -- 3. Update the profile
	  update public.profiles
	  set avatar_url = public_url,
	      updated_at = now()
	  where id = user_id;

	  return new;
	end;
	$$;
```

##### Trigger SQL function on upload to `avatars` bucket

```sql
create trigger on_avatar_upload
  after insert on storage.objects
  for each row
  when (new.bucket_id = 'avatars')
  execute procedure public.handle_storage_update();
```

##### Security issues?
Since this function uses security definer, it has the power to update any profile.

> The Guardrail: `(storage.foldername(new.name))[1]`

Because the Storage RLS (which we set up earlier) prevents `User A` from uploading to `User B`'s folder, the trigger will only ever receive a `new.name` that `User A` was authorized to create.


##### Limit INSERT image size

```sql
	-- Update your existing INSERT policy to include a size check
	-- 512000 bytes = 0.5 MB
	CREATE POLICY "Avatars are limited to 500kb"
	ON storage.objects FOR INSERT
	TO authenticated
	WITH CHECK (
	  bucket_id = 'avatars' AND 
	  (storage.foldername(name))[1] = auth.uid()::text AND
	  (metadata->>'size')::int <= 512000
);
```


## Updating a function
Here we update the post upload function so that it deletes any old avatar files when adding a new one
```sql
create or replace function public.handle_storage_update()
returns trigger
language plpgsql
security definer
as $$
declare
  user_id uuid;
  public_url text;
  file_size int;
begin
  -- 1. Metadata and ID extraction
  file_size := (new.metadata->>'size')::int;
  user_id := (storage.foldername(new.name))[1]::uuid;

  -- 2. Post-upload size check (the "Janitor" logic)
  if file_size > 512000 then
    delete from storage.objects where id = new.id;
    update public.profiles set avatar_url = null where id = user_id;
    return null; 
  end if;

  -- 3. DELETE OLD AVATARS
  -- We look for any file in the same folder that IS NOT the one we just uploaded
  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = user_id::text
    and id <> new.id; -- Don't delete the file we just uploaded!

  -- 4. Proceed with updating the profile link
  -- Replace 'your-project-id' with your actual project ref
  public_url := 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/' || new.name;

  update public.profiles
  set avatar_url = public_url,
      updated_at = now()
  where id = user_id;

  return new;
end;
$$;
```


























