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
	let className = /^error\b/i.test(s) ? "error" : /^warning\b/i.test(s) ? "warning" : "";
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
	else if (m.type === "syncAppliedData"){
        document.querySelector('#printDebugInfo').checked = m.debug;
        document.querySelector('#noCache').checked = m.noCache;
		document.querySelector('#appliedUrls').value = m.appliedUrls;
		document.querySelector('#appliedPolicy').value = m.appliedPolicy;
	}
	else if (m.type === "statusChange"){
		onStatusChange(m.enabled);
		log(m.enabled ? "Enabled" : "Disabled");
	}
}

function getBackgroundStatus()
{
	browser.runtime.sendMessage({type: "getStatus"});
}

function onDOMContentLoaded()
{
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

	let e = document.querySelectorAll(".main, input, textarea, button, #log");
	for (let i = 0 ; i < e.length ; i++){
		e[i].classList.add(g_is_pc ? "pc" : "mobile");
	}
	
    let prefs = browser.storage.sync.get(
		['enableAtStartup','printDebugInfo','noCache','appliedUrls','appliedPolicy']);
    prefs.then((pref) => {
        document.querySelector('#enableAtStartup').checked = pref.enableAtStartup || false;
    });
	browser.runtime.sendMessage({type: "syncAppliedData"});
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
browser.runtime.onMessage.addListener(onMessage);
