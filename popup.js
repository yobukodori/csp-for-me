function onDOMContentLoaded(platformInfo){
	let os = platformInfo.os, is_mobile = os === "android", is_pc = ! is_mobile;
	function error(msg){
		let e = document.createElement("div");
		e.appendChild(document.createTextNode("Error: " + msg));
		document.body.insertBefore(e, document.body.firstChild);
	}
	document.querySelector('#enable-future').addEventListener('change', ev=>{
		browser.runtime.sendMessage({type: "toggle"});
	});
	document.querySelector('#settings').addEventListener('click', ev=>{
		if (is_mobile){
			let url = browser.runtime.getURL("options.html");
			browser.tabs.query({})
			.then(tabs=>{
				let found;
				for (let i = 0 ; i < tabs.length ; i++){
					let tab = tabs[i];
					if (tab.url === url){
						found = true;
						browser.tabs.update(tab.id, {active: true})
						.then(tab=>{ window.close(); })
						.catch(error);
						break;
					}
				}
				if (! found){
					browser.tabs.create({url: url})
					.then(tab=>{ window.close(); })
					.catch(error);
				}
			})
			.catch(error);
		}
		else {
			browser.runtime.openOptionsPage()
			.then(()=>{ window.close(); })
			.catch(error);
		}
	});

	document.querySelectorAll("body, input, textarea, button").forEach(e=>{
		e.classList.add(is_pc ? "pc" : "mobile");
	});

	browser.runtime.sendMessage({type: "getEnabled"})
	.then(status=>{
		let checkbox = document.querySelector('#enable-future');
		checkbox.checked = status.enabled;
	})
	.catch(error);
}

document.addEventListener('DOMContentLoaded', ev=>{
	browser.runtime.getPlatformInfo().then(onDOMContentLoaded);
});
