const { WithSwitch, Case } = require('monocycle/components/Switch')
const pipe = require('ramda/src/pipe')
const map = require('ramda/src/map')
const over = require('ramda/src/over')
const prop = require('ramda/src/prop')
const when = require('ramda/src/when')
const unless = require('ramda/src/unless')
const lensProp = require('ramda/src/lensProp')
const { ensurePlainObj } = require('monocycle/utilities/ensurePlainObj')
const ensureArray = require('ramda-adjunct/lib/ensureArray').default
const isRegExp = require('ramda-adjunct/lib/isRegExp').default
const isFunction = require('ramda-adjunct/lib/isFunction').default

const match = regex => x => x.match(regex)

const WithRouter = pipe(
  ensurePlainObj,
  over(lensProp('resolve'), unless(isFunction, pipe(
    ensureArray,
    map(unless(isFunction, pipe(
      ensurePlainObj,
      over(lensProp('resolve'), when(isRegExp, match)),
      Case
    )))
  ))),
  ({ ...switchOptions }) => {

    return WithSwitch({
      from: (sinks, sources) => sources.History.map(prop('pathname')),
      ...switchOptions,
    })
  }
)

module.exports = {
  default: WithRouter,
  WithRouter,
  Case
}