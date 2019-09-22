let dummy_log_cleared;

function log(s)
{
	let e = document.createElement("span");
	e.innerText = s;
	e.appendChild(document.createElement("br"));
	if (/^error:/i.test(s))
		e.className = "error";
	else if (/^warning:/i.test(s))
		e.className = "warning";
	let log = document.querySelector('#log');
	if (! dummy_log_cleared){
		log.innerHTML = "";
		log.appendChild(document.createElement("span"));
		dummy_log_cleared = true;
	}
	log.insertBefore(e, log.firstElementChild);
}

function applySettings(fSave)
{
	let appliedUrls = document.querySelector('#appliedUrls').value;
	let urls =  [];
	if (appliedUrls){
		urls =  parseUrls(appliedUrls);
		if (urls.length == 0){
			log("error: no url in '" + appliedUrls + "'");
			return;
		}
	}
	let appliedPolicy = document.querySelector('#appliedPolicy').value;
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

function onSubmit(e) {
	applySettings(true);
	e.preventDefault();
}

let g_is_android = navigator.userAgent.indexOf('Android') > 0,	g_is_pc = ! g_is_android;

function onStatusChange(fEnabled)
{
	let e = document.querySelector('#toggle');
	e.className = (fEnabled ? "on" : "off") + (g_is_android ? " mobile" : "");
	e.innerText = fEnabled ? "On" : "Off";
}

function onMessage(m, sender, sendResponse)
{
	if (m.type === "log"){
		log(m.str);
	}
	else if (m.type === "status"){
		let s = m["status"];
		log("enabled:"+s.enabled+" debug:"+s.debug+" no-cache:"+s.noCache+" urls:["+s.filterUrls+"]  policy:\""+csp_policy2str(s.policyForMe)+"\" applied:"+s.appliedCounter);
		onStatusChange(s.enabled);
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
	//document.querySelector("#log").innerHTML = "";
	getBackgroundStatus();
	document.querySelector('#getStatus').onclick = function (){
		getBackgroundStatus();
	};
	document.querySelector('#apply').onclick = function (){
		applySettings();
	};
	document.querySelector('#toggle').onclick = function (){
		browser.runtime.sendMessage({type: "toggle"});
	};
	if (g_is_android){
		let e = document.querySelectorAll("form, form input, form button, #log");
		for (let i = 0 ; i < e.length ; i++){
			let cn = e[i].className;
			if (typeof cn !== "string")
				cn = "";
			e[i].className = cn + " mobile";
		}
	}
	
    let prefs = browser.storage.sync.get(
		['enableAtStartup','printDebugInfo','noCache','appliedUrls','appliedPolicy']);
    prefs.then((pref) => {
        document.querySelector('#enableAtStartup').checked = pref.enableAtStartup || false;
        document.querySelector('#printDebugInfo').checked = pref.printDebugInfo || false;
        document.querySelector('#noCache').checked = pref.noCache || false;
		if (typeof pref.appliedUrls === "string")
			document.querySelector('#appliedUrls').value = pref.appliedUrls;
		if (typeof pref.appliedPolicy === "string")
			document.querySelector('#appliedPolicy').value = pref.appliedPolicy;
    });
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
document.querySelector('form').addEventListener('submit', onSubmit);
browser.runtime.onMessage.addListener(onMessage);
