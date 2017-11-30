const dts = require('dts-bundle')
const config = require('./package.json')
const fs = require('fs')

const main = './dist/qlearning.d.ts'
if (fs.existsSync(main)) {
  let bundle = dts.bundle({
    name: config.name,
    main: main,
    out: 'index.d.ts',
  })

  console.log(`Bundled d.ts files`)
  console.log(` - ${bundle.options.out}`)
  console.log(`Cleaning up filesystem`)
  Object.keys(bundle.fileMap).forEach(path => {
    console.log(` - Deleting ${path}`)
    fs.unlinkSync(path)
  })
} else {
  throw new Error('`rollup -c` should be run before this script')
}