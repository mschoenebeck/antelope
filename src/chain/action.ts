import {Struct} from './struct'
import {Name, NameType} from './name'
import {Bytes, BytesType} from './bytes'
import {abiEncode} from '../serializer/encoder'
import {ABI, ABIDef} from './abi'
import {abiDecode} from '../serializer/decoder'
import {
    ABISerializable,
    ABISerializableConstructor,
    ABISerializableType,
} from '../serializer/serializable'
import {PermissionLevel, PermissionLevelType} from './permission-level'
import {arrayEquatableEquals} from '../utils'
import {BuiltinTypes} from '../serializer/builtins'

export interface ActionFields {
    /** The account (a.k.a. contract) to run action on. */
    account: NameType
    /** The name of the action. */
    name: NameType
    /** The permissions authorizing the action. */
    authorization: PermissionLevelType[]
    /** The ABI-encoded action data. */
    data: BytesType
}

/** Action type that may or may not have its data encoded */
export interface AnyAction {
    account: NameType
    name: NameType
    authorization: PermissionLevelType[]
    data: BytesType | ABISerializable
}

export type ActionType = Action | ActionFields

@Struct.type('action')
export class Action extends Struct {
    /** The account (a.k.a. contract) to run action on. */
    @Struct.field('name') account!: Name
    /** The name of the action. */
    @Struct.field('name') name!: Name
    /** The permissions authorizing the action. */
    @Struct.field(PermissionLevel, {array: true}) authorization!: PermissionLevel[]
    /** The ABI-encoded action data. */
    @Struct.field('bytes') data!: Bytes

    static from(object: ActionType | AnyAction, abi?: ABIDef) {
        const data = object.data as any
        if (!Bytes.isBytes(data)) {
            let type: string | undefined
            if (abi) {
                type = ABI.from(abi).getActionType(object.name)
            } else if (!data.constructor || data.constructor.abiName === undefined) {
                throw new Error(
                    'Missing ABI definition when creating action with untyped action data'
                )
            }
            object = {
                ...object,
                data: abiEncode({object: data, type, abi}),
            }
        }
        return super.from(object) as Action
    }

    /** Return true if this Action is equal to given action. */
    equals(other: ActionType | AnyAction) {
        const otherAction = Action.from(other)
        return (
            this.account.equals(otherAction.account) &&
            this.name.equals(otherAction.name) &&
            arrayEquatableEquals(this.authorization, otherAction.authorization) &&
            this.data.equals(otherAction.data)
        )
    }

    /** Return action data decoded as given type or using abi. */
    decodeData<T extends ABISerializableConstructor>(type: T): InstanceType<T>
    decodeData<T extends keyof BuiltinTypes>(type: T): BuiltinTypes[T]
    decodeData(abi: ABIDef): ABISerializable
    decodeData(typeOrAbi: ABISerializableType | ABIDef) {
        if (typeof typeOrAbi === 'string' || (typeOrAbi as ABISerializableConstructor).abiName) {
            return abiDecode({
                data: this.data,
                type: typeOrAbi as string,
            })
        } else {
            const abi = ABI.from(typeOrAbi as ABIDef)
            const type = abi.getActionType(this.name)
            if (!type) {
                throw new Error(`Action ${this.name} does not exist in provided ABI`)
            }
            return abiDecode({data: this.data, type, abi})
        }
    }
}
