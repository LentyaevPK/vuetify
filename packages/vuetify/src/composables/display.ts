// Utilities
import { inject, reactive, ref, toRefs, watchEffect } from 'vue'
import { mergeDeep } from '@/util'

// Globals
import { IN_BROWSER, SUPPORTS_INTERSECTION, SUPPORTS_TOUCH } from '@/util/globals'

// Types
import type { InjectionKey, ToRefs } from 'vue'

export type DisplayBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface DisplayThresholds {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

export interface DisplayOptions {
  mobileBreakpoint?: number | DisplayBreakpoint
  thresholds?: Partial<DisplayThresholds>
}

export interface InternalDisplayOptions {
  mobileBreakpoint: number | DisplayBreakpoint
  thresholds: DisplayThresholds
}

export interface DisplayPlatform {
  android: boolean
  ios: boolean
  cordova: boolean
  electron: boolean
  chrome: boolean
  edge: boolean
  firefox: boolean
  opera: boolean
  win: boolean
  mac: boolean
  linux: boolean
  intersection: boolean
  touch: boolean
  ssr: boolean
}

export interface DisplayInstance {
  xs: boolean
  sm: boolean
  md: boolean
  lg: boolean
  xl: boolean
  smAndDown: boolean
  smAndUp: boolean
  mdAndDown: boolean
  mdAndUp: boolean
  lgAndDown: boolean
  lgAndUp: boolean
  name: DisplayBreakpoint
  height: number
  width: number
  mobile: boolean
  mobileBreakpoint: number | DisplayBreakpoint
  platform: DisplayPlatform
  thresholds: DisplayThresholds
}

export const VuetifyDisplaySymbol: InjectionKey<ToRefs<DisplayInstance>> = Symbol.for('vuetify:display')

const defaultDisplayOptions: DisplayOptions = {
  mobileBreakpoint: 'md',
  thresholds: {
    xs: 600,
    sm: 960,
    md: 1280,
    lg: 1920,
  },
}

const parseDisplayOptions = (options: DisplayOptions = defaultDisplayOptions) => {
  return mergeDeep(defaultDisplayOptions, options) as InternalDisplayOptions
}

// Cross-browser support as described in:
// https://stackoverflow.com/questions/1248081
function getClientWidth () {
  return IN_BROWSER ? Math.max(
    document.documentElement!.clientWidth,
    window.innerWidth
  ) : 0 // SSR
}

function getClientHeight () {
  return IN_BROWSER ? Math.max(
    document.documentElement!.clientHeight,
    window.innerHeight
  ) : 0 // SSR
}

function getPlatform (): DisplayPlatform {
  const userAgent = IN_BROWSER ? window.navigator.userAgent : 'ssr'

  function match (regexp: RegExp) {
    return Boolean(userAgent.match(regexp))
  }

  const android = match(/android/)
  const ios = match(/iphone|ipad|ipod/)
  const cordova = match(/cordova/)
  const electron = match(/electron/)
  const chrome = match(/chrome/)
  const edge = match(/edge/)
  const firefox = match(/firefox/)
  const opera = match(/opera/)
  const win = match(/win/)
  const mac = match(/mac/)
  const linux = match(/linux/)
  const ssr = match(/ssr/)

  return {
    android,
    ios,
    cordova,
    electron,
    chrome,
    edge,
    firefox,
    opera,
    win,
    mac,
    linux,
    intersection: SUPPORTS_INTERSECTION,
    touch: SUPPORTS_TOUCH,
    ssr,
  }
}

export function createDisplay (options?: DisplayOptions): ToRefs<DisplayInstance> {
  const { thresholds, mobileBreakpoint } = parseDisplayOptions(options)

  const height = ref(getClientHeight())
  const platform = getPlatform()
  const state = reactive({} as DisplayInstance)
  const width = ref(getClientWidth())

  function onResize () {
    height.value = getClientHeight()
    width.value = getClientWidth()
  }

  // eslint-disable-next-line max-statements
  watchEffect(() => {
    const xs = width.value < thresholds.xs
    const sm = width.value < thresholds.sm && !xs
    const md = width.value < thresholds.md && !(sm || xs)
    const lg = width.value < thresholds.lg && !(md || sm || xs)
    const xl = width.value >= thresholds.lg
    const name =
      xs ? 'xs'
      : sm ? 'sm'
      : md ? 'md'
      : lg ? 'lg'
      : 'xl'
    const breakpointValue = typeof mobileBreakpoint === 'number' ? mobileBreakpoint : thresholds[mobileBreakpoint]
    const mobile = !platform.ssr
      ? width.value < breakpointValue
      : platform.android || platform.ios || platform.opera

    state.xs = xs
    state.sm = sm
    state.md = md
    state.lg = lg
    state.xl = xl
    state.smAndDown = !(md || lg || xl)
    state.smAndUp = !xs
    state.mdAndDown = !(lg || xl)
    state.mdAndUp = !(xs || sm)
    state.lgAndDown = !xl
    state.lgAndUp = !(xs || sm || md)
    state.name = name
    state.height = height.value
    state.width = width.value
    state.mobile = mobile
    state.mobileBreakpoint = mobileBreakpoint
    state.platform = platform
    state.thresholds = thresholds
  })

  if (IN_BROWSER) {
    window.addEventListener('resize', onResize, { passive: true })
  }

  return toRefs(state)
}

export function useDisplay () {
  const display = inject(VuetifyDisplaySymbol)

  if (!display) throw new Error('Could not find Vuetify display injection')

  return display
}
