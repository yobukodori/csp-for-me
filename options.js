function alert(msg){
	const id = "alert";
	let e = document.getElementById(id);
	if(! e){
		e = document.createElement("div");
		e.id = id;
		setTimeout(function(e){
			document.addEventListener("click", function handler(ev){
				document.removeEventListener("click", handler);
				e.remove(); 
			});
		}, 0, e);
		document.body.appendChild(e);
	}
	let m = document.createElement("div");
	m.classList.add("message");
	msg.split("\n").forEach((line,i) =>{
		if (i > 0){ m.appendChild(document.createElement("br")); }
		let span = document.createElement("span");
		span.appendChild(document.createTextNode(line));
		m.appendChild(span);
	});
	e.appendChild(m);
}

function clearLog()
{
	let log = document.querySelector('#log');
	log.innerHTML = "";
	log.appendChild(document.createElement("span"));
}

let dummy_log_cleared;

function log(s)
{
	let log = document.querySelector('#log');
	if (! dummy_log_cleared){
		log.innerHTML = "";
		log.appendChild(document.createElement("span"));
		dummy_log_cleared = true;
	}
	if (! (s = s.replace(/\s+$/, ""))){
		return;
	}
	let className = /^[a-z]*error\b/i.test(s) ? "error" : /^warning\b/i.test(s) ? "warning" : "";
	let a = s.split("\n");
	for (let i = a.length - 1 ; i >= 0 ; i--){
		let s = a[i].replace(/\s+$/, "");
		let e = document.createElement("span");
		let col = 0, indent = 0;
		while (s[0] === '\t' || s[0] === ' '){
			indent += s[0] === ' ' ? 1 : col === 0 ? 4 : (4 - col % 4);
			s = s.substring(1);
		}
		e.appendChild(document.createTextNode((indent > 0 ? "\u00A0".repeat(indent) : "") + s));
		e.appendChild(document.createElement("br"));
		if (className){ e.classList.add(className); }
		log.insertBefore(e, log.firstElementChild);
	}
}

function applySettings(fSave)
{
	let appliedUrls = document.querySelector('#appliedUrls').value;
	appliedUrls = appliedUrls.trim().replace(/\s+/g, ' ');
	let urls =  [];
	if (appliedUrls){
		urls =  parseUrls(appliedUrls);
		if (urls.length == 0){
			log("error: no url in '" + appliedUrls + "'");
			return;
		}
	}
	let appliedPolicy = document.querySelector('#appliedPolicy').value;
	appliedPolicy = appliedPolicy.trim().replace(/\s+/g, ' ');
	let policy = [];
	if (appliedPolicy){
		let ro = cspParse(appliedPolicy);
		if (ro.error){
			log("error: " + ro.error);
			return;
		}
		policy = ro.policy;
		if (policy.length == 0){
			log("error: no directive in '" + appliedPolicy + "'");
			return;
		}
	}
	let pref = {
		enableAtStartup : document.querySelector('#enableAtStartup').checked,
		printDebugInfo : document.querySelector('#printDebugInfo').checked,
		noCache: document.querySelector('#noCache').checked,
		colorScheme: document.querySelector('#colorScheme').value,
		appliedUrls : appliedUrls,
		appliedPolicy : appliedPolicy
	};
	if (urls.length == 0)
		log("warning: no url.");
	if (policy.length == 0)
		log("warning: no directive.");
	if (fSave){
		browser.storage.sync.set(pref);
		log("Settings saved.");
	}
	log("Apllying settings.");
	browser.runtime.sendMessage({type:"updateSettings",pref:pref});
}

let g_is_android = navigator.userAgent.indexOf('Android') > 0,	g_is_pc = ! g_is_android;

function onStatusChange(fEnabled)
{
	let e = document.querySelector('#toggle');
	e.className = (fEnabled ? "on" : "off") + " " + (g_is_pc ? "pc" : "mobile");
	e.innerText = fEnabled ? "Off (Now On)" : "On (Now Off)";
}

function onMessage(m, sender, sendResponse)
{
	if (m.type === "log"){
		log(m.str);
	}
	else if (m.type === "status"){
		let s = m["status"];
		log("enabled:" + s.enabled + " debug:" + s.debug + " no-cache:" + s.noCache
			+ " applied:" + s.appliedCounter + "\n"
			+ "appliedUrls: " + s.appliedUrls + "\n"
			+ "appliedPolicy: " + s.appliedPolicy);
		onStatusChange(s.enabled);
	}
	else if (m.type === "statusChange"){
		onStatusChange(m.enabled);
		log(m.enabled ? "Enabled" : "Disabled");
	}
}

function getBackgroundStatus()
{
	browser.runtime.sendMessage({type: "getStatus"})
	.catch(err=>log("Error on sendMessage: " + err));
}

function setupSettings(v){
	let colorScheme = ["light", "dark"].includes(v.colorScheme) ? v.colorScheme : "auto";
	document.querySelector('#colorScheme').value = colorScheme;
	setupColorScheme(colorScheme);
	document.querySelector('#enableAtStartup').checked = !! v.enableAtStartup;
	document.querySelector('#printDebugInfo').checked = !! v.printDebugInfo;
	document.querySelector('#noCache').checked = !! v.noCache;
	document.querySelector('#appliedUrls').value = v.appliedUrls || "";
	document.querySelector('#appliedPolicy').value = v.appliedPolicy || "";
}

function onDOMContentLoaded()
{
	let man = browser.runtime.getManifest(), 
		appName = man.name, // man.browser_action.default_title, 
		appVer = "v." + man.version;
	document.querySelector('#appName').textContent = appName;
	document.querySelector('#appVer').textContent = appVer;

	document.querySelector('#colorScheme').addEventListener('change', ev=>{
		setupColorScheme(ev.target.value);
	});

	getBackgroundStatus();
	document.querySelector('#save').addEventListener('click', ev=>{
		applySettings(true);
	});
	document.querySelector('#apply').onclick = function (){
		applySettings();
	};
	document.querySelector('#getStatus').onclick = function (){
		getBackgroundStatus();
	};
	document.querySelector('#toggle').onclick = function (){
		browser.runtime.sendMessage({type: "toggle"});
	};
	document.querySelector('#clearLog').addEventListener('click', ev=>{
		clearLog();
	});

	document.querySelector('#exportSettings').addEventListener('click', ev=>{
		browser.runtime.sendMessage({type: "getSettings"})
		.then(v=>{
			if (v.error){
				alert("Error on getSettings: " + v.error);
			}
			else {
				const date2str = function(){
					const f = n => ("0" + n).slice(-2);
					let d = new Date();
					return d.getFullYear() + f(d.getMonth() + 1) + f(d.getDate()) + "-" + f(d.getHours()) + f(d.getMinutes()) + f(d.getSeconds());
				};
				let man = browser.runtime.getManifest(), 
					appName = man.name,
					appVer = "v." + man.version;
				v.app = appName + " " + appVer;
				let settingsData = JSON.stringify(v);
				let e = document.createElement("a");
				e.href = URL.createObjectURL(new Blob([settingsData], {type:"application/json"}));
				e.download = appName.toLowerCase().replace(/\s/g, "-") + "-" + date2str() + ".json";
				e.click();
			}
		})
		.catch(err=>{
			alert("Error on sendMessage('getSettings'): " + err);
		});
	});

	document.querySelector('#importSettings').addEventListener('click', ev=>{
		let e = document.createElement("input");
		e.type = "file";
		e.accept = "application/json";
		e.addEventListener("change", ev =>{
			let file = ev.target?.files[0];
			if (file){
				const reader = new FileReader();
				reader.addEventListener("load", ev =>{
					try {
						const v = JSON.parse(reader.result);
						if (! v?.app?.startsWith(appName)){
							throw Error("invalid settings data");
						}
						setupSettings(v);
						applySettings();
						log("Setting data successfully imported.");
					}
					catch (e){
						const msg = e.name + ": " + e.message;
						log(msg), alert(msg);
					}
				});
				reader.readAsText(file);
			}
		});
		e.click();
	});

	let e = document.querySelectorAll(".main, input, textarea, button, #log");
	for (let i = 0 ; i < e.length ; i++){
		e[i].classList.add(g_is_pc ? "pc" : "mobile");
	}
	
	browser.runtime.sendMessage({type: "getSettings"})
	.then(v=>{
		if (v.error){
			alert("Error on getSettings: " + v.error);
		}
		else {
			setupSettings(v);
			window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ev=> onPrefersColorSchemeDarkChange(ev));
		}
	})
	.catch(err=>{
		alert("Error on sendMessage('getSettings'): " + err);
	});
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
browser.runtime.onMessage.addListener(onMessage);
