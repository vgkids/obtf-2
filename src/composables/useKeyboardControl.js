import { ref, onMounted, onUnmounted } from 'vue'

export function useKeyboardControl(documentRef = document) {
  const modifiers = ref([])
  const registry = ref({})
  
  const inputTypes = ['text', 'textarea']
  
  const inputIsActive = () => {
    return inputTypes.includes((documentRef.activeElement?.type || '').toLowerCase())
  }

  const performable = (id) => {
    return true // TEMP, does this cause problems?

    // Always allow the Escape key
    if (id === 'Escape') return true

    // Always allow if there isn't an input with focus
    if (!inputIsActive()) return true

    // Allow if there is at least one non-shift modifier(command, ctrl, alt)
    if (id.split('-').filter(m => m !== 'shift').length > 1) return true

    // Otherwise, an editable area has focus and we ignore
    return false
  }

  const collectModifiers = (event) => {
    if (event.altKey) modifiers.value.push('alt')
    if (event.shiftKey) modifiers.value.push('shift')
    if (event.ctrlKey) modifiers.value.push('ctrl')
  }

  const clearModifiers = (event) => {
    modifiers.value = modifiers.value.filter(m => !['alt', 'shift', 'ctrl'].includes(m))
    if (event.key === 'Meta') {
      modifiers.value = modifiers.value.filter(m => m !== 'command')
    }
  }

  const resetModifiers = () => {
    modifiers.value = []
  }

  const idFromEvent = (event) => {
    collectModifiers(event)
    let mods = [...new Set(modifiers.value)]
    mods.sort()
    mods.push(event.key)
    return mods.join('-')
  }

  const handleKeyDownEvent = async (event) => {
    if (event.key === 'Meta') {
      modifiers.value.push('command')
    } else {
      const id = idFromEvent(event)
      // console.log('keydown event id:', id)
      if (!performable(id)) return false
      await perform(event, id)
    }
  }

  const handleKeyUpEvent = (event) => {
    clearModifiers(event)
  }

  const perform = async (event, id) => {
    const reg = registry.value[id]
    if (!reg) return false

    try {
      if (typeof reg.func === 'function') {
        event.preventDefault()
        await reg.func(reg.args)
      }
    } catch (e) {
      console.error('Keyboard control error:', e)
    }
  }

  const register = (id, name, func, args) => {
    registry.value[id] = {
      name,
      func,
      args
    }
  }

  // Setup event listeners
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDownEvent)
      window.addEventListener('keyup', handleKeyUpEvent)
      window.addEventListener('blur', resetModifiers)
    }
  })

  // Cleanup event listeners
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDownEvent)
      window.removeEventListener('keyup', handleKeyUpEvent)
      window.removeEventListener('blur', resetModifiers)
    }
  })

  return {
    register,
    registry,
    modifiers
  }
}