import stripCode from 'rollup-plugin-strip-code'
import replace from 'rollup-plugin-replace'
import pkg from './package.json'
import { install } from 'source-map-support'

install()

const outdir = './test/lib'
const BROWSERONLY = {
  start_comment: 'node-only',
  end_comment: 'end-node-only'
}
const JET = './src/core.js'

// JET Development: Standard (Unminified ES6)
export default [{
  input: JET,
  plugins: [
    stripCode(BROWSERONLY),
    replace({
      delimiters: ['[#', '#]'],
      REPLACE_VERSION: pkg.version
    })
  ],
  output: [
    { file: `${outdir}/jet.js`, format: 'cjs', sourcemap: true }
  ]
}]
