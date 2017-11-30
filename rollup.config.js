import typescript from 'rollup-plugin-typescript2'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import config from './package.json'

export default [
  {
    name: config.name,
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'umd'
    },
    exports: 'named',
    plugins: [
      typescript()
    ]
  },
  {
    name: config.name,
    input: './src/index.ts',
    output: {
      file: './dist/index.common.js',
      format: 'cjs'
    },
    exports: 'named',
    plugins: [
      typescript()
    ]
  }
]
