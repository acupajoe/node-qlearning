import typescript from 'rollup-plugin-typescript2'
import config from './package.json'

export default [
  {
    name: config.name,
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'umd'
    },
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
    plugins: [
      typescript()
    ]
  }
]
