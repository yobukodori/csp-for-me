# CSP for Me - firefox extension
## Adds/Removes directive or directive-value to/from the existing CSP(content-security-policy) header in HTTP response.
## HTTPレスポンスの既存のCSPヘッダにディレクティブあるいはディレクティブ値を追加／削除するFirefox拡張機能
### CSP for Me is available on [AMO](https://addons.mozilla.org/firefox/addon/csp-for-me/).
### Usage
![screenshot](https://yobukodori.github.io/freedom/image/csp-for-me-screenshot.jpg)
- **Enable at startup**: Enable this feature when the browser is started.  
- **Print debug info**:  Output debug information at the bottom of the Options tab.  
- **no-cache**:  Controls the Cache-Control header so that CSP-modified pages are not cached.  
- **Theme**: Select a color theme for the settings page.  As soon as you select a theme, it will be reflected in the settings page, but only temporarily. Apply or Save as needed.
- **Applied URLs**: Comma-Separated target [URL patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns).
- **Applied Policy**: CSP directives to add or remove.  
Add: Follow the CSP syntax.  
e.g. `script-src 'unsafe-inline' https://yobukodori.github.io`  
Remove: 'remove': \<value\> or \<regular expression\> or 'directive'  
e.g. `script-src 'remove':https://www.google-analytics.com 'remove':/^'(nonce|sha256|sha384|sha512)-/; report-uri 'remove':'directive'`  
Remove CSP header itself: When no-csp is written as an original directive, the CSP header itself is deleted.  
e.g. `no-csp`  
Adds new value to end of existing value if same directive name exists.  
Adds new directive to end of header value if same directive name not exists.  
Does nothing if CSP header doesn't exist in response.
- **Save**: Save and apply settings.
- **Apply**: Apply settings. (doesn't save settings).
- **Get Status**: get current status and applied settings.
- **On** enables this feature. **Off** disables this feature. Or clicking  lock icon in toolbar will bring up a pop-up menu where you can turn it on/off and open the settings page.   
- **Clear Log**: Clear log.
- **Export Settings**: Export settings to the file. It is the currently applied settings that are exported, not the saved settings.
- **Import Settings**: Import and apply settings from the file. Do not save.
  
If CSP for Me doesn't work, reload the page several times. The browser may be loading the cache of the page before CSP modification.
