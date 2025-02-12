# CSP for Me beta (version 0.3.9) - firefox extension
## This is the description of version 0.3.9, which is a beta version.  
v.0.3.9 Support multiple profiles. etc.
- Support multiple profiles
- Added create-csp directive to add the CSP header to the response.
## Adds/Removes directive or directive-value to/from the existing CSP(content-security-policy) header in HTTP response. Can also add the CSP header if one does not exist.
## HTTPレスポンスの既存のCSPヘッダにディレクティブあるいはディレクティブ値を追加／削除するFirefox拡張機能。CSPヘッダがない時に追加することも可能
### CSP for Me beta is available on [AMO](https://addons.mozilla.org/firefox/addon/csp-for-me-beta/).
### Usage
![screenshot](https://yobukodori.github.io/freedom/image/csp-for-me-v039-screenshot.jpg)
- **Enable at startup**: Enable this feature when the browser is started.  
- **Print debug info**:  Output debug information at the bottom of the Options tab.  
- **no-cache**:  Controls the Cache-Control header so that CSP-modified pages are not cached.  
- **Theme**: Select a color theme for the settings page.  As soon as you select a theme, it will be reflected in the settings page, but only temporarily. Apply or Save as needed.
- **Profiles**: can have multiple profiles.
  1. Lines that do not start with an alphabet will be ignored.
  1. A line that starts with an alphabet will be one profile.
  1. A profile starts with <code>applied-urls</code> directive. This specifies the comma separated list of <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns">URLs</a> to target.
  1. Next comes <code>applied_types</code> directive, which specifies the comma separated list of target <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType">resource types</a>. This is optional. If omitted, all resource types are targeted.
  1. Finally, &lt;Applied Policy> follows.
- **Applied Policy**: CSP directives to add or remove.  
**Add**: Follow the CSP syntax.  
e.g. `script-src 'unsafe-inline' https://yobukodori.github.io`  
Adds new value to end of existing value if same directive name exists.  
Adds new directive to end of header value if same directive name not exists.  
If the CSP header does not exist and `create-csp` is not specified, nothing will be done.  
**Remove**: 'remove': \<value\> or \<regular expression\> or 'directive'  
e.g. `script-src 'remove':https://www.google-analytics.com 'remove':/^'(nonce|sha256|sha384|sha512)-/; report-uri 'remove':'directive'`  
**Remove CSP header itself**: When an own directive `no-csp` is written, the existing CSP header itself will be deleted.  
e.g. `no-csp`  
**Create CSP header**: When an own directive `create-csp` is written, the CSP header will be created if it does not exist or has been removed by `no-csp`.
e.g. `create-csp; script-src 'none'`  
- **Sample Profiles**: 
	```
	applied-urls *://x.com/*, *://mobile.x.com/*; script-src 'remove':/^'nonce-/; report-uri 'remove':'directive'
	applied-urls *://github.com/*; script-src 'unsafe-inline'
	# following profile is just to show how to use create-csp and has no usefulness.
	applied-urls https://abcnews.go.com/; applied-types main_frame; create-csp; img-src 'none'
	```
- **Save**: Save and apply settings.
- **Apply**: Apply settings. (doesn't save settings).
- **Get Status**: get current status and applied settings.
- **On** enables this feature. **Off** disables this feature. Or clicking  lock icon in toolbar will bring up a pop-up menu where you can turn it on/off and open the settings page.   
- **Clear Log**: Clear log.
- **Export Settings**: Export settings to the file. It is the currently applied settings that are exported, not the saved settings.
- **Import Settings**: Import and apply settings from the file. Do not save.
  
If CSP for Me doesn't work, reload the page several times. The browser may be loading the cache of the page before CSP modification.

