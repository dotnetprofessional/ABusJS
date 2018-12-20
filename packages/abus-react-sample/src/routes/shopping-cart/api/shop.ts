/**
 * Mocking client-server processing
 */
import * as _products from './products.json';

const TIMEOUT = 100

export default {
  getProducts: (cb, timeout) => setTimeout(() => { debugger; cb(_products) }, timeout || TIMEOUT),
  buyProducts: (payload, cb, timeout) => setTimeout(() => cb(), timeout || TIMEOUT)
}
