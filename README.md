# csp-for-me - firefox extension
## Append directive or directive-value to the existing CSP(content-security-policy) header in HTTP response.
## HTTPレスポンスの既存のCSPヘッダにディレクティブあるはディレクティブ値を追加する
webページのセキュリティを高めることはいいことだが（自分で書いた）既知のスクリプトを
自分の責任で読み込む自由を取り戻そうとこのfirefox拡張機能を書いた。  
最初は手っ取り早くCSPヘッダ全体を取り除くつもりだったが、セキュリティを高めるためのCSPヘッダだから出来る限り尊重して
、必要なスクリプトを読み込むための記述を追加する形にした。  
使い方など簡単に説明しておく
- **Applied URLs** に対象とする
[urlパターン](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)を
カンマ区切りで指定する  
- また、対象となる
[リソースタイプ](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType)
はトップページ（main_frame）と iframe 内のページ（sub_frame）  
- **CSP Directives** に追加するディレクティブをCSPヘッダの記述法で指定する。
レスポンスのCSPヘッダに同じディレクティブ名が存在すればその値の末尾に追加の値を挿入する。
同じディレクティブ名がなければヘッダ末尾にディレクティブを追加する。
**レスポンスにCSPヘッダがなければ何もしない**  
例えば script-src https<z>://</z>myscript.com; img-src https<z>://</z>myimage.com
- **Save** は設定を保存し適用する
- **Apply** は設定を適用する（保存はしない）
- **Get Status** は、現在機能が有効か(enable)／現在の適用済みurlパターン(urls)／現在の適用済みCSPディレクティブ(directives)
／実際にHTTPレスポンスを改変した回数(applied)を表示する
- **On** でこの拡張機能を有効にし、**Off** でこの拡張機能を無効にする
