[@clickup/magination](../README.md) / [Exports](../modules.md) / Cache

# Interface: Cache

A key-value store which allows to store various metadata for a cursor.

## Methods

### read

▸ **read**(`key`): `Promise`<``null`` \| `object`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<``null`` \| `object`\>

#### Defined in

[src/Cache.ts:5](https://github.com/clickup/magination/blob/master/src/Cache.ts#L5)

___

### write

▸ **write**(`key`, `value`): `Promise`<`unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `object` |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[src/Cache.ts:6](https://github.com/clickup/magination/blob/master/src/Cache.ts#L6)
