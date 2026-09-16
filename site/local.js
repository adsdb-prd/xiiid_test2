/* Local-only adaptation: saved CMS data and official outbound links. */
(() => {
  const localUrl = input => {
    const url = new URL(String(input), location.href);
    if (url.pathname.includes('154adc4df997f6b1fe8680543e03d926ec51543b-1200x630')) return new URL('/brand/news/news-1.jpg', location.origin).href;
    if (url.hostname.endsWith('.api.sanity.io')) return new URL('/content/home-response.json?v=11', location.origin).href;
    if (url.hostname === 'cdn.sanity.io') return new URL('/sanity' + url.pathname, location.origin).href;
    return String(input);
  };
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => nativeFetch(input instanceof Request ? new Request(localUrl(input.url), input) : localUrl(input), init);
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...options) {
    return nativeOpen.call(this, method, localUrl(url), ...options);
  };
  const imageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const localSrcset = value => String(value).replace(/https:\/\/cdn\.sanity\.io\/[^\s,]+/g, url => localUrl(url));
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...imageSrc,
    set(value) { imageSrc.set.call(this, localUrl(value)); }
  });
  const imageSrcset = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'srcset');
  Object.defineProperty(HTMLImageElement.prototype, 'srcset', {
    ...imageSrcset,
    set(value) { imageSrcset.set.call(this, localSrcset(value)); }
  });
  const nativeAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (this.tagName === 'IMG' && name === 'src') value = localUrl(value);
    if (this.tagName === 'IMG' && (name === 'srcset' || name === 'data-srcset')) value = localSrcset(value);
    return nativeAttribute.call(this, name, value);
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href === '/' || href.startsWith('mailto:')) return;
    const url = new URL(href, location.href);
    if (url.origin === location.origin && !/\.(?:png|svg|jpg|woff2|json)$/.test(url.pathname)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.open('https://xiiid.ai' + url.pathname + url.search + url.hash, '_blank', 'noopener,noreferrer');
    }
  }, true);
  addEventListener('DOMContentLoaded', () => {
    const mark = () => { if(document.title !== 'XIIID AI Labs') document.title = 'XIIID AI Labs'; };
    mark();
    new MutationObserver(mark).observe(document.querySelector('title'), {childList:true});
    const labelNavigation = () => {
      const toggle = document.querySelector('.header-nav-mobile-toggle');
      if(toggle) {
        const open=toggle.classList.contains('is-open');
        toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
        toggle.setAttribute('aria-expanded',String(open));
      }
      document.querySelector('.header-nav-mobile-back')?.setAttribute('aria-label','Back to navigation');
    };
    labelNavigation();
    new MutationObserver(labelNavigation).observe(document.getElementById('__nuxt'),{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape') {
        const toggle=document.querySelector('.header-nav-mobile-toggle.is-open');
        if(toggle) {toggle.click();toggle.focus();}
      }
    });
  });
})();
