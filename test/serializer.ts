import * as assert from 'assert'
import 'mocha'

import {Serializer} from '../src/serializer'

import {Name} from '../src/chain/name'
import {ABI} from '../src/chain/abi'
import {UInt64} from '../src/chain/integer'
import {Asset} from '../src/chain/asset'
import {PublicKey} from '../src/chain/public-key'
import {Signature} from '../src/chain/signature'

suite('serializer', function () {
    test('array', function () {
        const data = '0303666f6f036261720362617a'
        const array = ['foo', 'bar', 'baz']
        assert.equal(Serializer.encode({object: array, type: 'string[]'}).hexString, data)
        assert.deepEqual(Serializer.decode({data, type: 'string[]'}), array)
        assert.throws(() => {
            Serializer.encode({object: 'banana', type: 'string[]'})
        })
        assert.throws(() => {
            Serializer.decode({object: 'banana', type: 'string[]'})
        })
    })

    test('name', function () {
        const data = '000000005c73285d'
        const object = Name.from('foobar')
        const json = '"foobar"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.deepEqual(Serializer.decode({data, type: Name}), object)
        assert.deepEqual(Serializer.decode({json, type: 'name'}), object)
        assert.deepEqual(Name.from(UInt64.from('6712742083569909760')), object)
        assert.equal(JSON.stringify(object), json)
        assert.equal(object.value.toString(), '6712742083569909760')
    })

    test('asset', function () {
        const data = '393000000000000004464f4f00000000'
        const object = Asset.from('1.2345 FOO')
        const json = '"1.2345 FOO"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: Asset})), json)
        assert.equal(JSON.stringify(Serializer.decode({json, type: 'asset'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('asset symbol', function () {
        const data = '04464f4f00000000'
        const object = Asset.Symbol.from('4,FOO')
        const json = '"4,FOO"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: Asset.Symbol})), json)
        assert.equal(JSON.stringify(Serializer.decode({json, type: 'symbol'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('struct', function () {
        const abi = ABI.from({
            structs: [
                {
                    base: '',
                    name: 'foo',
                    fields: [
                        {name: 'one', type: 'string'},
                        {name: 'two', type: 'int8'},
                    ],
                },
                {
                    base: 'foo',
                    name: 'bar',
                    fields: [
                        {name: 'three', type: 'name?'},
                        {name: 'four', type: 'string[]?'},
                    ],
                },
            ],
        })
        const object = {
            one: 'one',
            two: 2,
            three: 'two',
            four: ['f', 'o', 'u', 'r'],
        }
        const enc = Serializer.encode({object, abi, type: 'bar'})
        const dec = Serializer.decode({data: enc, type: 'bar', abi})
        // todo verify with swift-eosio
    })

    test('string', function () {
        const data = '0b68656c6c6f20776f726c64'
        const object = 'hello world'
        const json = '"hello world"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: 'string'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('bool', function () {
        const data = '01'
        const object = true
        const json = 'true'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: 'bool'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('public key', function () {
        const data = '000223e0ae8aacb41b06dc74af1a56b2eb69133f07f7f75bd1d5e53316bff195edf4'
        const object = PublicKey.from('PUB_K1_5AHoNnWetuDhKWSDx3WUf8W7Dg5xjHCMc4yHmmSiaJCFvvAgnB')
        const json = '"PUB_K1_5AHoNnWetuDhKWSDx3WUf8W7Dg5xjHCMc4yHmmSiaJCFvvAgnB"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: PublicKey})), json)
        assert.equal(JSON.stringify(Serializer.decode({json, type: 'public_key'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('signature', function () {
        const data =
            '00205150a67288c3b393fdba9061b05019c54b12bdac295fc83bebad7cd63c7bb67d5cb8cc220564da006240a58419f64d06a5c6e1fc62889816a6c3dfdd231ed389'
        const object = Signature.from(
            'SIG_K1_KfPLgpw35iX8nfDzhbcmSBCr7nEGNEYXgmmempQspDJYBCKuAEs5rm3s4ZuLJY428Ca8ZhvR2Dkwu118y3NAoMDxhicRj9'
        )
        const json =
            '"SIG_K1_KfPLgpw35iX8nfDzhbcmSBCr7nEGNEYXgmmempQspDJYBCKuAEs5rm3s4ZuLJY428Ca8ZhvR2Dkwu118y3NAoMDxhicRj9"'

        assert.equal(Serializer.encode({object}).hexString, data)
        assert.equal(JSON.stringify(Serializer.decode({data, type: Signature})), json)
        assert.equal(JSON.stringify(Serializer.decode({json, type: 'signature'})), json)
        assert.equal(JSON.stringify(object), json)
    })

    test('optionals', function () {
        assert.equal(Serializer.decode({data: '00', type: 'public_key?'}), null)
        assert.equal(Serializer.decode({data: '0101', type: 'bool?'}), true)
        assert.equal(Serializer.encode({object: null, type: 'signature?'}).hexString, '00')
        assert.throws(() => {
            Serializer.decode({object: null, type: 'bool'})
        })
        assert.throws(() => {
            Serializer.encode({object: null, type: 'bool'})
        })
    })

    test('api', function () {
        assert.throws(() => {
            Serializer.decode({json: '"foo"', type: 'santa'})
        })
        assert.throws(() => {
            const BadType: any = {abiName: 'santa'}
            Serializer.decode({json: '"foo"', type: BadType})
        })
        assert.throws(() => {
            const BadType: any = {abiName: 'santa'}
            Serializer.encode({object: 'foo', type: BadType})
        })
        assert.throws(() => {
            Serializer.encode({object: 42})
        })
    })
})
