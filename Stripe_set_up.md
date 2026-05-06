# Stripe Set up

1. Model Your Products in Stripe
Before touching code, you need to define your tiers in the Stripe Dashboard.

* Products: Create a product for each tier (e.g., "Basic", "Pro", "Omenland Elite").

* Prices: Attach recurring prices to each product (e.g., $10/month vs $100/year).

* Metadata: Add a lookup_key or tier_id to your Stripe products so your app can easily identify which tier a user just bought.

2. Update your Database Schema (Supabase)
You need to store the relationship between your users and their subscriptions. Typically, you'll add a subscriptions table:

* `user_id` (foreign key to auth.users)

* `stripe_customer_id` (unique ID Stripe gives every user)

* `status` (active, trialing, canceled, past_due)

* `price_id` (the specific tier they are on)

3. Create a "Customer Portal" and "Checkout" Flow
In your Next.js app (perhaps in a new /billing route):

* Checkout: When a user clicks "Upgrade," your server-side action calls Stripe to create a Checkout Session. This redirects them to a Stripe-hosted payment page.

* Customer Portal: Stripe provides a pre-built portal where users can manage their credit cards, download invoices, or cancel their tiers. You just need to generate a link to it.

4. The Webhook Listener (Crucial Step)
This is where most people get stuck. Stripe needs a way to tell your app, "Hey, this user just paid!"

* Create a route at src/app/api/webhooks/stripe/route.ts.

* Stripe will send a POST request to this URL whenever a subscription is created, updated, or deleted.

* Your code listens for events like customer.subscription.created and updates the corresponding row in your Supabase subscriptions table.

5. Enforce Tiers in your Proxy/Middleware
Now that you have the subscription status in your database, you can enhance your proxy.ts logic.

* Current Logic: "Is the user logged in?"

* Tiered Logic: "Is the user logged in AND do they have an active status in the subscriptions table for the pro tier?"



## Stripe docs

### 1. The "Big Picture" Guide
**Stripe Billing & Subscriptions Overview**

**Why read this:** It explains the "Subscription Lifecycle" (Incomplete → Active → Past Due).

> **Key Concept:** Understand how a Subscription object relates to a Customer and a Price.

### 2. The Integration Guide (Checkout)
**Build a Subscriptions Integration**

**Why read this:** This is the "Step-by-Step" for your exact tech stack. It covers:

Creating a Checkout Session (redirecting users to Stripe's payment page).

Handling the Success/Cancel redirects back to your site.

Provisioning access (enabling the "Omenland" features) after payment.

### 3. The Webhook Guide (The "Sync" Logic)
**Webhooks for Subscription Events**

**Why read this:** This is how your Supabase database stays in sync with Stripe.

Key Events: You’ll need to listen for customer.subscription.created, customer.subscription.updated, and customer.subscription.deleted.

> **Next.js Tip** Refer to the Stripe Webhook Quickstart for the specific route.ts code needed to verify signatures in the App Router.

#### 4. The Self-Service Guide (Customer Portal)
**Integrate the Customer Portal**

**Why read this:** This saves you weeks of work. It allows you to generate a link where users can change their own tiers, update credit cards, or cancel subscriptions without you building a single UI component.















### Note on Auguries

#### Auguria Oblativa (Unsolicited Signs):
These were "offered" signs that occurred unexpectedly, such as a sudden thunderclap or a bird flying across one's path. Because they were unsought, they were often viewed with more urgency or seen as a direct warning or interruption from the divine.

#### Specific Classes of Auspices
The Augurs observed five distinct classes of signs:

* Ex caelo: Signs from the sky, most notably thunder and lightning.

* Ex avibus: Signs from birds, divided into those who provided omens through their voices (oscines, like ravens) and those who provided them through flight (alites, like eagles).

* Ex tripudiis: The behavior of the sacred chickens mentioned above.

* Ex quadrupedibus: Omens derived from the movements of four-legged animals.

* Ex diris: A general category for "dire" or unusual portents, such as sneezing, stumbling, or strange noises, which were usually considered ill-omened.

