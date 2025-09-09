import { createEnhanceInput } from '../core/EnhanceInputCore'
import { iconList } from '../utils/assetList'
import { isValidEmail } from '../utils/isValidEmail'

export const EIEmailInput = createEnhanceInput({
  config: {
    tooltip: 'Enter email',
    selector: ['Email'],
    hideActualInput: false,
    mountInputOn: 'mount',
    icon: iconList.email,
  },
  onMount: ({ webflowField, globalCleanUp }) => {
    //get the webflow field
    const { element } = webflowField
    //get the parent element
    const parentEl = element.parentElement
    element.placeholder = 'Enter email'

    const setValidationBorder = (value: string) => {
      const isValid = isValidEmail(value)
      if (!isValid && parentEl) {
        parentEl.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`
      } else {
        if (parentEl) parentEl.style.boxShadow = `var(--box-shadows-input-inner),0 0 0 1px var(--colors-blue-border)`
      }
    }
    setValidationBorder(element.value)

    const onChange = () => {
      setValidationBorder(element.value)
    }

    const validateOnInput = () => {
      if (element.value.length === 0) return
      setValidationBorder(element.value)
    }
    const resetOnFocus = () => {
      setValidationBorder(element.value)
    }

    const observer = new MutationObserver(onChange)
    observer.observe(element, {
      childList: true,
      attributes: true,
    })

    element.addEventListener('blur', validateOnInput)
    element.addEventListener('focus', resetOnFocus)
    element.addEventListener('change', onChange)

    //destroy function
    const destroy = () => {
      globalCleanUp?.()
      element.removeEventListener('blur', validateOnInput)
      element.removeEventListener('focus', resetOnFocus)
      element.removeEventListener('change', validateOnInput)
    }

    //return the destroy function
    return { destroy }
  },
})
