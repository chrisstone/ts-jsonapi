# @chrisstone/ts-jsonapi

TypeScript type definitions and serialization/deserialization utilities for [JSON:API v1.1](https://jsonapi.org/format/).

Provides a complete, spec-aligned set of interfaces, types, and runtime helper functions for building and consuming JSON:API-compliant APIs in TypeScript — with no external dependencies.

## Installation

```bash
npm install @chrisstone/ts-jsonapi
```

> **Peer dependency:** TypeScript = 4.7 is required.

## Features

- **Spec-Aligned Types:** Comprehensive interfaces matching the JSON:API v1.1 specification.
- **Serialization Helpers:** Easily convert flat database objects or DTOs into compliant JSON:API resource documents.
- **Deserialization Helpers:** Flatten JSON:API resource objects back into simple, key-value objects.
- **Sparse Fieldsets:** Built-in support for filtering fields during serialization.
- **Dual-Package Delivery:** Fully supports both ES Modules (`import`) and CommonJS (`require`).
- **Zero Dependencies:** Extremely lightweight package.

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
import type { JsonApiDoc } from '@chrisstone/ts-jsonapi';

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

### Serialization & Deserialization Helpers

```typescript
import {
  serializeOne,
  serializeMany,
  deserializeOne,
  deserializeMany
} from '@chrisstone/ts-jsonapi';

interface Article {
  id: string;
  title: string;
  body: string;
  published: boolean;
}

const article: Article = {
  id: '1',
  title: 'JSON:API in TypeScript',
  body: 'This library now includes utility functions!',
  published: true
};

// 1. Serializing a single entity
const singleDoc = serializeOne(article, 'articles');
/*
Resulting JsonApiDoc geometry:
{
  data: {
    id: '1',
    type: 'articles',
    attributes: {
      title: 'JSON:API in TypeScript',
      body: 'This library now includes utility functions!',
      published: true
    }
  }
}
*/

// 2. Serializing a collection with pagination metadata
const collectionDoc = serializeMany([article], 'articles', {
  limit: 10,
  offset: 0
});
/*
Resulting JsonApiDoc geometry:
{
  data: [ ... ],
  meta: {
    page: {
      limit: 10,
      offset: 0,
      count: 1
    }
  }
}
*/

// 3. Filtering attributes using sparse fieldsets
const sparseDoc = serializeOne(article, 'articles', {
  fields: ['title'] // or { articles: ['title'] }
});
// sparseDoc.data.attributes will only contain: { title: 'JSON:API in TypeScript' }

// 4. Using a custom ID extractor (e.g. for database objects with `uuid` or `_id`)
const customDbItem = { uuid: 'abc-123', name: 'Custom Entity' };
const docWithCustomId = serializeOne(customDbItem, 'items', undefined, (item) => item.uuid);

// 5. Deserializing a JSON:API resource back to a flat entity
const flatArticle = deserializeOne<Article>(singleDoc.data!);
// flatArticle is: { id: '1', title: 'JSON:API in TypeScript', ... }
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
| `JsonApiFields` | Sparse fieldset or filter definition (`Record<string, string[]> \| string[]`) |
| `SerializeOptions` | Options structure accepted by serialization functions |
| `SerializeCollectionOptions` | Pagination options structure for collection serialization |

## Exported Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `serializeOne` | `(item, type, options?, idExtractor?)` | Serializes a single plain object into a JSON:API resource document. |
| `serializeMany` | `(items, type, options?, idExtractor?)` | Serializes an array of plain objects into a JSON:API collection document with pagination metadata. |
| `deserializeOne` | `(resource)` | Flattens a single JSON:API resource object back into a plain object (merges `id` and `attributes`). |
| `deserializeMany` | `(resources)` | Flattens an array of JSON:API resource objects back into an array of plain objects. |
| `applyFields` | `(item, type, fields?)` | Utility that filters an attributes object based on sparse fieldset rules. |

## Spec Compliance

These types target [JSON:API v1.1](https://jsonapi.org/format/). Notable type-level limitations (enforced at runtime by your implementation):

- TypeScript cannot prevent `data` and `errors` from coexisting in the same document.
- `included` requiring a top-level `data` member cannot be enforced statically.
- Relationship objects requiring at least one of `links`, `data`, or `meta` is documented but not enforced by the type.

## License

[MIT](./LICENSE) © Chris Stone
