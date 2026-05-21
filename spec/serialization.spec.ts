import {
	applyFields,
	serializeOne,
	serializeMany,
	deserializeOne,
	deserializeMany,
	JsonApiResource,
	JsonApiFields
} from '../src/index';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

interface Article {
	id: string;
	title: string;
	body: string;
	published: boolean;
}

interface MinimalItem {
	id: string;
}

const ARTICLE_A: Article = { id: '1', title: 'Hello World', body: 'Content here', published: true };
const ARTICLE_B: Article = { id: '2', title: 'Second Post', body: 'More content', published: false };

// ─── applyFields ──────────────────────────────────────────────────────────────

describe('applyFields', () => {
	describe('positive cases', () => {
		it('should return the original item when no fields are provided', () => {
			const result = applyFields(ARTICLE_A, 'articles');
			expect(result).toBe(ARTICLE_A);
		});

		it('should return the original item when fields is undefined', () => {
			const result = applyFields(ARTICLE_A, 'articles', undefined);
			expect(result).toBe(ARTICLE_A);
		});

		it('should filter to the specified fields when given a string array', () => {
			const fields: JsonApiFields = ['title', 'published'];
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toEqual({ title: 'Hello World', published: true });
			expect(result).not.toEqual(jasmine.objectContaining({ body: 'Content here' }));
		});

		it('should filter to the specified fields when given a Record keyed by type', () => {
			const fields: JsonApiFields = { articles: ['title'] };
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toEqual({ title: 'Hello World' });
		});

		it('should return only matching keys when the field list contains extra keys not in the item', () => {
			const fields: JsonApiFields = ['title', 'nonexistent'];
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toEqual({ title: 'Hello World' });
		});

		it('should handle a single-field selection', () => {
			const fields: JsonApiFields = ['body'];
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toEqual({ body: 'Content here' });
		});
	});

	describe('negative / edge cases', () => {
		it('should return the original item when the Record has no entry for the given type', () => {
			const fields: JsonApiFields = { users: ['name'] };
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toBe(ARTICLE_A);
		});

		it('should return the original item when given an empty string array', () => {
			const fields: JsonApiFields = [] as string[];
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toBe(ARTICLE_A);
		});

		it('should return the original item when the Record entry is an empty array', () => {
			const fields: JsonApiFields = { articles: [] };
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toBe(ARTICLE_A);
		});

		it('should return the original item when none of the requested fields exist on the item', () => {
			const fields: JsonApiFields = ['nonexistent', 'also_missing'];
			const result = applyFields(ARTICLE_A, 'articles', fields);
			expect(result).toBe(ARTICLE_A);
		});

		it('should handle an item with no own properties gracefully', () => {
			const emptyItem = {} as Record<string, any>;
			const fields: JsonApiFields = ['title'];
			const result = applyFields(emptyItem, 'articles', fields);
			expect(result).toEqual(emptyItem);
		});
	});
});

// ─── serializeOne ─────────────────────────────────────────────────────────────

describe('serializeOne', () => {
	describe('positive cases', () => {
		it('should produce a valid JSON:API document with data containing id, type, and attributes', () => {
			const doc = serializeOne(ARTICLE_A, 'articles');
			expect(doc.data).toBeDefined();
			expect(doc.data!.id).toBe('1');
			expect(doc.data!.type).toBe('articles');
			expect(doc.data!.attributes).toBeDefined();
		});

		it('should place all item properties into attributes', () => {
			const doc = serializeOne(ARTICLE_A, 'articles');
			expect(doc.data!.attributes!.title).toBe('Hello World');
			expect(doc.data!.attributes!.body).toBe('Content here');
			expect(doc.data!.attributes!.published).toBe(true);
		});

		it('should coerce a numeric id to a string', () => {
			const item = { id: 42, name: 'Test' };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.id).toBe('42');
		});

		it('should apply sparse fieldsets from options', () => {
			const doc = serializeOne(ARTICLE_A, 'articles', { fields: ['title'] });
			expect(doc.data!.attributes).toEqual({ title: 'Hello World' });
		});

		it('should apply Record-based sparse fieldsets', () => {
			const doc = serializeOne(ARTICLE_A, 'articles', {
				fields: { articles: ['title', 'published'] }
			});
			expect(doc.data!.attributes).toEqual({ title: 'Hello World', published: true });
		});

		it('should use a custom idExtractor when provided', () => {
			const item = { uuid: 'abc-123', name: 'Custom' };
			const doc = serializeOne(item, 'items', undefined, (i) => i.uuid);
			expect(doc.data!.id).toBe('abc-123');
		});

		it('should use idExtractor even when item has an id property', () => {
			const doc = serializeOne(ARTICLE_A, 'articles', undefined, () => 'custom-id');
			expect(doc.data!.id).toBe('custom-id');
		});
	});

	describe('negative / edge cases', () => {
		it('should produce an empty string id when item has no id property and no idExtractor', () => {
			const item = { name: 'No ID' };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.id).toBe('');
		});

		it('should handle an item with only an id property', () => {
			const item: MinimalItem = { id: '99' };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.id).toBe('99');
			expect(doc.data!.attributes).toEqual({ id: '99' });
		});

		it('should handle null-valued attributes without crashing', () => {
			const item = { id: '1', name: null, value: undefined };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.attributes!.name).toBeNull();
			expect(doc.data!.attributes!.value).toBeUndefined();
		});

		it('should handle an item with id explicitly set to null', () => {
			const item = { id: null as any, name: 'test' };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.id).toBe('');
		});

		it('should handle an item with id set to 0 (falsy but not null)', () => {
			const item = { id: 0, name: 'zero' };
			const doc = serializeOne(item, 'items');
			expect(doc.data!.id).toBe('0');
		});
	});
});

// ─── serializeMany ────────────────────────────────────────────────────────────

describe('serializeMany', () => {
	describe('positive cases', () => {
		it('should produce a valid JSON:API document with a data array', () => {
			const doc = serializeMany([ARTICLE_A, ARTICLE_B], 'articles');
			expect(Array.isArray(doc.data)).toBe(true);
			expect(doc.data!.length).toBe(2);
		});

		it('should serialize each item with correct id, type, and attributes', () => {
			const doc = serializeMany([ARTICLE_A, ARTICLE_B], 'articles');
			expect(doc.data![0].id).toBe('1');
			expect(doc.data![0].type).toBe('articles');
			expect(doc.data![0].attributes!.title).toBe('Hello World');
			expect(doc.data![1].id).toBe('2');
			expect(doc.data![1].type).toBe('articles');
			expect(doc.data![1].attributes!.title).toBe('Second Post');
		});

		it('should populate meta.page with default pagination when no options are given', () => {
			const doc = serializeMany([ARTICLE_A], 'articles');
			expect(doc.meta).toBeDefined();
			expect(doc.meta!.page).toBeDefined();
			expect(doc.meta!.page.limit).toBe(100);
			expect(doc.meta!.page.offset).toBe(0);
			expect(doc.meta!.page.count).toBe(1);
		});

		it('should use provided limit and offset in meta.page', () => {
			const doc = serializeMany([ARTICLE_A, ARTICLE_B], 'articles', {
				limit: 25, offset: 50
			});
			expect(doc.meta!.page.limit).toBe(25);
			expect(doc.meta!.page.offset).toBe(50);
			expect(doc.meta!.page.count).toBe(2);
		});

		it('should apply sparse fieldsets across all items', () => {
			const doc = serializeMany([ARTICLE_A, ARTICLE_B], 'articles', {
				fields: ['title']
			});
			expect(doc.data![0].attributes).toEqual({ title: 'Hello World' });
			expect(doc.data![1].attributes).toEqual({ title: 'Second Post' });
		});

		it('should use a custom idExtractor for all items', () => {
			const items = [
				{ uuid: 'aaa', name: 'First' },
				{ uuid: 'bbb', name: 'Second' }
			];
			const doc = serializeMany(items, 'items', undefined, (i) => i.uuid);
			expect(doc.data![0].id).toBe('aaa');
			expect(doc.data![1].id).toBe('bbb');
		});

		it('should correctly report count for a larger collection', () => {
			const items = Array.from({ length: 50 }, (_, i) => ({ id: String(i), val: i }));
			const doc = serializeMany(items, 'numbers', { limit: 10, offset: 0 });
			expect(doc.meta!.page.count).toBe(50);
			expect(doc.data!.length).toBe(50);
		});
	});

	describe('negative / edge cases', () => {
		it('should return an empty data array for an empty input array', () => {
			const doc = serializeMany([], 'articles');
			expect(doc.data).toEqual([]);
			expect(doc.meta!.page.count).toBe(0);
		});

		it('should default limit to 100 and offset to 0 when options exist but are partial', () => {
			const doc = serializeMany([ARTICLE_A], 'articles', { fields: ['title'] });
			expect(doc.meta!.page.limit).toBe(100);
			expect(doc.meta!.page.offset).toBe(0);
		});

		it('should handle items with missing id properties', () => {
			const items = [{ name: 'No ID' }];
			const doc = serializeMany(items, 'items');
			expect(doc.data![0].id).toBe('');
		});

		it('should handle limit of 0', () => {
			const doc = serializeMany([ARTICLE_A], 'articles', { limit: 0, offset: 0 });
			expect(doc.meta!.page.limit).toBe(0);
		});
	});
});

// ─── deserializeOne ───────────────────────────────────────────────────────────

describe('deserializeOne', () => {
	describe('positive cases', () => {
		it('should merge id and attributes into a flat object', () => {
			const resource: JsonApiResource<Omit<Article, 'id'>> = {
				id: '1',
				type: 'articles',
				attributes: { title: 'Hello World', body: 'Content here', published: true }
			};
			const result = deserializeOne<Article>(resource);
			expect(result.id).toBe('1');
			expect(result.title).toBe('Hello World');
			expect(result.body).toBe('Content here');
			expect(result.published).toBe(true);
		});

		it('should produce an object that is a plain object (not a JsonApiResource)', () => {
			const resource: JsonApiResource<Omit<Article, 'id'>> = {
				id: '1',
				type: 'articles',
				attributes: { title: 'Test', body: 'Body', published: false }
			};
			const result = deserializeOne<Article>(resource);
			expect((result as any).type).toBeUndefined();
		});

		it('should handle a resource with extra properties (links, meta) without leaking them', () => {
			const resource: JsonApiResource<{ name: string }> = {
				id: '5',
				type: 'users',
				attributes: { name: 'Chris' },
				links: { self: '/users/5' },
				meta: { lastSeen: '2025-01-01' }
			};
			const result = deserializeOne<{ id: string; name: string }>(resource);
			expect(result.id).toBe('5');
			expect(result.name).toBe('Chris');
			expect((result as any).links).toBeUndefined();
			expect((result as any).meta).toBeUndefined();
		});
	});

	describe('negative / edge cases', () => {
		it('should handle a resource with undefined attributes', () => {
			const resource: JsonApiResource = {
				id: '1',
				type: 'items'
			};
			const result = deserializeOne<{ id: string }>(resource);
			expect(result.id).toBe('1');
		});

		it('should handle a resource with empty attributes', () => {
			const resource: JsonApiResource<Record<string, never>> = {
				id: '1',
				type: 'items',
				attributes: {} as Record<string, never>
			};
			const result = deserializeOne<{ id: string }>(resource);
			expect(result.id).toBe('1');
		});

		it('should handle attributes containing null values', () => {
			const resource: JsonApiResource<{ name: string | null }> = {
				id: '1',
				type: 'items',
				attributes: { name: null }
			};
			const result = deserializeOne<{ id: string; name: string | null }>(resource);
			expect(result.name).toBeNull();
		});

		it('should use id from resource, not from attributes if attributes happen to have one', () => {
			const resource: JsonApiResource<{ id: string; name: string }> = {
				id: 'resource-id',
				type: 'items',
				attributes: { id: 'attribute-id', name: 'test' }
			};
			// The spread order is: { ...attributes, id: resource.id }
			// So resource.id should win over attributes.id
			const result = deserializeOne<{ id: string; name: string }>(resource);
			expect(result.id).toBe('resource-id');
		});
	});
});

// ─── deserializeMany ──────────────────────────────────────────────────────────

describe('deserializeMany', () => {
	describe('positive cases', () => {
		it('should deserialize multiple resources into plain objects', () => {
			const resources: JsonApiResource<Omit<Article, 'id'>>[] = [
				{ id: '1', type: 'articles', attributes: { title: 'First', body: 'A', published: true } },
				{ id: '2', type: 'articles', attributes: { title: 'Second', body: 'B', published: false } }
			];
			const results = deserializeMany<Article>(resources);
			expect(results.length).toBe(2);
			expect(results[0].id).toBe('1');
			expect(results[0].title).toBe('First');
			expect(results[1].id).toBe('2');
			expect(results[1].title).toBe('Second');
		});

		it('should preserve the order of the input array', () => {
			const resources: JsonApiResource<{ name: string }>[] = [
				{ id: '3', type: 'items', attributes: { name: 'Third' } },
				{ id: '1', type: 'items', attributes: { name: 'First' } },
				{ id: '2', type: 'items', attributes: { name: 'Second' } }
			];
			const results = deserializeMany<{ id: string; name: string }>(resources);
			expect(results[0].id).toBe('3');
			expect(results[1].id).toBe('1');
			expect(results[2].id).toBe('2');
		});
	});

	describe('negative / edge cases', () => {
		it('should return an empty array for empty input', () => {
			const results = deserializeMany<Article>([]);
			expect(results).toEqual([]);
		});

		it('should handle a single-element array', () => {
			const resources: JsonApiResource<{ name: string }>[] = [
				{ id: '1', type: 'items', attributes: { name: 'Only' } }
			];
			const results = deserializeMany<{ id: string; name: string }>(resources);
			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Only');
		});
	});
});

// ─── Round-trip integration ───────────────────────────────────────────────────

describe('serialize → deserialize round-trip', () => {
	it('should produce the original data after a serializeOne → deserializeOne round-trip', () => {
		const original = { id: '1', title: 'Hello', body: 'World', published: true };
		const doc = serializeOne(original, 'articles');
		const restored = deserializeOne<typeof original>(doc.data! as any);
		expect(restored.id).toBe(original.id);
		expect(restored.title).toBe(original.title);
		expect(restored.body).toBe(original.body);
		expect(restored.published).toBe(original.published);
	});

	it('should produce the original data after a serializeMany → deserializeMany round-trip', () => {
		const originals = [
			{ id: '1', title: 'First', body: 'A', published: true },
			{ id: '2', title: 'Second', body: 'B', published: false }
		];
		const doc = serializeMany(originals, 'articles');
		const restored = deserializeMany<typeof originals[0]>(doc.data! as any);
		expect(restored.length).toBe(originals.length);
		for (let i = 0; i < originals.length; i++) {
			expect(restored[i].id).toBe(originals[i].id);
			expect(restored[i].title).toBe(originals[i].title);
		}
	});
});
