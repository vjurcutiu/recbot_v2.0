// domUtils.js
export function getXPath(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  return getElementTreeXPath(element);
}

export function getElementTreeXPath(element) {
  const paths = [];
  for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
    let index = 0;
    let hasSameTagSiblings = false;
    const siblings = element.parentNode ? element.parentNode.children : [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling.tagName === element.tagName) {
        if (sibling === element) {
          index++;
          break;
        }
        index++;
        hasSameTagSiblings = true;
      }
    }
    const tagName = element.tagName.toLowerCase();
    const path = hasSameTagSiblings ? `${tagName}[${index}]` : tagName;
    paths.splice(0, 0, path);
  }
  return paths.length ? '/' + paths.join('/') : null;
}

export function getElementSelector(el) {
  if (!el || !el.tagName) return null;
  let selector = el.tagName.toLowerCase();
  if (el.id) selector += `#${el.id}`;
  if (el.classList.length) selector += `.${[...el.classList].join('.')}`;
  return selector;
}

export function getElementDetails(el) {
  if (!el || !el.tagName) return {};
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: el.classList ? Array.from(el.classList) : [],
    selector: getElementSelector(el)
  };
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode('0x' + p1)
  ));
}

function isLatin1(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) return false;
  }
  return true;
}

export function captureInteractableElements() {
  const selector = ['a', 
                    'button', 
                    'input', 
                    'select', 
                    'textarea', 
                    '[role="button"]',
                    '[role="checkbox"]:not(.fa1e2a2fae)',
                    '[role="link"]',
                    '[role="menuitem"]',
                    '[role="switch"]',
                    ].join(',');
  const elements = Array.from(document.querySelectorAll(selector));
  const interactableData = elements.map(el => {
    const text = el.textContent ? el.textContent.trim() : '';
    const safeText = text && !isLatin1(text) ? b64EncodeUnicode(text) : text;
    
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.classList ? Array.from(el.classList) : [],
      xpath: getXPath(el),
      textContent: safeText
    };
  });

  chrome.runtime.sendMessage({
    action: 'recordInteractableElements',
    payload: {
      interactableElements: interactableData
    }
  }, (resp) => {
    if (chrome.runtime.lastError) {
      console.warn('Failed to send interactable elements:', chrome.runtime.lastError.message);
    }
  });
}
