/** Compact engineering notes and the data behind the Architecture Explorer. Both are shown inside each project's case study. */

export interface Study {
  id: string;
  projects: string[];          // Project.short values this note draws on
  title: string;
  tags: string[];
  context: string;             // the problem and the chosen approach, in two sentences
  mechanism: string[];         // how it works underneath (paragraphs)
  tradeoffs: string;
}

export const STUDIES: Study[] = [
  {
    id: 'oversell-xmin', projects: ['Shop'], tags: ['PostgreSQL', 'EF Core', 'Concurrency'],
    title: 'Stopping two checkouts from selling the last item',
    context: 'Two customers can check out the last unit at the same instant; each request reads stock = 1 and approves the sale, so a plain read-then-write sells it twice. Shop checks and decrements stock in one transaction and guards the product row with a PostgreSQL xmin concurrency token.',
    mechanism: [
      'xmin is a hidden column holding the ID of the transaction that wrote a row version. PostgreSQL\'s multiversion concurrency control writes a new row version on every UPDATE, so xmin changes on every committed update, which makes it a free version number. EF Core\'s Npgsql provider can use it as a concurrency token and appends it to the write: UPDATE products SET stock = @new WHERE id = @id AND xmin = @originalXmin.',
      'If another checkout committed first, xmin no longer matches, the statement affects zero rows, and EF Core throws DbUpdateConcurrencyException instead of overwriting. Because the stock change, the order and the price snapshot share one transaction, they commit together or not at all.',
    ],
    tradeoffs: 'Optimistic concurrency fails the loser, who must retry or be told the item sold out. That suits a small store; on a flash-sale hot row, an atomic UPDATE ... SET stock = stock - 1 WHERE stock >= 1 or SELECT ... FOR UPDATE serializes the work more predictably.',
  },
  {
    id: 'hybridcache-tags', projects: ['TMS'], tags: ['HybridCache', '.NET 10', 'Performance'],
    title: 'Caching course data without a stampede',
    context: 'Course data is read far more than it is written, but a naive cache stampedes when a hot entry expires (hundreds of requests run the same query) and serves stale data after a write. TMS uses HybridCache with tag invalidation.',
    mechanism: [
      'GetOrCreateAsync coalesces concurrent callers for the same key inside a process: one runs the factory against the database and the rest wait for its result, so an expiry costs one query instead of hundreds.',
      'Entries carry tags, such as "course data". A write calls RemoveByTagAsync; the cache records when the tag was invalidated, and any entry created before that moment counts as a miss on its next read. One call retires every related list and detail entry without the writer knowing their keys.',
    ],
    tradeoffs: 'Invalidation is coarse (one edit retires all course entries), stampede protection is per process, and a write path that forgets to invalidate serves stale data until the entry expires.',
  },
  {
    id: 'refresh-rotation', projects: ['TMS'], tags: ['JWT', 'Security', 'ASP.NET Core'],
    title: 'Short-lived access tokens with rotating refresh tokens',
    context: 'A JWT is verified by its signature, so it cannot be recalled once issued, and a long-lived leaked token stays valid. TMS pairs a short-lived access token with a refresh token that rotates on every use.',
    mechanism: [
      'The access token is self-contained: the API validates its signature and expiry and reads the claims with no database call, and its short life is the revocation mechanism. The refresh token is only presented to one endpoint and the server keeps a record of it; each refresh marks the presented token as spent and issues a new pair.',
      'Single use is what makes theft detectable: a spent token presented again means two parties hold the same credential, so the server can end the session. Without rotation, a copied refresh token would work silently, in parallel with the real one, until it expired.',
    ],
    tradeoffs: 'Rotation adds server state and a write per refresh, and two simultaneous refresh calls can look like theft, so the client must keep only one refresh in flight.',
  },
  {
    id: 'validation-pipeline', projects: ['TMS', 'SkillBridge'], tags: ['CQRS', 'MediatR', 'FluentValidation'],
    title: 'Validation that cannot be skipped',
    context: 'Hand-called validation is only as reliable as the least careful author, and every use case invents its own error shape. A FluentValidation pipeline behavior around each MediatR handler validates before the handler runs.',
    mechanism: [
      'A MediatR IPipelineBehavior<TRequest, TResponse> works like middleware: it receives the request and a next delegate and decides whether to call it. The container resolves every IValidator<TRequest> for that request type, so adding a validator class is enough to have it enforced; controllers and handlers do not change.',
      'If validation fails, the behavior throws without calling next, so the handler never executes for invalid input. Exception middleware maps the exception to an RFC 9457 ProblemDetails 400 listing the failing fields, which gives the Angular client one predictable error shape.',
    ],
    tradeoffs: 'Rules that need the database, such as uniqueness, belong in the handler or a database constraint, because two requests can both pass a check made before either writes. Validation covers the shape of input only; authorization is checked separately.',
  },
  {
    id: 'claims-identity', projects: ['PMAFS'], tags: ['Security', 'IDOR', 'ASP.NET Core'],
    title: 'Reading the user from claims, not from the URL',
    context: 'An endpoint like "orders for user 42" that trusts the 42 in the route lets any signed-in user read someone else\'s data (an insecure direct object reference). PMAFS reads the user from authenticated claims and scopes pharmacy staff to their own pharmacy.',
    mechanism: [
      'JWT bearer middleware verifies the token\'s signature and builds a ClaimsPrincipal from its claims. The signature covers them, so a client cannot alter them; a route segment or JSON field has no such protection. Handlers take "who am I" from the principal and ignore any caller-supplied identifier.',
      'For pharmacy-owned resources the handler also compares the resource\'s pharmacy with the pharmacy the user is authorized for. Role checks answer "may this kind of user call this endpoint"; the ownership check answers "may this user touch this record", which is the question IDOR gets wrong.',
    ],
    tradeoffs: 'Nothing in the framework forces the ownership check on each endpoint, so it needs discipline and tests that use the wrong user\'s ID. Claims also reflect the moment the token was issued, so revoked access lingers until the token expires.',
  },
  {
    id: 'haversine-search', projects: ['PMAFS'], tags: ['Algorithms', 'Search', 'PostgreSQL'],
    title: 'Ranking pharmacies by real distance',
    context: 'Patients need the nearest pharmacy with stock, not an alphabetical list. Searches match names case-insensitively and order results by Haversine distance from the user\'s coordinates.',
    mechanism: [
      'Latitude and longitude are angles on a sphere, so subtracting raw numbers is wrong: a degree of longitude shrinks away from the equator. Haversine gives the great-circle distance: a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2), then d = 2R · asin(√a) with R of about 6,371 km.',
      'The sine-squared form stays numerically stable over the short distances inside a city, where the law-of-cosines form loses precision. With a distance per candidate, ordering is a normal sort and the nearest in-stock pharmacy comes first.',
    ],
    tradeoffs: 'It assumes a perfect sphere (within about half a percent) and measures a straight line, not a route. It computes a distance for every candidate, which is fine at city size; a much larger dataset would need a spatial index such as PostGIS.',
  },
  {
    id: 'signalr-auth', projects: ['TMS'], tags: ['SignalR', 'WebSockets', 'Angular'],
    title: 'Pushing live updates to signed-in users',
    context: 'Training and enrollment status change while people watch the page, and polling wastes requests or makes users wait. TMS pushes updates over SignalR and applies them to the Angular store.',
    mechanism: [
      'SignalR keeps a long-lived connection, preferring WebSockets and falling back to server-sent events or long polling, so the server can message a user or group the moment a handler finishes. Browsers cannot set an Authorization header on a WebSocket handshake, so the access token travels as an access_token query value that the JWT bearer setup reads for hub paths.',
      'On the client, a message updates the NgRx SignalStore; because the app is zoneless and signal-driven, only the components that read the changed signal re-render.',
    ],
    tradeoffs: 'Open connections cost memory, several API instances need a backplane, query-string tokens must be kept out of logs, and the client has to reconnect when a short-lived token expires.',
  },
];

export const studiesFor = (short: string) => STUDIES.filter(s => s.projects.includes(short));
export const archFor = (short: string) => ARCHITECTURES.find(a => a.key === short);

/* ---------------- Architecture Explorer ---------------- */

export type Kind = 'client' | 'api' | 'app' | 'domain' | 'infra' | 'data' | 'realtime' | 'cache';

export interface ArchNode {
  id: string; label: string; sub: string;
  col: number; row: number;            // grid position: 4 columns x 3 rows
  kind: Kind; desc: string; tech: string[];
  study?: string;                      // Study.id to link to
}
export interface FlowStep { node: string; text: string }
export interface Flow { id: string; name: string; steps: FlowStep[] }
export interface Architecture {
  key: string; label: string; summary: string;
  nodes: ArchNode[]; edges: [string, string][]; flows: Flow[];
}

export const ARCHITECTURES: Architecture[] = [
  {
    key: 'TMS', label: 'TMS',
    summary: 'Training Management System: a layered ASP.NET Core 10 API with an Angular 22 client and PostgreSQL.',
    nodes: [
      { id: 'client', label: 'Angular client', sub: 'Zoneless · SignalStore', col: 0, row: 1, kind: 'client',
        desc: 'Zoneless Angular 22 client. Route guards decide who can open a page, a JWT interceptor attaches the access token to API calls, an error interceptor handles failures, and an NgRx SignalStore holds course and enrollment state.',
        tech: ['Angular 22', 'NgRx SignalStore', 'Guards', 'Interceptors'] },
      { id: 'api', label: 'API layer', sub: 'Versioned REST · auth', col: 1, row: 1, kind: 'api', study: 'refresh-rotation',
        desc: 'Versioned (v1/v2) REST controllers. Middleware applies login rate limiting and security headers, global exception handling returns RFC 9457 ProblemDetails, and JWT bearer auth with refresh-token rotation and resource-based policies protects the endpoints.',
        tech: ['ASP.NET Core 10', 'API versioning', 'Rate limiting', 'JWT'] },
      { id: 'app', label: 'Application', sub: 'CQRS · MediatR', col: 2, row: 1, kind: 'app', study: 'validation-pipeline',
        desc: 'Each use case is a MediatR command or query with its own handler. A FluentValidation pipeline behavior validates every request before its handler runs.',
        tech: ['MediatR', 'CQRS', 'FluentValidation'] },
      { id: 'domain', label: 'Domain', sub: 'Entities and rules', col: 2, row: 2, kind: 'domain',
        desc: 'The core model and business rules. It depends on nothing else, which is what Clean Architecture means in practice: UI and database changes do not reach it.',
        tech: ['Clean Architecture'] },
      { id: 'cache', label: 'HybridCache', sub: 'Tag invalidation', col: 2, row: 0, kind: 'cache', study: 'hybridcache-tags',
        desc: 'Frequently read course data is cached with HybridCache. Concurrent misses for one key are coalesced into a single query, and writes invalidate related entries by tag.',
        tech: ['HybridCache', 'Tags'] },
      { id: 'infra', label: 'Infrastructure', sub: 'EF Core · services', col: 3, row: 1, kind: 'infra',
        desc: 'Implements the interfaces the Application layer defines: EF Core repositories and DbContext for PostgreSQL, plus the services that depend on the outside world.',
        tech: ['EF Core', 'Npgsql'] },
      { id: 'db', label: 'PostgreSQL', sub: 'Relational store', col: 3, row: 2, kind: 'data',
        desc: 'Relational storage for courses, enrollments and users, accessed through EF Core.',
        tech: ['PostgreSQL'] },
      { id: 'workers', label: 'Background workers', sub: 'Enrollment · transcripts', col: 3, row: 0, kind: 'infra',
        desc: 'Background workers process enrollment and transcript work outside the request path.',
        tech: ['Hosted services'] },
      { id: 'hub', label: 'SignalR hub', sub: 'Real-time push', col: 1, row: 2, kind: 'realtime', study: 'signalr-auth',
        desc: 'Pushes training and enrollment notifications to signed-in users as changes happen, so the client does not have to refresh.',
        tech: ['SignalR', 'WebSockets'] },
    ],
    edges: [['client', 'api'], ['api', 'app'], ['app', 'domain'], ['app', 'cache'], ['cache', 'infra'], ['app', 'infra'], ['infra', 'db'], ['workers', 'infra'], ['app', 'hub'], ['hub', 'client']],
    flows: [
      { id: 'request', name: 'An authenticated request', steps: [
        { node: 'client', text: 'The JWT interceptor attaches the access token to the outgoing call.' },
        { node: 'api', text: 'Rate limiting and security-headers middleware run, the token is validated, and the request is routed to a versioned controller.' },
        { node: 'app', text: 'The controller sends a MediatR query. The validation behavior runs first; an invalid request stops here as a 400 ProblemDetails.' },
        { node: 'cache', text: 'HybridCache is asked for the data. A hit returns immediately; concurrent misses are coalesced into one load.' },
        { node: 'infra', text: 'On a miss, the EF Core repository builds and runs the query.' },
        { node: 'db', text: 'PostgreSQL returns the rows. The result flows back up, is cached with its tags, and reaches the client as JSON.' },
      ] },
      { id: 'live', name: 'A live update', steps: [
        { node: 'app', text: 'A command handler commits a change, such as an enrollment approval.' },
        { node: 'hub', text: 'The handler asks the SignalR hub to notify the affected users.' },
        { node: 'client', text: 'The client receives the message, updates its SignalStore, and only the components reading that state re-render.' },
      ] },
    ],
  },
  {
    key: 'PMAFS', label: 'PMAFS',
    summary: 'Pharmacy Medicine Availability Finder: Clean Architecture API with an Angular client and four role-specific areas.',
    nodes: [
      { id: 'client', label: 'Angular client', sub: 'Four role areas', col: 0, row: 1, kind: 'client',
        desc: 'Separate patient, pharmacy-staff, pharmacy-admin and system-admin areas, with role and pharmacy-scope route guards, a JWT interceptor and an NgRx SignalStore for session and inventory state.',
        tech: ['Angular 22', 'NgRx SignalStore', 'Route guards'] },
      { id: 'api', label: 'API layer', sub: '~120 REST endpoints', col: 1, row: 1, kind: 'api', study: 'claims-identity',
        desc: 'JWT auth with role-based and policy-based resource authorization. Token-bucket rate limiting on auth endpoints, request logging, security-headers middleware and an audit-logging action filter. The signed-in user is read from claims, not from route values.',
        tech: ['ASP.NET Core 10', 'JWT', 'Policies', 'Rate limiting'] },
      { id: 'app', label: 'Application', sub: 'Search · inventory', col: 2, row: 1, kind: 'app', study: 'haversine-search',
        desc: 'Use cases such as medicine search, which matches names case-insensitively and orders pharmacies by Haversine distance, and inventory changes with an approval workflow.',
        tech: ['Clean Architecture'] },
      { id: 'domain', label: 'Domain', sub: 'Pharmacies · medicines', col: 2, row: 2, kind: 'domain',
        desc: 'Pharmacy and medicine rules, plus a Location record (subcity, woreda, coordinates) used by location-aware search.',
        tech: ['Location', 'Roles'] },
      { id: 'infra', label: 'Infrastructure', sub: 'EF Core · SMTP', col: 3, row: 1, kind: 'infra',
        desc: 'EF Core on PostgreSQL, including the InventoryHistory table that records every price change, and SMTP-based account recovery.',
        tech: ['EF Core', 'SMTP'] },
      { id: 'db', label: 'PostgreSQL', sub: 'Inventory + history', col: 3, row: 2, kind: 'data',
        desc: 'Stores pharmacies, medicines, stock and the audit trail of price changes.',
        tech: ['PostgreSQL'] },
      { id: 'hub', label: 'SignalR', sub: 'Live updates, alerts', col: 1, row: 2, kind: 'realtime',
        desc: 'Live updates and in-app alerts pushed to the Angular client.',
        tech: ['SignalR'] },
    ],
    edges: [['client', 'api'], ['api', 'app'], ['app', 'domain'], ['app', 'infra'], ['infra', 'db'], ['app', 'hub'], ['hub', 'client']],
    flows: [
      { id: 'find', name: 'Find a medicine nearby', steps: [
        { node: 'client', text: 'A patient searches for a medicine. The JWT interceptor attaches their token.' },
        { node: 'api', text: 'The token is validated and the user is read from its claims. Nothing in the URL says who the caller is.' },
        { node: 'app', text: 'The search use case matches the medicine name case-insensitively and orders candidate pharmacies by Haversine distance from the patient\'s location.' },
        { node: 'infra', text: 'EF Core loads pharmacies, stock and prices for the matching medicine.' },
        { node: 'db', text: 'PostgreSQL returns the rows, and the nearest pharmacy with stock comes back first to the client.' },
      ] },
    ],
  },
  {
    key: 'Shop', label: 'Shop',
    summary: 'Online store: ASP.NET Core 8 API, React 18 client, PostgreSQL 16, run locally with Docker Compose.',
    nodes: [
      { id: 'client', label: 'React client', sub: 'Vite · React Router', col: 0, row: 1, kind: 'client',
        desc: 'React 18 client built with Vite. The cart persists in the browser, React Router handles pages, and the admin area manages products and orders.',
        tech: ['React 18', 'Vite', 'React Router'] },
      { id: 'api', label: 'API', sub: 'JWT · roles · Swagger', col: 1, row: 1, kind: 'api',
        desc: 'ASP.NET Core 8 REST API. JWT Bearer tokens with BCrypt-hashed passwords and Customer and Admin roles, DataAnnotations validation, ProblemDetails errors, and every endpoint documented in Swagger.',
        tech: ['ASP.NET Core 8', 'JWT', 'BCrypt', 'Swagger'] },
      { id: 'checkout', label: 'Checkout', sub: 'One transaction', col: 2, row: 1, kind: 'app', study: 'oversell-xmin',
        desc: 'Stock is checked and decremented in a single transaction, and the unit price is locked in at purchase time so later price edits never change past orders.',
        tech: ['Transactions'] },
      { id: 'ef', label: 'EF Core', sub: 'xmin concurrency', col: 3, row: 1, kind: 'infra', study: 'oversell-xmin',
        desc: 'EF Core 8 with a PostgreSQL xmin optimistic-concurrency token on products, so two simultaneous checkouts cannot both succeed for the last unit.',
        tech: ['EF Core 8', 'Npgsql', 'xmin'] },
      { id: 'db', label: 'PostgreSQL 16', sub: 'Seeded on first start', col: 3, row: 2, kind: 'data',
        desc: 'Relational storage. The API creates tables and seeds demo data on first start.',
        tech: ['PostgreSQL 16'] },
      { id: 'docker', label: 'Docker Compose', sub: 'One-command setup', col: 2, row: 2, kind: 'infra',
        desc: 'Docker Compose runs PostgreSQL, giving a one-command local setup.',
        tech: ['Docker Compose'] },
    ],
    edges: [['client', 'api'], ['api', 'checkout'], ['checkout', 'ef'], ['ef', 'db'], ['docker', 'db']],
    flows: [
      { id: 'checkout', name: 'Placing an order', steps: [
        { node: 'client', text: 'The customer checks out with a shipping address. The cart contents are sent with their JWT.' },
        { node: 'api', text: 'The token is validated, the customer role is checked, and DataAnnotations validation rejects malformed requests with ProblemDetails.' },
        { node: 'checkout', text: 'In one transaction the checkout verifies stock, decrements it, and copies the current unit price into the order.' },
        { node: 'ef', text: 'EF Core issues the product update with the xmin token. If another checkout got there first, zero rows match and the save fails instead of overselling.' },
        { node: 'db', text: 'PostgreSQL commits the order and the stock change together, or neither.' },
      ] },
    ],
  },
  {
    key: 'SkillBridge', label: 'SkillBridge',
    summary: 'Hackathon job marketplace by a team of six: backend on ASP.NET Core with CQRS, an Angular client built in parallel.',
    nodes: [
      { id: 'client', label: 'Angular client', sub: 'Candidate · company · admin', col: 0, row: 1, kind: 'client',
        desc: 'Candidate, company and admin areas built by the frontend developers in parallel with the backend, against an API contract agreed early.',
        tech: ['Angular 22'] },
      { id: 'api', label: 'API layer', sub: 'Identity · JWT · roles', col: 1, row: 1, kind: 'api',
        desc: 'ASP.NET Core Identity with JWT Bearer tokens and role-based authorization for Candidates, Employers and Admins, plus centralized exception middleware returning consistent API errors.',
        tech: ['ASP.NET Core Identity', 'JWT', 'Roles'] },
      { id: 'app', label: 'Application', sub: 'CQRS · MediatR', col: 2, row: 1, kind: 'app', study: 'validation-pipeline',
        desc: 'Each use case is a MediatR command and handler. A FluentValidation pipeline behavior validates every request before it reaches a handler.',
        tech: ['MediatR', 'FluentValidation'] },
      { id: 'domain', label: 'Domain', sub: 'Skills · jobs · applications', col: 2, row: 2, kind: 'domain',
        desc: 'A shared Skill entity linked to candidates and jobs through join tables enables skill-based matching. Jobs are soft-deleted with an IsDeleted flag to preserve related data.',
        tech: ['Many-to-many', 'Soft delete'] },
      { id: 'infra', label: 'Infrastructure', sub: 'EF Core', col: 3, row: 1, kind: 'infra',
        desc: 'EF Core persistence for the domain model.',
        tech: ['EF Core'] },
      { id: 'db', label: 'PostgreSQL', sub: 'Relational store', col: 3, row: 2, kind: 'data',
        desc: 'Stores users, jobs, skills and applications.',
        tech: ['PostgreSQL'] },
    ],
    edges: [['client', 'api'], ['api', 'app'], ['app', 'domain'], ['app', 'infra'], ['infra', 'db']],
    flows: [
      { id: 'apply', name: 'Applying for a job', steps: [
        { node: 'client', text: 'A candidate applies to a job from the candidate area.' },
        { node: 'api', text: 'The JWT is validated and the Candidate role is required for the endpoint.' },
        { node: 'app', text: 'The apply command is validated by the pipeline behavior, then handled.' },
        { node: 'domain', text: 'The application is tied to the candidate and the job, whose required skills come from the shared Skill records.' },
        { node: 'infra', text: 'EF Core saves the application.' },
        { node: 'db', text: 'PostgreSQL stores it, and the employer can then review and update its status.' },
      ] },
    ],
  },
];
