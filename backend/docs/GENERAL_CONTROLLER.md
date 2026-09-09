# GeneralController

> Base CRUD controller for the Shortlinks backend.
> Implements the **Template Method** pattern: orchestration lives here, domain logic lives in the model.

---

## Why

Every controller in the project — register, login, shortlinks, etc. — answers the same four questions:

1. What data is in the request? (`extract`)
2. Is it valid? (`validate`)
3. What does the *ready-to-store* shape look like? (`build`)
4. What does the *public* shape look like? (`toResponse`)

We extracted that pipeline into `GeneralController` so each entity only has to provide a model and a Mongo collection. The four steps stay identical across the codebase, which means:

- Reviews stay fast (you already know the shape of any controller).
- The pipeline is one place to harden (rate limits, ownership checks, async handling).
- New entities take a handful of lines.

---

## The pipeline

```
                       ┌──────────────────────────────────────┐
                       │        GeneralController             │
                       │  (create / update / show / delete)   │
                       └──────────────┬───────────────────────┘
                                      │ delegates to
                                      ▼
                       ┌──────────────────────────────────────┐
                       │         IBaseModel<TInput, TDoc>     │
                       │                                      │
                       │  extractFromRequest(req)             │
                       │           │                          │
                       │           ▼                          │
                       │  validate(input)                      │
                       │           │                          │
                       │           ▼                          │
                       │  build(input)                         │  ← can be async
                       │           │                          │
                       │           ▼                          │
                       │  toResponse(doc)                      │  ← receives WithId<TDoc>
                       └──────────────┬───────────────────────┘
                                      │ persists via
                                      ▼
                              ┌──────────────┐
                              │  Collection  │
                              │  (MongoDB)   │
                              └──────────────┘
```

Every public method on `GeneralController` follows this exact shape and stays at ≤ 5 cyclomatic complexity by delegating to the model.

---

## What each model method returns

| Method | Synchronous? | Receives | Returns |
|---|---|---|---|
| `extractFromRequest(req)` | yes | `Request` | `TInput` (raw, unvalidated) |
| `validate(input)` | **may be async** | `TInput` | `void` — throws `ApiError(400)` on failure |
| `build(input)` | **may be async** | `TInput` (already validated) | `TDoc` (ready to insert) |
| `toResponse(doc)` | yes | `WithId<TDoc>` (Mongo `WithId` flavour) | `unknown` — public projection |

Async `validate` is what you want when you need to check uniqueness against the DB before inserting. Async `build` is for hashing, derived defaults, etc. The interface is `T | Promise<T>` so a sync implementation is still valid.

---

## Anatomy of a concrete controller

A concrete controller is **a handful of lines**. Example with a `Note` entity:

```ts
// models/NoteModel.ts
export class NoteModel implements IBaseModel<NoteInput, NoteDoc> {
  extractFromRequest(req)         { return { title: req.body.title, body: req.body.body }; }
  validate({ title, body })       { if (!title) throw new ApiError(400, 'title is required'); }
  build({ title, body })          { return { title, body, createdAt: new Date() }; }
  toResponse(doc)                 { return { id: doc._id, title: doc.title, body: doc.body }; }
}

// controllers/NoteController.ts
export class NoteController extends GeneralController<NoteInput, NoteDoc> {
  protected readonly model      = new NoteModel();
  protected readonly collection = collection<NoteDoc>('notes');
}

// routes/notes.routes.ts
const ctrl = new NoteController();
router.post('/notes',    ctrl.create);
router.get('/notes/:id',  ctrl.show);
router.put('/notes/:id',  ctrl.update);
router.delete('/notes/:id', ctrl.delete);
```

The base class wires the four methods, the model wires the four steps, the routes wire them to HTTP verbs.

---

## What lives where

| Concern | Lives in | Why |
|---|---|---|
| HTTP verb handling | `GeneralController` (orchestrator) | Reusable, no domain knowledge. |
| Async error forwarding | `asyncHandler` (wrapper in `GeneralController`) | All handlers go through it. |
| Input extraction (body / params / query) | `Model.extractFromRequest` | The model knows what it needs. |
| Schema & rule validation | `Model.validate` | Domain knowledge. May hit the DB. |
| Domain transformation (hashing, defaults) | `Model.build` | The model owns the "ready to store" shape. |
| Public projection (strip secrets) | `Model.toResponse` | One place, no leaks. |
| Mongo collection reference | `ConcreteController.collection` | One per entity. |

---

## Three flavours of concrete controller (with real examples)

Every controller in the project falls into one of these three patterns. Pick the closest to your case and copy it.

### 1. Pure CRUD (Register, future Link/Note entities)

The base `create`/`update`/`show`/`delete` do exactly what you want, and you only contribute the model and the collection.

```ts
// RegisterModel: extract from body, validate with zod, build with hashed password
export class RegisterController extends GeneralController<RegisterInput, User> {
  protected readonly model = new RegisterModel();
  protected get collection(): Collection<User> { return collection<User>(Collections.Users); }
  // No need to override anything — POST /api/auth/register wires ctrl.create.
}
```

### 2. Different verb on a custom action (Login)

`LoginController` extends `GeneralController` for consistency, but the public action it exposes is `login` (not `create`) because login doesn't insert anything — it verifies credentials and issues tokens.

```ts
export class LoginController extends GeneralController<LoginInput, User> {
  protected readonly model = new LoginModel();
  protected get collection(): Collection<User> { return collection<User>(Collections.Users); }

  public login = asyncHandler(async (req, res) => {
    const input = this.model.extractFromRequest(req);
    await this.model.validate(input);
    const user = await this.model.build(input);
    if (!user._id) throw new ApiError(500, 'User is missing _id');
    const tokens = await this.issueTokensForUser(user._id, req, input.remember);
    setRefreshCookie(res, tokens.refreshToken, input.remember);
    res.json({ ok: true, data: { user: this.model.toResponse(user), accessToken: tokens.accessToken } });
  });

  // Defensive: no one should wire the base 'create' to a route.
  public create = asyncHandler(async (_req, _res) => {
    throw new ApiError(500, 'LoginController.create should not be used directly. Use login().');
  });
}
```

### 3. Branches on env (Register with email verification)

When `EMAIL_VERIFICATION_ENABLED=true` the register flow creates an `inactive` user, sends a verification email, and does **not** issue tokens. The base `create` would always issue tokens, so we override it and delegate to two private helpers:

```ts
public register = asyncHandler(async (req, res) => {
  const input = this.model.extractFromRequest(req);
  await this.model.validate(input);
  const doc = await this.model.build(input);
  const result = await this.collection.insertOne(doc);
  const stored = { ...doc, _id: result.insertedId };
  if (env.EMAIL_VERIFICATION_ENABLED) {
    return this.handlePendingVerification(result.insertedId, this.model.toResponse(stored), res);
  }
  return this.handleActiveRegistration(result.insertedId, this.model.toResponse(stored), req, res);
});
```

### Bonus: ShortlinkController — CRUD + ownership

`ShortlinkController` extends `GeneralController` for the inherited pipeline but overrides `show`/`update`/`delete` to enforce ownership (`404` if the shortlink doesn't belong to the authenticated user, instead of leaking existence). It also adds a `listMine` paginated endpoint:

```ts
public show = asyncHandler(async (req, res) => {
  const userId = this.requireUserId(req);
  const doc = await this.findOwnedOr404(req, userId);
  res.json({ ok: true, data: this.model.toResponse(doc) });
});

public listMine = asyncHandler(async (req, res) => {
  const userId = this.requireUserId(req);
  const { limit, skip } = listQuerySchema.parse(req.query);
  const [items, total] = await Promise.all([
    this.collection.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    this.collection.countDocuments({ userId }),
  ]);
  res.json({ ok: true, data: { items: items.map((d) => this.model.toResponse(d)), pagination: { limit, skip, total } } });
});
```

---

## Conventions

1. **One model per entity.** `UserModel`, `LinkModel`, etc. — never share a model between two entities.
2. **Validate BEFORE build.** The controller enforces this. `build` must be safe to assume the input is valid.
3. **Throw `ApiError`, not raw `Error`.** The global `errorHandler` will translate it into a clean HTTP response.
4. **`toResponse` is the only place that may leak doc fields.** The controller never reaches into the doc directly.
5. **Models are stateless.** Don't cache things in instance fields. They should be safe to instantiate per-request if needed.
6. **Lazy collection when `connect()` runs after construction.** Use a getter, not a field:
   ```ts
   protected get collection(): Collection<User> {
     return collection<User>(Collections.Users);
   }
   ```
7. **Override `create` to prevent accidents** when a controller exposes a differently-named action. Throw `ApiError(500, ...)` if someone wires it anyway — fail loudly.
8. **Wrapping `asyncHandler`.** Any async public method on a controller should be wrapped in `asyncHandler` so thrown `ApiError`s reach the global error middleware.

---

## TL;DR for new contributors

> "I need a CRUD for `<thing>`."
> 1. Make `<thing>Model implements IBaseModel<...>` (4 methods).
> 2. Extend `GeneralController` (2 fields: `model`, `collection`).
> 3. Wire the route.
> Done.

> "I need a CRUD where the action isn't really `create`."
> Override the action, keep the inherited pipeline, throw on the inherited action so it's never wired by mistake.

---

## Where it's used in the codebase

| Controller | Pattern | Notes |
|---|---|---|
| `RegisterController` | #1 + #3 | Branches on `EMAIL_VERIFICATION_ENABLED`. |
| `LoginController` | #2 | `login` action; `create` override is a guard. |
| `ShortlinkController` | Bonus | CRUD + ownership + `listMine`. |
| `MeController` | (not used) | Doesn't need CRUD — simple `me` action. |
| `LogoutController` / `RefreshController` / `VerifyEmailController` | (not used) | Single-action controllers, no need for the pattern. |

If your new feature fits one of the three patterns above, use the GeneralController. If it's a single-action endpoint (verify, logout, refresh), a plain controller is simpler.
