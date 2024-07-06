export class AttributeRewriter {
	attributeName: string;
	old_url: string;
	new_url: string;

	constructor(attributeName: string, old_url: string, new_url: string = '') {
		this.attributeName = attributeName;
		this.old_url = old_url;
		this.new_url = new_url;
	}

	element(element: Element) {
		const attribute = element.getAttribute(this.attributeName);
		if (attribute) {
			element.setAttribute(this.attributeName, attribute.replace(this.old_url, this.new_url));
		}
	}
}

export class AttributeRemover {
	element(element: Element) {
		element.remove();
	}
}
