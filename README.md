# csp-for-me - firefox extension
## Adds directive or directive-value to the existing CSP(content-security-policy) header in HTTP response.
## HTTPレスポンスの既存のCSPヘッダにディレクティブあるいはディレクティブ値を追加するFirefox拡張機能
### Usage
![screenshot](https://yobukodori.github.io/freedom/image/csp-for-me-screenshot.jpg)
- **Applied URLs**: Comma-Separated target [URL patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns).
- **CSP Directives**: CSP directives to add.  
e.g. script-src https<z>://</z>myscript.com; img-src https<z>://</z>myimage.com  
Adds new value to end of existing value if same directive name exists.  
Adds new directive to end of header value if same directive name not exists.  
Does nothing if CSP header doesn't exist in request.
- **Save**: Save and apply settings.
- **Apply**: Apply settings. (doesn't save settings).
- **Get Status**: get current status and applied settings.
- **On** enables this addon. **Off** disables this addon. Or clicking cross arrow icon in toolbar toggles enalbe/disable. 
