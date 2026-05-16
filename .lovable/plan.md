# Plan: Extindere CeFaci cu conturi Business

Păstrez complet designul actual (culori, tipografie, carduri, butoane, layout). Adaug doar funcționalitate nouă reutilizând componentele existente (`OfferCard`, `BottomNav`, butoane gradient, `card-gradient`, etc.).

## 1. Bază de date (SQL migration)

Fișier nou: `supabase-migration-v3-business.sql` (de rulat manual în SQL Editor).

```text
- ALTER profiles: + name, phone, city, zone, fcm_token, account_type_chosen bool
- ALTER app_role enum: adaugă 'business' (păstrez 'admin','user' ca 'client')
- CREATE TABLE businesses (owner_id → auth.users, business_name, category, description,
  phone, email, city, zone, address, lat, lng, logo_url, cover_image_url, opening_hours jsonb,
  website, social_links jsonb, is_approved bool default false, is_verified bool default false,
  subscription_plan text default 'free', subscription_status text default 'active',
  subscription_expires_at, rejection_reason, timestamps)
- ALTER offers: + business_id, old_price, new_price, discount_percent,
  start_date, end_date, target_type, target_city, target_zone, target_radius_km,
  status text default 'pending', rejection_reason, terms
- CREATE TABLE business_followers (user_id, business_id, unique)
- CREATE TABLE notifications (user_id, business_id, offer_id, title, body, image_url, type, is_read)
- CREATE TABLE offer_stats (offer_id PK, views, clicks, saves, calls, directions,
  notifications_sent, unique_users, conversion_rate)
- CREATE TABLE subscriptions (business_id, plan, status, price, started_at, expires_at,
  payment_provider, payment_id)
- RLS policies:
    businesses: owner full CRUD pe propriul rând; public SELECT doar dacă is_approved;
      admin full via has_role
    offers: business poate INSERT/UPDATE/DELETE doar pe business_id deținut;
      public SELECT doar status='active' AND end_date>=now(); admin full
    notifications/favorites: user vede doar ale lui
    offer_stats: SELECT pentru owner business + admin; INSERT/UPDATE prin RPC
    subscriptions: SELECT owner + admin; admin INSERT/UPDATE
- Funcții helper:
    is_business_owner(uid, business_id) SECURITY DEFINER
    increment_offer_stat(offer_id, field) SECURITY DEFINER
    expire_offers() — setează status='expired' unde end_date<now()
- Trigger pe profiles: la insert nou, account_type_chosen=false
```

## 2. Tipuri & utilitare

- `src/types/index.ts`: adaug `Business`, `Subscription`, `Notification`, `OfferStats`, `BusinessFollower`, extind `Offer` cu noile câmpuri (opționale pentru back-compat), `Role = 'client'|'business'|'admin'`, constante `PLANS` cu limitele.
- `src/lib/plans.ts`: definiție planuri + helper `canCreateOffer(plan, activeCount)`, `getPlanLimits(plan)`.
- `src/lib/businessApi.ts`: helpere CRUD pentru business/offers/stats.

## 3. Flow alegere cont

- `src/pages/ChooseAccountType.tsx`: ecran „Cum vrei să folosești CeFaci?" cu 2 carduri (Client / Business) în stilul `card-gradient` existent. Salvează `role` în `profiles` + `account_type_chosen=true`.
- În `AuthContext`: după login, dacă `account_type_chosen=false` → redirect la `/choose-account`.
- `App.tsx`: rută nouă `/choose-account`; logică redirect post-login pe baza rolului (`client→/`, `business→/business`, `admin→/admin`).

## 4. Zonă Business (rute noi sub `/business/*`)

Componenta `BusinessRoute` (gardă pe rol). `BusinessBottomNav` reutilizând stilul `BottomNav` existent (Dashboard, Oferte, Creează, Statistici, Profil).

Pagini noi:
- `pages/business/BusinessDashboard.tsx` — KPI cards (Oferte active, Views, Clicks, Clienți unici, Notificări trimise, Conversii) + butoane spre celelalte ecrane.
- `pages/business/BusinessProfile.tsx` — formular complet (`AdminOfferForm`-style). Banner „În verificare" dacă `!is_approved`.
- `pages/business/Plans.tsx` — 4 carduri planuri (Free/Basic/Pro/Premium), Pro marcat „Recomandat". Buton „Alege" (deocamdată setează planul pe business prin RPC sau apel direct dacă userul e propriul owner — pentru MVP marchez ca `pending` și anunț că admin confirmă; nu integrez Stripe acum).
- `pages/business/CreateOffer.tsx` — formular complet cu calcul `discountPercent` live, validări, alegere `target_type`, preview folosind `OfferCard` existent. La submit: status `pending` (sau `active` dacă admin) → trigger notificări (vezi 6).
- `pages/business/MyOffers.tsx` — taburi Active/Pending/Expirate/Respinse/Draft, fiecare item folosește `OfferCard` + acțiuni Edit / Stats / Dezactivează.
- `pages/business/OfferStats.tsx` — afișează `offer_stats` în carduri (fără librărie nouă de grafice — folosesc bare simple cu div-uri în stilul existent).
- `pages/business/Subscription.tsx` — plan curent, limite, usage, butoane Schimbă/Upgrade → `/business/plans`.
- `components/UpgradeModal.tsx` — popup „Ai nevoie de un plan mai mare".

## 5. Admin (extensii peste `Admin.tsx` existent)

Adaug tab-uri în `AdminDashboard`:
- Business-uri pending (aprobă / respinge cu motiv / marchează verificat / schimbă plan)
- Oferte pending (aprobă → declanșează notificări / respinge cu motiv)
- Listă completă business-uri, utilizatori, abonamente
- KPI generale (utilizatori, business-uri, oferte active/pending, venit estimat din `subscriptions.price` active)

Componente: `components/admin/BusinessModeration.tsx`, `OfferModeration.tsx`, `BusinessesList.tsx`, `UsersList.tsx`, `SubscriptionsList.tsx`.

## 6. Notificări & statistici

- `src/lib/notifications.ts`: `dispatchOfferNotifications(offer)` — la activare ofertă, query users după target_type/city/zone/category/followers, insert bulk în `notifications`, increment `offer_stats.notifications_sent`. Push real FCM rămâne pe sistemul existent (`PushModal`) — pregătesc structura, fără integrare nouă.
- `src/lib/analytics.ts` (extind): `trackOfferView/Click/Save/Call/Directions` → apel RPC `increment_offer_stat`.
- `OfferCard` / `OfferDetails`: apel tracking pe view/click/save/call/directions (fără modificări vizuale).
- `pages/Notifications.tsx` (opțional MVP): listă pentru client. Adaug clopoțel discret în header existent dacă e simplu.

## 7. Feed client

`pages/Home.tsx`: filtrul existent rămâne identic vizual; query-ul adaugă `status='active' AND end_date>=now()` și sortare cu `is_promoted` apoi `created_at`. Compatibil cu ofertele vechi (status null tratat ca active).

## 8. Protecții & gărzi rute

- `ClientRoute`, `BusinessRoute`, `AdminRoute` — verificare rol via `useAuth`.
- Redirect automat: business neaprobat care intră la „Creează ofertă" → mesaj + buton spre profil.
- Buton blocat dacă limita planului atinsă → `UpgradeModal`.

## 9. Detalii tehnice

- Folosesc clasele existente: `card-gradient`, `bg-gradient-primary`, `shadow-neon`, `text-gradient`, `rounded-2xl`, etc.
- Fără librării noi.
- Toate textele în RO (cu chei adăugate în `translations` unde merită).
- Compatibilitate înapoi: ofertele vechi fără `status`/`business_id` se afișează în continuare (fallback `status ?? 'active'`).

## 10. Livrabile

1. `supabase-migration-v3-business.sql` (de rulat de utilizator)
2. ~20 fișiere noi (pages business + componente admin + libs)
3. Edits minime: `App.tsx`, `AuthContext.tsx`, `types/index.ts`, `Home.tsx`, `OfferCard.tsx`, `OfferDetails.tsx`, `Admin.tsx`, `BottomNav.tsx` (link condiționat pe rol).

## Confirmare

Confirmi planul ca să încep implementarea? Având în vedere amploarea, voi livra Prioritatea 1 integral într-o iterație, apoi Prioritatea 2 (notificări auto, stats, followers, expirare, limite) într-o a doua iterație, iar Prioritatea 3 (plăți reale, grafice avansate) ulterior la cerere.
