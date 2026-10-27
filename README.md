# Tulika / তুলিকা — static boutique store

Plain HTML, CSS and JavaScript modules; no build step. Supabase provides shared products, categories, reviews, orders, image storage and admin authentication.

## 1. Create Supabase project and schema

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `schema.sql` first, then `seed.sql`.
3. Keep the project's **service_role** key private. It must never be copied into this site.
4. The SQL creates the public `product-images` storage bucket. Images are public for reading; upload and deletion policies require an admin account.

## 2. Create the first admin

1. In Supabase, open **Authentication → Users → Add user**. Create the owner's email/password. If the project requires email confirmation, confirm that account.
2. Copy the user's UUID from the Users list.
3. In SQL Editor, replace the example UUID and run:

   ```sql
   insert into public.admins(user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

4. Admin access is allowed only after Supabase Auth sign-in **and** a matching `admins.user_id` row. Do not expose a service key to add admins from the browser.

## 3. Configure the public browser key

Edit `config.js` and set:

```js
export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
export const WHATSAPP_PLACEHOLDER = "919876543210"; // REPLACE THIS
```

Find the URL and **anon / publishable** key in **Project Settings → API**. The anon key is designed to be public; row-level security is what protects data. Never paste the `service_role` / secret key here. Replace the WhatsApp placeholder with the shop's country-code number, digits only.

## 4. Run locally

ES modules and the Supabase CDN require HTTP(S), not `file://`. From this folder, run any static server, for example:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Configure `http://localhost:8000/**` in **Authentication → URL Configuration → Redirect URLs** for admin login.

## 5. Deploy static files

Deploy this folder as the static site root on Netlify, Cloudflare Pages, or GitHub Pages. No build command or output directory is needed. Add the deployed admin URL (for example `https://shop.example/admin.html`) and site origin to Supabase Auth redirect URLs. Keep `config.js` with the site files.

## Pages and files

- `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `order-done.html`, `track.html`
- `shipping.html`, `privacy.html`, `terms.html` — owner-editable policy placeholders; replace them with reviewed policies before launch.
- `admin.html` — Supabase Auth-gated owner dashboard.
- `assets/app.js`, `assets/admin.js`, `assets/i18n.js`, `assets/db.js`, `assets/store.css`
- `schema.sql`, `seed.sql`, `config.js`

The demo product images are inline SVG-style placeholders selected by the `demo-*.svg` paths in `seed.sql`; upload real photos in the admin. Seeded address, hours, prices, shipping, descriptions and reviews are example content: verify and edit before taking orders.

## Orders, inventory and payment notes

- The cart is local to the customer's browser. Opening checkout reloads visible products and sizes; placing an order calls `create_order` RPC, which locks and rechecks the stock rows, reads current prices and shipping settings, creates the order/items, and decrements inventory in one transaction. The browser does not submit prices or totals.
- Orders are not directly readable by anonymous clients. `track_order(order number, phone)` returns a minimal response only for a matching order and validated Indian phone.
- `create_order` has a basic per-phone order limit and a checkout honeypot. This helps reduce casual spam, but is not a full anti-bot/rate-limiting service. Add edge/server rate limiting if abuse occurs.
- Payment choices are Cash on Delivery and UPI with owner confirmation. No online payment is collected. The Razorpay integration point is marked in checkout; add a server-side payment/order verification flow before enabling it.
- Supabase Auth and RLS are mandatory for admin operations. Public clients use only the anon key. Review the policies and test them in a non-production project before launch.

## Owner checklist

- Edit shop name, tagline, about, address, phone, WhatsApp number, hours, shipping fees and hero text under **Admin → Settings**.
- Edit product stock **per size**; zero stock disables buying that size.
- Set Supabase production Auth email/redirect settings and choose a strong owner password.
- Review legal policies, shipping charges, inventory, privacy obligations and local tax/payment requirements before launch.
