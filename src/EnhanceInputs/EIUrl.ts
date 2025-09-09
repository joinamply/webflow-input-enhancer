import { createEnhanceInput } from '../core/EnhanceInputCore'
import { iconList } from '../utils/assetList'
import { isValidURL } from '../utils/isValidURL'

export const EIUrlInput = createEnhanceInput({
  config: {
    tooltip: 'Enter URL',
    selector: ['URL'],
    hideActualInput: false,
    mountInputOn: 'mount',
    icon: iconList.url,
  },
  onMount: ({ webflowField, globalCleanUp }) => {
    //get the webflow field
    const { element } = webflowField
    //get the parent element
    const parentEl = element.parentElement
    element.placeholder = 'Enter URL'

    const setValidationBorder = (value: string) => {
      const isValid = isValidURL(value)
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
