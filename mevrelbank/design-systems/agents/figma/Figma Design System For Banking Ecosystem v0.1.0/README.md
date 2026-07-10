
  # Design System for Banking Ecosystem

  This is a code bundle for Design System for Banking Ecosystem. The original project is available at https://www.figma.com/design/jD8gFP3THkjr4wCfwKyotX/Design-System-for-Banking-Ecosystem.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Cloudflare D1 waitlist storage

  This site supports persisting waitlist submissions with Cloudflare D1 through Cloudflare Pages Functions.

  ### 1) Create and bind the D1 database

  ```bash
  npx wrangler d1 create mevrelbank-db
  ```

  Copy the returned `database_id` and set it in `wrangler.toml` (`database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"`).

  In Cloudflare Pages project settings, add a D1 binding:
  - Binding name: `DB`
  - Database: `mevrelbank-db`

  ### 2) Apply migration

  From this folder, run:

  ```bash
  npx wrangler d1 execute mevrelbank-db --file=migrations/0001_waitlist.sql
  ```

  ### 3) API endpoint

  Waitlist submissions are handled by Pages Functions at:
  - `POST /api/waitlist`

  The endpoint validates and stores:
  - `name`
  - `email`
  - `accountType` (`personal` or `business`)
  - `message` (optional)

  ### 4) Frontend behavior

  `/waitlist` submits directly to `/api/waitlist` and shows inline success/error states in the existing UI.
  