/**
 * Represents a generic metadata object used for arbitrary non-standard data.
 */
export type JsonApiMeta = { [key: string]: any; };
/**
 * A link can either be a simple string URL or a complex object.
 * @see {@link https://jsonapi.org/format/#document-links}
 */
export type JsonApiLink = string | {
	/** The link's URL. */
	href: string;
	/** A human-readable label for the destination. */
	title?: string;
	/** The language of the linked resource; a string or array of BCP 47 language tags. */
	hreflang?: string | string[];
	/** Non-standard meta-information about the link. */
	meta?: JsonApiMeta;
};

/**
 * A links object used to represent references to documents and relationships.
 * @see {@link https://jsonapi.org/format/#document-links}
 */
export interface JsonApiLinks {
	/** A link that identifies the resource tying to the current document context. */
	self?: JsonApiLink;
	/** A related resource link when the link is on a relationship object. */
	related?: JsonApiLink;
	/** A link to a description document associated with the context. */
	describedby?: JsonApiLink;
	/** A link that leads to further details about this particular occurrence of the problem. */
	about?: JsonApiLink;
	/** A link that identifies the type of error that this particular error is an instance of. */
	type?: JsonApiLink;

	/** The first page of data. */
	first?: JsonApiLink | null;
	/** The last page of data. */
	last?: JsonApiLink | null;
	/** The previous page of data. */
	prev?: JsonApiLink | null;
	/** The next page of data. */
	next?: JsonApiLink | null;
}

/**
 * An error object providing additional diagnostic data when an endpoint fails.
 * @see {@link https://jsonapi.org/format/#errors}
 */
export interface JsonApiDocErr {
	/** Unique identifier for this particular occurrence of the problem. */
	id?: string;
	/** Links object containing related context links. */
	links?: JsonApiLinks;
	/** The HTTP status code applicable to this problem, expressed as a string value. */
	status?: string;
	/** An application-specific error code. */
	code?: string;
	/** A short, human-readable summary of the problem. */
	title?: string;
	/** A human-readable explanation specific to this occurrence of the problem. */
	detail?: string;
	/** An object containing references to the primary source of the error. */
	source?: {
		/** A JSON Pointer to the value in the request document that caused the error. */
		pointer?: string;
		/** A string indicating which URI query parameter caused the error. */
		parameter?: string;
		/** A string indicating the name of a single request header which caused the error. */
		header?: string;
	};
	/** Non-standard diagnostic meta data. */
	meta?: JsonApiMeta;
};

/**
 * Represents a JSON:API Resource Identifier Object.
 * Used in relationships to link to other resources.
 * @see {@link https://jsonapi.org/format/#document-resource-identifier-objects}
 */
export interface JsonApiResourceId {
	/** The unique identity of the resource. */
	id: string;
	/**
	 * A document-local identifier for the resource, used to reference new resources
	 * that have not yet been assigned a server `id` (e.g. in atomic operation requests).
	 * @since JSON:API v1.1
	 */
	lid?: string;
	/** The type of the resource. */
	type: string;
	/** Non-standard meta information about the identifier. */
	meta?: JsonApiMeta;
}

/**
 * Represents a JSON:API Relationship Object.
 * Each named relationship in a resource's `relationships` map must conform to this shape.
 * MUST contain at least one of `links`, `data`, or `meta`.
 * @see {@link https://jsonapi.org/format/#document-resource-object-relationships}
 */
export interface JsonApiRelationship {
	/** Links related to the relationship itself. */
	links?: JsonApiLinks;
	/**
	 * Resource linkage: a to-one identifier, an array for to-many, or null for an empty to-one.
	 */
	data?: JsonApiResourceId | JsonApiResourceId[] | null;
	/** Non-standard meta information about the relationship. */
	meta?: JsonApiMeta;
}

/**
 * Represents a standard JSON:API Resource Object.
 * @template T The interface shaping the resource `attributes`.
 * @see {@link https://jsonapi.org/format/#document-resource-objects}
 */
export interface JsonApiResource<T = JsonApiMeta> {
	/** The unique identity of the resource. */
	id: string;
	/**
	 * A document-local identifier for the resource, used to reference new resources
	 * that have not yet been assigned a server `id` (e.g. in atomic operation requests).
	 * @since JSON:API v1.1
	 */
	lid?: string;
	/** The type of the resource (e.g. 'users', 'articles'). */
	type: string;
	/** An attributes object representing some of the resource's data. */
	attributes?: T;
	/** A relationships object describing relationships between the resource and other JSON:API resources. */
	relationships?: Record<string, JsonApiRelationship>;
	/** A links object containing links related to the resource. */
	links?: JsonApiLinks;
	/** Non-standard meta information about the resource. */
	meta?: JsonApiMeta;
}

/**
 * Defines the request geometry for creating a new resource object.
 * Identical to Resource Object but `id` is optionally generated.
 * @template T The interface shaping the creation attributes.
 */
export interface JsonApiResourceCreate<T = JsonApiMeta> {
	/** Optional pre-generated ID for the new resource. */
	id?: string;
	/**
	 * A document-local identifier to reference this new resource within the same
	 * request document (e.g. when establishing relationships between resources
	 * being created in a single atomic operation).
	 * @since JSON:API v1.1
	 */
	lid?: string;
	/** The type of the resource to create. */
	type: string;
	/** The initialization attributes. */
	attributes: T;
	/** Link definitions to initially attach. */
	relationships?: Record<string, JsonApiRelationship>;
}

/**
 * A standardized and robust response wrapper for all API calls.
 * Note: TypeScript interfaces cannot easily enforce that a document MUST contain
 * at least one of `data`, `errors`, or `meta`, nor that `data` and `errors`
 * MUST NOT coexist. This interface makes them optional, but implementations
 * should enforce these constraints at runtime.
 * It can represent either a successful response (with a `data` member)
 * or an error response (with an `errors` member).
 *
 * @template T The type of the primary data being returned.
 * @see {@link https://jsonapi.org/format/#document-top-level}
 */
export interface JsonApiDoc<T> {
	/** An object describing the server's implementation. */
	jsonapi?: {
		version?: string;
		ext?: string[];
		profile?: string[];
		meta?: JsonApiMeta;
	};
	/** A links object containing links related to the primary data. */
	links?: JsonApiLinks;
	/** The document's primary data. */
	data?: T | null;
	/** An array of error objects describing failures. */
	errors?: Array<JsonApiDocErr>;
	/** Non-standard meta-information about the document. */
	meta?: JsonApiMeta;
	/**
	 * An array of resource objects that are related to the primary data and/or each other.
	 * Note: Per spec, `included` MUST NOT appear unless a top-level `data` member is also present.
	 * This constraint cannot be enforced by TypeScript alone and must be validated at runtime.
	 */
	included?: Array<JsonApiResource>;
}

/**
 * Represents field selection or filtering options.
 * Used for sparse fieldsets when serializing resources or for specifying filter criteria in queries.
 * When representing sparse fieldsets, keys are resource type names and values are allowed attribute names.
 * When representing filters, keys are filter names/parameters and values are the filter query criteria.
 */
export type JsonApiFields = Record<string, string[]> | string[];

/**
 * Represents the structure of a JSON:API query parameter object.
 * @template T - The resource type being queried to provide type-safe sorting and filtering.
 * @see {@link https://jsonapi.org/format/#query-parameters}
 */
export interface JsonApiQuery<T> {
	/**
	 * Sparse Fieldsets: Specifies the subset of fields to return for a resource type.
	 * If a Record, keys represent resource types and values represent specific fields.
	 */
	fields?: JsonApiFields;

	/**
	 * Inclusion of Related Resources: Requests related resources to be included in the response.
	 * Supports dot-separated paths for nested relationships (e.g., 'comments.author').
	 */
	include?: Array<string>;

	/**
	 * Pagination: Used to limit the number of resources returned in a single request.
	 */
	page?: {
		/** The maximum number of resources to return per page. */
		limit?: number;
		/** The number of resources to skip before beginning to return the result set. */
		offset?: number;
	};

	/**
	 * Sorting: Determines the order in which resources are returned.
	 * Elements should be prefixed with '-' for descending order.
	 * Note: Typed as `string` (rather than `keyof T`) to accommodate dot-notation paths
	 * for related resource attributes (e.g. 'author.name') and the '-' descending prefix.
	 */
	sort?: Array<string>;

	/**
	 * Filtering: Restricts the requested resource set by specified criteria.
	 * Strategy for complex operators (e.g., 'gt', 'lt') is implementation-specific.
	 * Note: Keys are `string` (not `keyof T`) to allow relationship traversal paths.
	 * Values support arrays for multi-value filters (e.g. IN queries).
	 */
	filter?: JsonApiFields;
}

// ─── Serialization Utilities ──────────────────────────────────────────────────

/**
 * Options accepted by the serialization helpers.
 */
export interface SerializeOptions {
	/**
	 * Sparse fieldset constraints. When provided, only the listed attributes
	 * are included in the serialized output for the matching resource type.
	 */
	fields?: JsonApiFields;
}

/**
 * Options accepted by the collection serialization helper.
 */
export interface SerializeCollectionOptions extends SerializeOptions {
	/** Current page limit (used to populate `meta.page.limit`). */
	limit?: number;
	/** Current page offset (used to populate `meta.page.offset`). */
	offset?: number;
}

/**
 * Filters an object to only include the fields allowed by a sparse fieldset spec.
 *
 * @param item   - The raw attributes object to filter.
 * @param type   - The JSON:API resource type name.
 * @param fields - The sparse fieldset configuration.
 * @returns A partial copy of `item` containing only the permitted fields,
 *          or the original `item` when no fieldset is configured.
 */
export function applyFields<T extends Record<string, any>>(
	item: T,
	type: string,
	fields?: JsonApiFields
): Partial<T> {
	if (!fields) return item;

	let fieldList: string[] | undefined;
	if (Array.isArray(fields)) {
		fieldList = fields as string[];
	} else if (typeof fields === 'object' && (fields as Record<string, string[]>)[type]) {
		fieldList = (fields as Record<string, string[]>)[type];
	}

	if (!fieldList || fieldList.length === 0) return item;

	const result: Partial<T> = {};
	for (const key of fieldList) {
		if (key in item) {
			result[key as keyof T] = item[key];
		}
	}

	return Object.keys(result).length > 0 ? result : item;
}

/**
 * Serializes a single plain object into a JSON:API document.
 *
 * The `id` field is extracted from the object and coerced to a string.
 * All remaining attributes (minus `id`) are placed under `attributes`.
 *
 * @param item    - The raw entity or DTO to serialize.
 * @param type    - The JSON:API resource type name (e.g. `'articles'`).
 * @param options - Optional serialization options (sparse fieldsets, custom ID extractor).
 * @param idExtractor - An optional function to derive the resource `id` from `item`.
 *                      Defaults to `String(item.id)`.
 * @returns A well-formed JSON:API document containing a single resource object.
 *
 * @example
 * const doc = serializeOne({ id: '1', title: 'Hello' }, 'articles');
 * // { data: { id: '1', type: 'articles', attributes: { title: 'Hello' } } }
 */
export function serializeOne<T extends Record<string, any>>(
	item: T,
	type: string,
	options?: SerializeOptions,
	idExtractor?: (item: T) => string
): JsonApiDoc<JsonApiResource<Partial<T>>> {
	const id = idExtractor ? idExtractor(item) : (item.id != null ? String(item.id) : '');
	const attributes = applyFields(item, type, options?.fields);
	return {
		data: { id, type, attributes }
	};
}

/**
 * Serializes an array of plain objects into a JSON:API document.
 *
 * Pagination metadata (`meta.page`) is automatically populated from
 * the `limit`, `offset`, and result count when options are provided.
 *
 * @param items   - The array of raw entities or DTOs to serialize.
 * @param type    - The JSON:API resource type name (e.g. `'articles'`).
 * @param options - Optional serialization options (pagination, sparse fieldsets, custom ID extractor).
 * @param idExtractor - An optional function to derive the resource `id` from each item.
 *                      Defaults to `String(item.id)`.
 * @returns A well-formed JSON:API document containing an array of resource objects.
 *
 * @example
 * const doc = serializeMany([{ id: '1', title: 'Hello' }], 'articles', { limit: 10, offset: 0 });
 */
export function serializeMany<T extends Record<string, any>>(
	items: T[],
	type: string,
	options?: SerializeCollectionOptions,
	idExtractor?: (item: T) => string
): JsonApiDoc<JsonApiResource<Partial<T>>[]> {
	return {
		data: items.map(item => ({
			id: idExtractor ? idExtractor(item) : (item.id != null ? String(item.id) : ''),
			type,
			attributes: applyFields(item, type, options?.fields) as Partial<T>
		})),
		meta: {
			page: {
				limit: options?.limit ?? 100,
				offset: options?.offset ?? 0,
				count: items.length
			}
		}
	};
}

/**
 * Deserializes a JSON:API resource object into a plain object,
 * merging `id` and `attributes` into a flat structure.
 *
 * @param resource - The JSON:API resource object to deserialize.
 * @returns A plain object combining `id` with the spread `attributes`.
 *
 * @example
 * const article = deserializeOne<Article>(resource);
 * // { id: '1', title: 'Hello', ... }
 */
export function deserializeOne<T>(resource: JsonApiResource<Omit<T, 'id'>>): T {
	return { ...resource.attributes, id: resource.id } as unknown as T;
}

/**
 * Deserializes an array of JSON:API resource objects into plain objects.
 *
 * @param resources - The array of JSON:API resource objects to deserialize.
 * @returns An array of plain objects combining `id` with the spread `attributes`.
 */
export function deserializeMany<T>(resources: JsonApiResource<Omit<T, 'id'>>[]): T[] {
	return resources.map(r => deserializeOne<T>(r));
}
