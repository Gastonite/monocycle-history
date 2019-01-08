

const { Stream: $ } = require('xstream')
const KindReducer = require('utilities/kind')
const { WithSwitch } = require('../Switch')
const prop = require('ramda/src/prop')
const match = require('ramda/src/match')
const pipe = require('ramda/src/pipe')
const isArray = require('lodash/isArray')
const isRegExp = require('lodash/isRegExp')
const { div } = require('@cycle/dom')
const dropRepeats = require('xstream/extra/dropRepeats').default

const Pathname = ({ tagName, pathname, search, hash }) => {
  return tagName === 'A'
    ? pathname + search + (hash === void 0 ? '' : hash)
    : '/'
}

const WithRouter = ({
  first = true,
  isStateful = false,
  resolve,
  View,
  historySinkName = 'History',
  Default = () => ({ DOM: $.of(div('No route found')) })
} = {}, Cycle) => {

  Cycle.log('WithRouter()')

  if (isArray(resolve)) {

    resolve = resolve.map((resolver, i) => {

      return {
        ...resolver,
        resolve: isRegExp(resolver.resolve)
          ? pipe(
            match(resolver.resolve),
            x => x.length > 0 ? x : false
          )
          : resolver.resolve
      }
    })
  }

  const RouterSinks = (sinks, sources) => {

    return ({
      ...sinks,
      path$: sources[historySinkName]
        .map(prop('pathname'))
        .compose(dropRepeats())
    })
  }


  const StatefulRouterSinks = (sinks, sources) => {

    const routerState$ = sources.onion.state$
      .filter(prop('isRouter'))
      .compose(dropRepeats((x, y) => x.route === y.route))
      .remember()

    const route$ = routerState$.map(prop('route'))

    return {
      ...RouterSinks(sinks, sources),
      routerState$,
      route$
    }
  }

  const withRouter = (component = Cycle.Empty) => Cycle(component)
    .after(isStateful ? StatefulRouterSinks : RouterSinks)
    .map(WithSwitch({
      first,
      View,
      from: isStateful ? 'route$' : 'path$',
      resolve,
      Default
    }))

  return !isStateful
    ? withRouter
    : f => withRouter(f)
      .transition({
        name: 'selectRoute',
        from: 'path$',
        reducer: route => (state = {}) => ({
          ...state,
          route
        })
      })
      .transition({
        name: 'initRouter',
        reducer: (state = {}) => state.isRouter ? state : {
          ...state,
          isRouter: true
        }
      })
}

module.exports = {
  Pathname,
  WithRouter,
  default: WithRouter
}