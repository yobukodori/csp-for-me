# CSP for Me - firefox extension
## Adds/Removes directive or directive-value to the existing CSP(content-security-policy) header in HTTP response.
## HTTPレスポンスの既存のCSPヘッダにディレクティブあるいはディレクティブ値を追加／削除するFirefox拡張機能
### Usage
![screenshot](https://yobukodori.github.io/freedom/image/csp-for-me-screenshot.jpg)
- **Applied URLs**: Comma-Separated target [URL patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns).
- **Applied Policy**: CSP directives to add or remove.  
Add: Follow the CSP syntax.  
e.g. `script-src 'unsafe-inline' https://yobukodori.github.io`  
Remove: 'remove': \<value\> or \<regular expression\> or 'directive'  
e.g. `script-src 'remove':https://www.google-analytics.com 'remove':/^'(nonce|sha256|sha384|sha512)-/; report-uri 'remove':'directive'`  
Adds new value to end of existing value if same directive name exists.  
Adds new directive to end of header value if same directive name not exists.  
Does nothing if CSP header doesn't exist in response.
- **Save**: Save and apply settings.
- **Apply**: Apply settings. (doesn't save settings).
- **Get Status**: get current status and applied settings.
- **On** enables this addon. **Off** disables this addon. Or clicking  lock icon in toolbar toggles enable/disable. 
  
If CSP for Me doesn't work, try clearing your browser's cache. The browser may be loading the cache of the page before CPS modification.
