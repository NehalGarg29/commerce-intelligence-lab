# MASTER IMPLEMENTATION PROMPT
## Commerce Intelligence Lab — Shopify-First Authentication, Role-Based Portals & AI Intelligence

You are acting as a senior full-stack engineer, Shopify solutions architect, and product designer.

We have an EXISTING deployed application:

**https://commerce-intelligence-lab.vercel.app/**

This is Commerce Intelligence Lab, a headless e-commerce platform built using Next.js, React, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, Shopify APIs, and Anthropic Claude.

Your task is to **extend the existing application**, not create another application or redesign the entire website.

The primary goal is to create a professional Shopify-first platform with three user experiences:

1. Direct Consumers
2. Verified Retail Partners
3. Internal Team Members

It must also incorporate the planned Product Feedback Intelligence, AI Retailer Marketing Assistant, and enhanced Insights dashboards.

**MOST IMPORTANT: SHOPIFY MUST REMAIN THE PRIMARY COMMERCE SYSTEM.**

---

# PHASE 0 — INSPECT THE EXISTING PROJECT

Before writing any code:

1. Inspect the complete repository structure.
2. Identify existing Shopify Storefront and Admin GraphQL integrations.
3. Inspect current authentication, retailer access, merchant access, and API authorization.
4. Inspect the Prisma schema and existing PostgreSQL tables.
5. Identify the AI advisor, ERP simulator, B2B ordering, analytics, and reviews implementations.
6. Identify the current design system, reusable components, navigation, and styling.
7. Check Shopify API versions and supported authentication methods against current official documentation.
8. Determine which features can be implemented with the current Shopify development store and credentials.

Produce a concise implementation plan identifying what already exists, what needs modification, and what needs to be added.

Do not claim an integration is working unless it has been tested.

Do not replace working features unnecessarily.

Preserve the current application routes, Shopify configuration, database data, and deployment.

# PHASE 1 — SHOPIFY-FIRST ARCHITECTURE

Follow these ownership boundaries.

### Shopify owns:

- Products and product variants
- Product availability and inventory
- Product pricing and discounts
- Customer identities and customer accounts
- Shopify B2B companies, contacts, catalogs, and price lists
- Customer orders and checkout
- Carts and applicable discount calculations
- Draft orders, payment terms, and fulfillment-related commerce data

### PostgreSQL owns:

- Internal employee permissions where not provided by an existing identity provider
- Explicitly consented customer preferences, linked to Shopify customer IDs
- Application-specific AI intelligence and review analysis
- Anonymous or appropriately consented analytics
- Simulated ERP warehouse state
- AI generation records and approval status where appropriate
- Audit logs for sensitive internal actions

Do not duplicate Shopify customer, order, or pricing records as independent sources of truth.

If local projections or cached records are required, link them to Shopify IDs and document synchronization and invalidation.

Use supported Shopify APIs and authentication flows.

Use the Storefront API for permitted storefront operations, the Customer Account API for supported customer identity/account operations, and appropriately scoped Admin APIs for authorized server-side administrative actions.

Never expose Shopify Admin API credentials to the browser.

# PHASE 2 — PUBLIC CONSUMER STOREFRONT

The existing homepage must remain publicly accessible.

Do not introduce a mandatory login screen when someone visits the website.

Visitors must be able to:

- Browse product collections.
- Open product detail pages.
- Use the existing AI shopping advisor.
- Compare products.
- Build product bundles.
- Add products to the cart.
- Proceed toward Shopify checkout.

### Consumer authentication

At the checkout transition, present a lightweight account option:

**Welcome back**

"Sign in to save your preferences and enjoy a more personalized shopping experience."

Actions:

- Sign In
- Create Account
- Continue as Guest

Use Shopify-supported customer authentication.

Do not collect or store Shopify account passwords in our own PostgreSQL database.

Preserve guest checkout where supported by the Shopify store configuration.

The account prompt must not block checkout or interfere with the existing cart.

### Customer account area

Add a `/account` area accessible to authenticated customers.

Design sections:

- Account overview
- Order history from Shopify
- Saved products
- My preferences
- Personalized recommendations
- Privacy and personalization settings

Use Shopify as the source for real orders and customer identity.

If a capability is unavailable in the current development store, provide an explicitly labeled demonstration state rather than fabricated real customer data.

# PHASE 3 — PERSONALIZED AI SHOPPING

Extend the existing Claude-powered shopping advisor.

For guests, continue using the current question and live Shopify catalog data.

For authenticated customers who opt into personalization, retrieve permitted preferences from PostgreSQL and combine them with the current request.

Example preference attributes:

- Preferred price range
- Product features
- Saved product IDs
- Explicitly selected interests
- Opted-in recommendation preferences

Do not store intimate or sensitive conversational details by default.

Provide clear opt-in, opt-out, view, and deletion controls.

### AI workflow

1. Authenticate the user when applicable.
2. Verify personalization consent.
3. Retrieve the minimum relevant preference context.
4. Accept the current shopping question.
5. Allow Claude to request approved product-search tools.
6. Fetch authoritative product and variant data from Shopify.
7. Apply deterministic stock, price, and compatibility checks.
8. Generate a recommendation grounded in the validated products.
9. Return recommendations with real Shopify product links.

Do not retrain the model on individual customer activity.

Use contextual personalization.

Preserve existing fallback behavior when Claude is unavailable.

# PHASE 4 — VERIFIED RETAIL PARTNER PORTAL

Preserve and enhance the existing `/retail` experience.

Retailers must authenticate before seeing wholesale prices, contract terms, or company-specific data.

Use Shopify B2B customer/company authentication and authorization where supported.

### Retailer access

Provide:

- Retail Partner Login
- Apply for Wholesale Access

The application form collects basic business information, but submitting an application must not automatically grant B2B privileges.

Approval must be performed by an authorized administrator.

Once authenticated, the backend must verify the retailer's Shopify company/contact relationship and applicable company location.

Never trust a company ID supplied only by the browser.

### Retailer dashboard

Display:

- Company name
- Approved wholesale catalog
- Company-specific pricing
- Retailer discount tiers
- Suggested retail margin where applicable
- Bulk ordering
- Suggested assortments
- Order history
- Purchase order references
- Payment terms where available
- Marketing resources

Use Shopify's B2B pricing and catalog capabilities as the authority.

Do not calculate a separate wholesale price that conflicts with Shopify.

Existing shelf kits, volume incentives, freight thresholds, and draft-order workflows should remain intact.

Where a promotional rule exists only in the prototype, label it clearly and do not imply Shopify is enforcing it.

# PHASE 5 — INTERNAL TEAM AUTHENTICATION

Create a protected `/team` experience.

Internal employees must authenticate before accessing any internal dashboard.

Internal accounts must be invitation-only.

Do not allow public visitors to select an employee role during registration.

Use an established authentication solution or existing organization identity provider, not custom password storage.

### Roles

Support:

- DESIGN
- MARKETING
- OPERATIONS
- ADMIN

A user may have multiple roles or explicit permissions.

Implement server-side RBAC with a centralized authorization helper.

### Permission model

DESIGN:

- Read Product Feedback Intelligence
- View approved customer-feedback themes
- Create and review product improvement ideas
- Access relevant product-level insights

MARKETING:

- Use AI Marketing Assistant
- Access approved marketing resources
- View campaign-related analytics
- Draft and approve marketing content according to permissions

OPERATIONS:

- Access ERP reconciliation
- View inventory discrepancies
- Perform authorized inventory sync operations
- Manage applicable retailer order workflows

ADMIN:

- Access all internal modules
- Invite and deactivate employees
- Assign permissions
- View audit logs

Authorization must be enforced inside backend handlers and service functions, not only in the frontend navigation.

A user without ERP permissions must receive an authorization error even when directly calling an ERP API.

Apply least-privilege Shopify API scopes and record sensitive mutations.

# PHASE 6 — INTERNAL TEAM DASHBOARD

Create a polished dashboard at `/team`.

Use the application's existing premium visual identity.

The dashboard should display only the modules permitted for the authenticated employee.

Suggested navigation:

- Overview
- Product Intelligence
- Marketing Assistant
- Commerce Insights
- Retail Operations
- ERP & Inventory
- Team Management (Admin only)

For each employee, display:

"Welcome back"

"Your workspace"

"Your access"

Show role-specific cards rather than displaying every feature to everyone.

Provide useful empty states and clear explanations of inaccessible functionality.

# PHASE 7 — AI PRODUCT FEEDBACK INTELLIGENCE

Add `/team/product-intelligence`.

This is particularly important for a Chief Design Officer.

Reuse the existing review data and product catalog.

The system should:

1. Retrieve available product feedback.
2. Associate feedback with Shopify product IDs.
3. Analyze review themes using Claude.
4. Identify recurring positive attributes.
5. Identify recurring complaints.
6. Suggest possible product improvement opportunities.
7. Show supporting review evidence.
8. Allow a team member to mark an insight as reviewed or accepted.

Example:

Product: Demo Rechargeable Product

Positive theme: Quiet operation

Negative theme: Battery duration

Potential opportunity: Investigate longer battery life.

Every insight must be traceable to source feedback.

Do not present AI-generated suggestions as verified customer facts.

Clearly distinguish fictional demonstration reviews from real customer reviews.

Use deterministic aggregation for counts and percentages; use Claude for semantic theme extraction and summaries.

Include filters by product, category, date, and sentiment where data supports them.

# PHASE 8 — AI RETAILER MARKETING ASSISTANT

Add `/team/marketing-assistant`.

Marketing employees should be able to select:

- Shopify product
- Target audience
- Campaign type
- Brand tone
- Channel

Supported draft outputs:

- Product launch descriptions
- Retailer sell-sheet copy
- Email campaign copy
- Social media captions
- Product highlights
- Short retailer promotional messaging

Ground generated content in Shopify product attributes, approved marketing information, and explicitly permitted review insights.

Do not invent performance statistics, customer testimonials, product claims, or discounts.

Clearly label all generated content as drafts requiring human approval.

Provide editing, regeneration, and copy functionality.

Maintain brand-specific tone configuration.

Avoid automatic publication to live Shopify product pages without a separate authorized approval workflow.

# PHASE 9 — ENHANCED INSIGHTS DASHBOARD

Extend the existing `/insights` functionality without deleting current analytics.

For internal employees, create a role-appropriate commerce intelligence view.

Include:

- Storefront funnel
- Product discovery interactions
- AI advisor engagement
- Bundle interaction
- Add-to-cart activity
- Retailer order activity
- Product feedback trends
- Suggested business opportunities

Distinguish clearly between:

- Real recorded activity
- Seeded demo events
- Estimated or hypothetical improvements

Never display invented conversion improvements as actual business results.

Where metrics are insufficient, show "Not enough data" rather than fabricating conclusions.

AI can summarize observed trends, but quantitative metrics must be calculated by code.

# PHASE 10 — ERP AND INVENTORY

Preserve the existing ERP simulator and Shopify inventory synchronization demonstration.

Do not replace the simulated ERP with a fake SAP integration.

Continue to clearly label warehouse data as simulated.

Restrict ERP write operations to authorized Operations or Admin users.

Before any inventory mutation:

- Verify the authenticated employee.
- Verify permission.
- Validate Shopify inventory item and location IDs.
- Validate requested quantities.
- Check for stale inventory where supported.
- Require explicit confirmation for consequential changes.
- Record an audit entry.
- Return a meaningful success or error response.

Explain in documentation how a real SAP or NetSuite integration could replace the simulator using supported middleware and reconciliation workflows.

# PHASE 11 — VISUAL DESIGN REQUIREMENTS

Preserve the current premium purple, mauve, cream, and white visual identity.

Do not replace the consumer homepage with an enterprise dashboard.

### Consumer experience

- Premium storefront first
- Small account icon in header
- Minimal checkout sign-in prompt
- Personalized account page
- Existing AI advisor remains accessible

### Retailer experience

- Professional wholesale portal
- Company identity clearly displayed
- Wholesale pricing and incentives emphasized
- Order management and marketing resources visible

### Internal team experience

- Left navigation sidebar
- Dashboard overview cards
- Role and access indicators
- Product intelligence charts
- Marketing generation workspace
- Inventory and commerce analytics

Use existing design components wherever possible.

Ensure responsive desktop, tablet, and mobile layouts.

Avoid fake functionality: visible buttons must work, be explicitly disabled, or be clearly marked as demo-only.

# PHASE 12 — SECURITY AND DATA PRIVACY

Implement:

- Server-side authentication checks
- Centralized permission validation
- Retailer company-level data isolation
- Secure session management
- CSRF protections where applicable
- Rate limiting for sensitive endpoints
- Secure environment-variable handling
- Minimal customer data retention
- Privacy controls for personalization
- Audit logs for privileged actions
- Validation of AI tool inputs and outputs

Never expose customer-specific information through shared caches.

Never allow client-provided role values to grant privileges.

Never grant internal or retailer access through an unverified demo login in production.

For development demonstrations, use explicitly labeled demo modes with safe mock identities and no production privileges.

# PHASE 13 — TESTING

Add automated tests for critical workflows.

At minimum:

1. Guest can browse storefront.
2. Guest can add products to cart.
3. Guest checkout remains available where Shopify supports it.
4. Authenticated consumer sees only their own account information.
5. Retailer cannot access another company's data.
6. Retailer cannot access internal team APIs.
7. Design employee cannot update inventory.
8. Marketing employee cannot access admin user management.
9. Operations employee can access authorized ERP actions.
10. Unauthorized inventory writes are rejected.
11. AI recommendations cannot expose nonexistent products.
12. Invalid prices and out-of-stock products are rejected.
13. Personalization respects consent.
14. Existing storefront, bundles, and retailer workflows continue working.

Use the repository's existing test tooling where possible.

# PHASE 14 — DEPLOYMENT AND DELIVERY

Keep the existing Vercel deployment.

Do not create a new application or separate repository.

Use safe database migrations.

Document required Shopify settings, scopes, callback URLs, credentials, and configuration steps.

Do not print secrets.

If Shopify setup requires manual actions, explain them precisely and do not silently substitute mocked production behavior.

Before finishing:

- Run type checking.
- Run linting.
- Run tests.
- Verify production build.
- Verify protected routes.
- Verify existing commerce workflows.
- Document known limitations.

Provide a final summary containing:

1. Files changed.
2. Database changes.
3. Shopify APIs and authentication methods used.
4. Completed functionality.
5. Features requiring manual Shopify setup.
6. Tests and their results.
7. Known limitations.
8. Steps for local verification and deployment.

## EXECUTION PRIORITY

Implement in this order:

**Priority 1:** Authentication architecture, consumer account flow, retailer authentication, internal employee access and permissions.

**Priority 2:** Internal Team Dashboard and navigation.

**Priority 3:** Product Feedback Intelligence.

**Priority 4:** AI Retailer Marketing Assistant.

**Priority 5:** Enhanced Insights and personalization improvements.

Complete and validate one vertical slice before moving to the next.

Do not make large unrelated refactors.

Do not overwrite existing working code merely to match a mockup.

When a feature depends on unavailable Shopify capabilities, explain the limitation and implement only a clearly labeled, safe development demonstration where appropriate.

The final application must feel like one integrated, Shopify-powered commerce platform—not several disconnected prototypes.

Start by auditing the repository and producing the implementation plan. Then proceed incrementally.