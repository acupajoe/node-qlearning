import typescript from 'rollup-plugin-typescript2'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: './src/index.ts',
  output: {
    file: './dist/index.js',
    format: 'es'
  },
  plugins: [
    typescript(),
    uglify({}, minify)
  ]
}