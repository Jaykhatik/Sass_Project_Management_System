# Phase 12: Stripe Billing & Subscriptions Guide

This document explains exactly how the billing system works in this SaaS Project Management System, how to test it from start to finish, and how the logic handles upgrades and cancellations.

## 1. Setting Up Your Stripe Keys (Test Mode)
Before testing the UI, you need to connect the app to a safe Stripe sandbox environment so no real money is ever charged.

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com/) and create a free Stripe account.
2. In the top right corner of the dashboard, toggle **Test Mode** ON.
3. Look at the bottom left corner and click **Developers**.
4. Go to the **API keys** tab, click **Reveal test key**, and copy the Secret Key (it starts with `sk_test_...`).
5. Paste this key into your `.env` file under `STRIPE_SECRET_KEY`.

## 2. Creating the "Pro Plan" Product
1. On the left sidebar of the Stripe dashboard, click **Product catalog** -> **Add product**.
2. Name the product **"Pro Plan"**.
3. Under Pricing, set the price (e.g., `$10.00`) and ensure it is set to **Recurring** (Monthly).
4. Click **Save product**.
5. Once saved, look under the "Pricing" section for that product. Go to the far right, click the three dots (`...`), and select **Copy price ID** (it starts with `price_...`).
6. Paste this ID into your `.env` file under `STRIPE_PRO_PRICE_ID`.

## 3. Starting the Webhook Listener
Stripe needs a way to securely tell your app when a user successfully pays. We use the Stripe CLI for local testing.

1. Open a PowerShell terminal in your project folder and run this command to instantly download and extract the Stripe CLI:
   ```powershell
   Invoke-WebRequest -Uri "https://github.com/stripe/stripe-cli/releases/download/v1.20.0/stripe_1.20.0_windows_x86_64.zip" -OutFile "stripe.zip"; Expand-Archive -Path "stripe.zip" -DestinationPath "."; Remove-Item "stripe.zip"
   ```
2. Open your terminal and log in by running:
   ```powershell
   ./stripe.exe login
   ```
   *(Press Enter to open your browser and click "Allow access").*
3. Once logged in, run the listener to catch payments:
   ```powershell
   ./stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The terminal will print a Webhook Signing Secret (it starts with `whsec_...`). Copy it and paste it into your `.env` file under `STRIPE_WEBHOOK_SECRET`.
5. **Leave this terminal running in the background!**

## 4. Testing the "Free Tier" Guardrails
Now that the backend is set up, test the free tier limits in the browser:
1. Go to your app (`localhost:3000`) and open the **Projects** page.
2. Create projects until you have more than 3. On the 4th attempt, the app will block you with an error.
3. Open the **Members** page and try to invite more than 5 members. The app will block you.

## 5. The Checkout Flow (Upgrading to Pro)
1. In the sidebar, click the **Billing** tab (Credit Card icon).
2. You will see your Usage Meters are glowing red because you hit the Free limits.
3. Click the blue **"Upgrade to Pro"** button.
4. You will be smoothly teleported to Stripe's secure checkout page.
5. Use Stripe's magic test credit card: Type `4242` repeatedly until the card number, expiration date, and CVC are filled out. Use any fake email and name.
6. Click **Subscribe / Pay**.

## 6. Success & The Pro Experience
1. After paying, Stripe will automatically redirect you back to your Billing page.
2. You will see a green success banner!
3. Behind the scenes, your running `stripe.exe` terminal caught the payment and updated your database. 
4. The page will now proudly display **PRO ACTIVE**.
5. Your red usage meters are gone, and the limits now simply say **Unlimited**. You can create as many projects as you want!

---

## Frequently Asked Questions

### How do I download Invoices & Bills?
Stripe handles all invoices automatically. 
If a user wants to download their PDF invoice:
1. They go to your Billing page and click **"Manage Subscription"**.
2. This opens the secure Stripe Customer Portal.
3. They scroll down to **Invoice History**, click on their payment, and download the PDF.
*(You can also go to your Stripe Dashboard Settings -> Billing -> Customer Emails to tell Stripe to automatically email them the invoice the second they pay!).*

### What happens if a user Cancels their subscription?
1. The user clicks **"Manage Subscription"** and clicks "Cancel" in the Stripe Portal.
2. Stripe instantly fires a Webhook to your app.
3. Your app's database changes their plan from `"pro"` back to `"free"`.
4. The user's previously created projects are safe, but the strict Free limits (3 projects, 5 members) instantly kick back in, preventing them from making any new ones until they upgrade again.

### What happens if the same user decides to Upgrade again later?
The backend remembers them!
1. The code looks up their existing `stripeCustomerId` in the database.
2. Instead of making a messy duplicate account, it generates a checkout session for that exact same customer.
3. When they pay, the Webhook instantly unlocks their account again. Their entire billing history stays cleanly organized under a single profile in your Stripe Dashboard.

### Is the Pro Plan Monthly, Yearly, or Lifetime?
It is completely controlled by you in the Stripe Dashboard!
When you create a Product in Stripe, you can set the pricing to **Recurring** (Monthly/Yearly). Stripe will then automatically charge the user's card every month. If their card fails or they stop paying, Stripe automatically fires a Webhook to our app to instantly downgrade them to the Free plan. Because our code uses `mode: "subscription"`, it is perfectly optimized for monthly/yearly recurring revenue.

### How long does Test Mode last?
Test Mode is completely free and lasts for a **lifetime**. You can make a million fake transactions without ever being charged. When you are ready to launch your business for real, you just flip the "Test Mode" toggle off in your Stripe Dashboard and swap the keys in your `.env` file!

---

## 7. Daily Development (How to run the app the next day)
If you close VS Code and come back to work on your project the next day, here is exactly how to start everything back up so billing continues to work locally:

1. **Start your Next.js Server:**
   Open a terminal and run your normal command:
   ```bash
   npm run dev
   ```
2. **Start the Stripe Listener:**
   Open a *second* terminal window and run your listener command:
   ```powershell
   ./stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   *Note: If the terminal says your login expired (which only happens every 90 days), just run `./stripe.exe login` first, and then run the listen command again.*

That's it! As long as those two terminals are running, your app and your billing system are fully connected.
