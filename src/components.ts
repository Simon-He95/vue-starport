import { isObject } from '@vueuse/core'
import type { DefineComponent } from 'vue'
import { defineComponent, getCurrentInstance, h, inject, isVNode, markRaw, renderList } from 'vue'
import { InjectionOptions, InjectionState } from './constants'
import { optionsProps } from './options'
import type { StarportOptions } from './types'
import { createInternalState } from './state'
import { StarportCraft, StarportProxy } from './core'

/**
 * The carrier component for all the flying Starport components
 * Should be intialized in App.vue only once.
 */
export const StarportCarrier = defineComponent({
  name: 'StarportCarrier',
  setup(_, { slots }) {
    const state = createInternalState(inject(InjectionOptions, {}))
    const app = getCurrentInstance()!.appContext.app
    app.provide(InjectionState, state)

    return () => {
      return [
        slots.default?.(),
        renderList(
          Array.from(state.portMap.entries()),
          ([port, context], idx) => h(
            StarportCraft,
            { key: idx, port, component: context.component },
          ),
        ),
      ]
    }
  },
}) as DefineComponent<{}>

/**
 * The proxy component warpper for the Starport.
 */
export const Starport = defineComponent({
  name: 'Starport',
  inheritAttrs: true,
  props: {
    port: {
      type: String,
      required: true,
    },
    ...optionsProps,
  },
  setup(props, ctx) {
    const state = inject(InjectionState)

    if (!state)
      throw new Error('[Vue Starport] Failed to find <StarportCarrier>, have you initalized it?')

    return () => {
      const slots = ctx.slots.default?.()

      if (!slots)
        throw new Error('[Vue Starport] Slot is required to use <Starport>')
      if (slots.length !== 1)
        throw new Error(`[Vue Starport] <Starport> requires exactly one slot, but got ${slots.length}`)

      const slot = slots[0]
      const component = slot.type as any

      if (!isObject(component) || isVNode(component))
        throw new Error('[Vue Starport] The slot in <Starport> must be a component')

      return h(StarportProxy, {
        ...props,
        port: props.port,
        component: markRaw(component),
        props: slot.props,
        key: props.port,
      })
    }
  },
}) as DefineComponent<{ port: string } & StarportOptions>
