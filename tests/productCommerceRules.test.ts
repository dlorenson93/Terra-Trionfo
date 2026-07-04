import test from 'node:test'
import assert from 'node:assert/strict'
import { getAllowedCommerceModelsForCategory, isCategoryEligibleForCommerceModel } from '../lib/productCommerceRules'

test('wine is limited to wholesale distribution', () => {
  assert.deepEqual(getAllowedCommerceModelsForCategory('WINE'), ['WHOLESALE'])
  assert.equal(isCategoryEligibleForCommerceModel('WINE', 'WHOLESALE'), true)
  assert.equal(isCategoryEligibleForCommerceModel('WINE', 'MARKETPLACE'), false)
})

test('direct-to-consumer categories allow marketplace only', () => {
  assert.deepEqual(getAllowedCommerceModelsForCategory('PASTA'), ['MARKETPLACE'])
  assert.deepEqual(getAllowedCommerceModelsForCategory('OLIVE_OIL'), ['MARKETPLACE'])
  assert.equal(isCategoryEligibleForCommerceModel('PASTA', 'MARKETPLACE'), true)
  assert.equal(isCategoryEligibleForCommerceModel('PASTA', 'WHOLESALE'), false)
})
