[@clickup/magination](../README.md) / [Exports](../modules.md) / Page

# Interface: Page\<THit\>

A chunk of hits and a cursor which allows to fetch more hits. If the cursor
is null, there are no more hits left to fetch.

An "hit" is typically some metadata about a document, like document id, its
type and/or some other small metadata (NOT document's texts for sure).

## Type parameters

| Name |
| :------ |
| `THit` |

## Properties

### hits

• **hits**: `THit`[]

#### Defined in

[src/Page.ts:9](https://github.com/clickup/magination/blob/master/src/Page.ts#L9)

___

### cursor

• **cursor**: ``null`` \| `string`

#### Defined in

[src/Page.ts:10](https://github.com/clickup/magination/blob/master/src/Page.ts#L10)

___

### took

• `Optional` **took**: `number`

#### Defined in

[src/Page.ts:11](https://github.com/clickup/magination/blob/master/src/Page.ts#L11)

___

### profile

• `Optional` **profile**: `unknown`

#### Defined in

[src/Page.ts:12](https://github.com/clickup/magination/blob/master/src/Page.ts#L12)
