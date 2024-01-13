[@clickup/magination](../README.md) / [Exports](../modules.md) / Source

# Class: Source\<THit\>

Represents a single stream of hits subject for pagination.

The idea: we have a cached list of hits loaded so far, and the cursor
returned is a position in this cache. On every load() call, we try to extract
hits from the cached list and, if we don't have enough of them there, we run
exactly one search() request to append-only the list with more hits. We also
do exclusion on the hits returned, so they are never repeated.

## Type parameters

| Name |
| :------ |
| `THit` |

## Constructors

### constructor

• **new Source**\<`THit`\>(`name`, `options`): [`Source`](Source.md)\<`THit`\>

#### Type parameters

| Name |
| :------ |
| `THit` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `options` | [`SourceOptions`](../interfaces/SourceOptions.md)\<`THit`\> |

#### Returns

[`Source`](Source.md)\<`THit`\>

#### Defined in

[src/Source.ts:33](https://github.com/clickup/magination/blob/master/src/Source.ts#L33)

## Properties

### name

• `Readonly` **name**: `string`

#### Defined in

[src/Source.ts:34](https://github.com/clickup/magination/blob/master/src/Source.ts#L34)

## Methods

### load

▸ **load**(`«destructured»`): `Promise`\<[`Page`](../interfaces/Page.md)\<`THit`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `cache` | [`Cache`](../interfaces/Cache.md) |
| › `cursor` | ``null`` \| `string` |
| › `excludeHits` | `THit`[] |
| › `hasher` | [`Hasher`](../interfaces/Hasher.md)\<`THit`\> |

#### Returns

`Promise`\<[`Page`](../interfaces/Page.md)\<`THit`\>\>

#### Defined in

[src/Source.ts:38](https://github.com/clickup/magination/blob/master/src/Source.ts#L38)
