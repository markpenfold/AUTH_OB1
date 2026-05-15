# org_auth supabase project

db password: 59wyUH#EhL665F_

Auto RLS enabled on new tables in public schema.

## DB Setup
![Schema](/images/schema.png)

### auth.users

1. `auth.users.id` is the primary key of the auth.users table. 


### public.profiles


### public.accounts
> These are the entities which are billed via Stripe
Contains: 
* `stripe_customer_id`
* `stripe_subscription_id`
* `subscription_status`
* `is_personal`
* `id` -> `public.projects>account_id` and `public.memberships>account_id`


### public.memberships
> Who is a member of which account and what is their role?

Contains:
* account_id -> accounts.id
* user_id -> `auth.user.id` and `profiles.id`