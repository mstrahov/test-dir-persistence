export function makeCloneFromTemplate(templateid,uuid) {
    const template = document.querySelector(templateid);
    const clone = template.content.cloneNode(true);	
    const elements = clone.querySelectorAll('[id]');
    elements.forEach(element => {
	const originalID = element.getAttribute('id');
	element.setAttribute('id', `${originalID}${uuid}`);
    });
    return clone;
}
