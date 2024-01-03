[@clickup/magination](../README.md) / [Exports](../modules.md) / SourceOptions

# Interface: SourceOptions<THit\>

## Type parameters

| Name |
| :------ |
| `THit` |

## Properties

### pageSize

• **pageSize**: `number`

#### Defined in

[src/Source.ts:14](https://github.com/clickup/magination/blob/master/src/Source.ts#L14)

___

### preloadSize

• `Optional` **preloadSize**: `number` \| (`offset`: `number`) => `number`

#### Defined in

[src/Source.ts:15](https://github.com/clickup/magination/blob/master/src/Source.ts#L15)

___

### search

• **search**: (`cursor`: ``null`` \| `string`, `excludeHits`: `THit`[], `count`: `number`) => `Promise`<[`Page`](Page.md)<`THit`\>\>

#### Type declaration

▸ (`cursor`, `excludeHits`, `count`): `Promise`<[`Page`](Page.md)<`THit`\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `cursor` | ``null`` \| `string` |
| `excludeHits` | `THit`[] |
| `count` | `number` |

##### Returns

`Promise`<[`Page`](Page.md)<`THit`\>\>

#### Defined in

[src/Source.ts:16](https://github.com/clickup/magination/blob/master/src/Source.ts#L16)
