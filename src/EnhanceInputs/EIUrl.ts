import { createEnhanceInput } from '../core/EnhanceInputCore';
import { autoResizeTextarea } from '../utils/autoResizeTextarea';
import { iconList } from '../utils/assetList';
import makeElMutationChangeSafe from '../utils/makeElMutationChangeSafe';
import { isValidURL } from '../utils/isValidURL';

export const EIUrlInput = createEnhanceInput({
	config: {
		tooltip: 'Enter URL',
		selector: ['URL'],
		hideActualInput: true,
		mountInputOn: 'mount',
		icon: iconList.url,
	},
	onMount: ({ webflowField, changeValue, globalCleanUp }) => {
		//get the webflow field
		const { element, value, defaultDisplay } = webflowField;
		//get the parent element
		const parentEl = element.parentElement;
		//create the textarea element
		const textareaEl = document.createElement('textarea');
		//make the textarea element mutation change safe
		makeElMutationChangeSafe(textareaEl);
		//get the value
		const getValue = (value: string) => {
			return value
				.split(';')
				.map(v => v.trim())
				.join('\n');
		};
		//get the final value
		const getFinalValue = (value: string) => {
			return value
				.split('\n')
				.map(v => v.trim().replace(';', ''))
				.join('; ');
		};
		//append the textarea to the parent element
		parentEl?.appendChild(textareaEl);
		//change value function
		const onChange = () => {
			changeValue(getFinalValue(textareaEl.value));
			//auto resize the textarea
			autoResizeTextarea(textareaEl);
			//validate the URL
			const isValid = isValidURL(textareaEl.value);

			if (!isValid && parentEl) {
				parentEl.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`;
				return;
			} else {
				if (parentEl)
					parentEl.style.boxShadow = `var(--box-shadows-input-inner),0 0 0 1px var(--colors-blue-border)`;
			}
		};


		//validate on mount
		const isInitialValid = isValidURL(value);
		if (!isInitialValid && parentEl) {
			parentEl.style.boxShadow = `var(--box-shadows-input-inner), var(--wf-designer--inputOutlineFocusError)`;
		} else {
			if (parentEl)
				parentEl.style.boxShadow = `var(--box-shadows-input-inner),0 0 0 1px var(--colors-blue-border)`;
		}

		const onInputElChange = () => {
			if (element.value !== getFinalValue(textareaEl.value)) {
				textareaEl.value = getValue(element.value);
			}
		};

		const observer = new MutationObserver(onInputElChange);
		observer.observe(element, {
			childList: true,
			attributes: true,
		});
		//destroy function
		const destroy = () => {
			textareaEl.removeEventListener('blur', blurDestroy);
			textareaEl.removeEventListener('input', onChange);
			textareaEl.remove();
			observer.disconnect();
			globalCleanUp?.();
		};

		const blurDestroy = () => destroy();

		//set the value of the textarea
		textareaEl.value = getValue(value);
		//add the class names of the element to the textarea
		element.classList.forEach(className => textareaEl.classList.add(className));
		//set the style of the textarea
		textareaEl.style.cssText = element.style.cssText;
		textareaEl.style.display = defaultDisplay;
		textareaEl.style.overflow = 'hidden';
		textareaEl.style.resize = 'none';
		textareaEl.style.width = '100%';
		//add the event listeners
		textareaEl.addEventListener('blur', blurDestroy);
		//add the input event listener
		textareaEl.addEventListener('input', onChange);
		//auto resize the textarea
		autoResizeTextarea(textareaEl);

		//return the destroy function
		return {
			destroy,
		};
	},
});


