# @chrisstone/ts-jsonapi

TypeScript type definitions for [JSON:API v1.1](https://jsonapi.org/format/).

Provides a complete, spec-aligned set of interfaces and types for building and consuming JSON:API-compliant APIs in TypeScript — with no dependencies.

## Installation

```bash
npm install --save-dev @chrisstone/ts-jsonapi
```

> **Peer dependency:** TypeScript ≥ 4.7 is required.

## Usage

### Typing an API response

```typescript
import type { JsonApiDoc, JsonApiResource } from '@chrisstone/ts-jsonapi';

interface ArticleAttributes {
  title: string;
  body: string;
  publishedAt: string | null;
}

type ArticleResource = JsonApiResource<ArticleAttributes>;
type ArticleResponse = JsonApiDoc<ArticleResource>;
type ArticleListResponse = JsonApiDoc<ArticleResource[]>;
```

### Typing a create request

```typescript
import type { JsonApiDoc, JsonApiResourceCreate } from '@chrisstone/ts-jsonapi';

interface NewArticleAttributes {
  title: string;
  body: string;
}

type CreateArticleRequest = JsonApiDoc<JsonApiResourceCreate<NewArticleAttributes>>;
```

### Typing query parameters

```typescript
import type { JsonApiQuery } from '@chrisstone/ts-jsonapi';

interface ArticleAttributes {
  title: string;
  publishedAt: string;
}

const query: JsonApiQuery<ArticleAttributes> = {
  sort: ['-publishedAt'],
  filter: { title: 'TypeScript' },
  page: { limit: 10, offset: 0 },
  include: ['author'],
};
```

### Typing error responses

```typescript
import type { JsonApiDoc, JsonApiDocErr } from '@chrisstone/ts-jsonapi';

const errorResponse: JsonApiDoc<never> = {
  errors: [
    {
      status: '422',
      code: 'invalid',
      title: 'Invalid attribute',
      detail: 'Title cannot be blank.',
      source: { pointer: '/data/attributes/title' },
    },
  ],
};
```

## Exported Types

| Type | Description |
|------|-------------|
| `JsonApiMeta` | Arbitrary non-standard metadata object |
| `JsonApiLink` | A URL string or link object with `href`, `title`, `reflang`, `meta` |
| `JsonApiLinks` | Links object (self, related, pagination, etc.) |
| `JsonApiDocErr` | A single error object within an `errors` array |
| `JsonApiResourceId` | Resource identifier object (`type` + `id`) |
| `JsonApiRelationship` | Relationship object with `links`, `data`, and/or `meta` |
| `JsonApiResource<T>` | Full resource object with typed `attributes` |
| `JsonApiResourceCreate<T>` | Resource object for POST requests (optional `id`) |
| `JsonApiDoc<T>` | Top-level document wrapper (success or error response) |
| `JsonApiQuery<T>` | Typed query parameter object (`fields`, `include`, `sort`, `filter`, `page`) |

## Spec Compliance

These types target [JSON:API v1.1](https://jsonapi.org/format/). Notable type-level limitations (enforced at runtime by your implementation):

- TypeScript cannot prevent `data` and `errors` from coexisting in the same document.
- `included` requiring a top-level `data` member cannot be enforced statically.
- Relationship objects requiring at least one of `links`, `data`, or `meta` is documented but not enforced by the type.

## License

[MIT](./LICENSE) © Chris Stone
