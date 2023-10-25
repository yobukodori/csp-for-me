let my = {
	os : "n/a", // mac|win|android|cros|linux|openbsd
	defaultTitle: "CSP for Me",
	initialized: null,
	enableAtStartup: false,
    enabled : false,
	debug: false,
	noCache: false,
	appliedUrls: "",
	appliedPolicy: "",
	policyForMe: [],
	filterUrls: [],
	filterTypes: ["main_frame","sub_frame"], //v.0.1.1
	target: {
		"content-security-policy": 1,
		"content-security-policy-report-only": 1,
		"x-content-security-policy": 1,
		"x-content-security-policy-report-only": 1,
		"x-webkit-csp":1
	},
	cacheTarget: {
		"cache-control": function(){
			return {
				name: "cache-control",
				value: "no-cache, no-store, must-revalidate"
			}
		},
		"expires": function(){
			return {
				name: "expires",
				value: new Date().toUTCString()
			}
		}
	},
	appliedCounter: 0,
	//====================================================
    init : function(platformInfo) 
	{
		my.initialized = new Promise((resolve, reject)=>{
			try {
				let man = browser.runtime.getManifest();
				if (man.browser_action && man.browser_action.default_title)
					my.defaultTitle = man.browser_action.default_title;
				my.os = platformInfo.os;

				browser.browserAction.onClicked.addListener(function(){
					my.toggle();
				});
				my.updateButton();
				browser.runtime.onMessage.addListener(my.onMessage);

				browser.storage.sync.get(["enableAtStartup","printDebugInfo","noCache","appliedUrls",'appliedPolicy'])
				.then((pref) => {
					my.updateSettings(pref, pref.enableAtStartup);
					resolve();
				})
				.catch(err=>{
					reject(err);
				});
			}
			catch(e){
				reject(e.message);
			}
		});
    },
	//====================================================
	updateSettings : function(pref, fEnable)
	{
		let disabled;
		my.enableAtStartup = pref.enableAtStartup || false;
		my.debug = pref.printDebugInfo || false;
		my.noCache = pref.noCache || false;
		if (typeof pref.appliedUrls === "string"){
			if (pref.appliedUrls !== my.appliedUrls){
				if (my.enabled){
					my.toggle(false);
					disabled = true;
				}
				my.appliedUrls = pref.appliedUrls;
				my.filterUrls = parseUrls(my.appliedUrls);
				my.log("urls changed: ["+my.filterUrls+"]");
			}
		}
		if (typeof pref.appliedPolicy === "string"){
			if (pref.appliedPolicy !== my.appliedPolicy){
				if (my.enabled){
					my.toggle(false);
					disabled = true;
				}
				my.appliedPolicy = pref.appliedPolicy;
				let ro = cspParse(my.appliedPolicy);
				if (ro.error){
					my.policyForMe = [];
					my.log("error: " + ro.error);
				}
				else {
					my.policyForMe = ro.policy;
				}
				my.log('my.policy changed: "'+csp_policy2str(my.policyForMe)+'"');
			}
		}
		if (disabled || (fEnable && ! my.enabled)){
			if (my.filterUrls.length > 0 && my.policyForMe.length > 0)
				my.toggle(true);
		}
	},
	//====================================================
	log : function(str)
	{
		browser.runtime.sendMessage({type:"log",str:str}).catch(err=>{});
	},
	//====================================================
	onMessage : function(message, sender, sendResponse)
	{
		if (message.type === "getStatus"){
			browser.runtime.sendMessage({
				type: "status",
				"status": {
					enabled: my.enabled,
					debug: my.debug,
					noCache: my.noCache,
					appliedUrls: my.appliedUrls,
					filterUrls: my.filterUrls,
					appliedPolicy: my.appliedPolicy,
					policyForMe: my.policyForMe,
					appliedCounter: my.appliedCounter
				}
			});
		}
		else if (message.type === "getSettings"){
			if (my.initialized){
				my.initialized.then(()=>{
					sendResponse({
						enableAtStartup: my.enableAtStartup,
						printDebugInfo: my.debug,
						noCache: my.noCache,
						appliedUrls: my.appliedUrls,
						appliedPolicy: my.appliedPolicy
					});
				})
				.catch(err=>{
					sendResponse({
						error: err,
					});
				});
				return true;
			}
			else {
				sendResponse({
					error: "background.js has not been initialized yet.",
				});
			}
		}
		else if (message.type === "updateSettings"){
			my.updateSettings(message.pref);
		}
		else if (message.type === "toggle"){
			my.toggle();
		}
		else if (message.type === "getEnabled"){
			sendResponse({
				enabled: my.enabled,
				canEnable: my.filterUrls.length > 0 && my.policyForMe.length > 0,
			});
		}
	},
	//====================================================
    toggle : function(state) 
	{
        if(typeof state === 'boolean') {
            my.enabled = state;
        }
        else {
			if (my.enabled = ! my.enabled){
				if (my.filterUrls.length === 0 || my.policyForMe.length ===0){
					my.enabled = false;
					my.log("Error: URL or policy or both not applied");
					return;
				}
			}
        }

        my.updateButton();

        if(my.enabled) {
            browser.webRequest.onHeadersReceived.addListener(
                my.onHeadersReceived
                //,{urls: my.filterUrls, types: my.filterTypes}
                ,{urls: my.filterUrls}
                ,["blocking" ,"responseHeaders"]
            );
        }
        else {
            browser.webRequest.onHeadersReceived.removeListener(
                my.onHeadersReceived
            );
        }
		browser.runtime.sendMessage({type:"statusChange", enabled:my.enabled })
		.catch(e=>{});
    },
	//====================================================
    updateButton : function() 
	{
        let buttonStatus = my.enabled ? 'on' : 'off';
		if (browser.browserAction.setIcon !== undefined)
			browser.browserAction.setIcon({path:{48:'icons/button-48-'+buttonStatus+'.png'}});
		if (browser.browserAction.setTitle !== undefined)
			browser.browserAction.setTitle({title: my.defaultTitle});
    },
	//====================================================
    onHeadersReceived : function(response) 
	{
		function header2str(h){
			return h.name+": "+h.value;
		}
		let urlReported, modified;
		for (let i = response.responseHeaders.length - 1 ; i >= 0 ; i--){
			if (my.target[response.responseHeaders[i].name.toLowerCase()]){
				if (! urlReported){
					if (my.debug) my.log("["+response.type+"] " + response.url.substring(0,60));
					urlReported = true;
				}
				if (my.debug) my.log(header2str(response.responseHeaders[i]));
				let ro = cspMerge(response.responseHeaders[i].value, my.policyForMe);
				if (ro.modified){
					modified = true;
					if (ro.policy){
						if (my.debug){
							my.log("Modified: " + ro.log);
							my.log("Replaced with: " + ro.policy);
						}
						response.responseHeaders[i].value = ro.policy;
					}
					else { // All directives were removed.
						if (my.debug) my.log("Removed: "+header2str(response.responseHeaders[i]));
						response.responseHeaders.splice(i, 1);
					}
				}
			}
		}
		
		if (my.noCache && modified){
			for (let i = response.responseHeaders.length - 1 ; i >= 0 ; i--){
				if (my.cacheTarget[response.responseHeaders[i].name.toLowerCase()]){
					if (my.debug) my.log("Removed: "+header2str(response.responseHeaders[i]));
					response.responseHeaders.splice(i, 1);
				}
			}
			Object.keys(my.cacheTarget).forEach(function(name){
				let i = response.responseHeaders.push(my.cacheTarget[name]()) - 1;
				if (my.debug) my.log("Added: "+header2str(response.responseHeaders[i]));
			});
		}
		
		//let BlockingResponse = {};
		if (modified){
			my.appliedCounter++;
			return {responseHeaders: response.responseHeaders};
		}
    }
};

browser.runtime.getPlatformInfo().then(my.init);
