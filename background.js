let my = {
	dmp: new diff_match_patch(),
	os : "n/a", // mac|win|android|cros|linux|openbsd
    enabled : false,
	debug: false,
	appliedUrls: "",
	cspDirectives: "",
	directivesToAppend: [],
	filterUrls: [],
	filterTypes: ["main_frame","sub_frame"], //"sub_frame","xmlhttprequest"
	target: {
		"content-security-policy": 1,
		"content-security-policy-report-only": 1,
		"x-content-security-policy": 1,
		"x-content-security-policy-report-only": 1,
		"x-webkit-csp":1
	},
	appliedCounter: 0,
	//====================================================
    init : function(platformInfo) {
		//console.info("CSP4M initializing...");

		my.os = platformInfo.os;

        browser.browserAction.onClicked.addListener(function(){
            my.toggle();
        });

        let prefs = browser.storage.sync.get(
			["enableAtStartup","printDebugInfo","appliedUrls",'cspDirectives']);
        prefs.then((pref) => {
			my.updateSettings(pref, pref.enableAtStartup);
        });

        // update button
        my.updateButton();
		
		browser.runtime.onMessage.addListener(my.onMessage);
    },
	//====================================================
	updateSettings : function(pref, fEnable)
	{
		let prev_enabled = my.enabled, setteings_updated;
		my.debug = pref.printDebugInfo || false;
		if (typeof pref.appliedUrls === "string"){
			if (pref.appliedUrls !== my.appliedUrls){
				if (my.enabled)
					my.toggle(false);
				my.appliedUrls = pref.appliedUrls;
				setteings_updated = true;
				my.filterUrls = parseUrls(my.appliedUrls);
				my.log("urls changed: ["+my.filterUrls+"]");
			}
		}
		if (typeof pref.cspDirectives === "string"){
			if (pref.cspDirectives !== my.cspDirectives){
				if (my.enabled)
					my.toggle(false);
				my.cspDirectives = pref.cspDirectives;
				setteings_updated = true;
				let ro = cspParse(my.cspDirectives);
				if (ro.error){
					my.directivesToAppend = [];
					my.log("error: " + ro.error);
				}
				else {
					my.directivesToAppend = ro.directives;
				}
				my.log('directives changed: "'+csp_directives2str(my.directivesToAppend)+'"');
			}
		}
		if (prev_enabled && setteings_updated){
			if (my.filterUrls.length > 0 && my.directivesToAppend.length > 0)
				my.toggle(true);
		}
	},
	//====================================================
	log : function(str)
	{
		browser.runtime.sendMessage({type:"log",str:str});
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
					appliedUrls: my.appliedUrls,
					filterUrls: my.filterUrls,
					cspDirectives: my.cspDirectives,
					directivesToAppend: my.directivesToAppend,
					appliedCounter: my.appliedCounter
				}
			});
		}
		else if (message.type === "updateSettings"){
			my.updateSettings(message.pref);
		}
		else if (message.type === "toggle"){
			my.toggle();
		}
		else {
			my.log("unknown message type:" + message.type);
		}
	},
	//====================================================
    toggle : function(state) {
        if(typeof state === 'boolean') {
            my.enabled = state;
        }
        else {
			if (my.enabled = ! my.enabled){
				if (my.filterUrls.length === 0 || my.directivesToAppend.length ===0){
					my.enabled = false;
					my.log("error: filterUrls or directivesToAppend empty");
					return;
				}
			}
        }

        my.updateButton();

        if(my.enabled) {
            browser.webRequest.onHeadersReceived.addListener(
                my.onHeadersReceived
                ,{urls: my.filterUrls, types: my.filterTypes}
                ,["blocking" ,"responseHeaders"]
            );
        }
        else {
            browser.webRequest.onHeadersReceived.removeListener(
                my.onHeadersReceived
            );
        }
		browser.runtime.sendMessage({
			type:"statusChange", enabled:my.enabled });
    },
	//====================================================
    updateButton : function() {
        let buttonStatus = my.enabled ? 'on' : 'off';
		if (my.os == "win"){
			browser.browserAction.setIcon({path:{48:'icons/button-48-'+buttonStatus+'.png'}});
		}
		else if (my.os == "android"){
			//browser.browserAction.setTitle('CSP for Me: '+buttonStatus);
		}
		else {
		}
    },
	//====================================================
    onHeadersReceived : function(response) {
		let modified;
		if (my.debug) my.log("onHeadersReceived: "+response.url);
		//for (let i = 0 ; i < response.responseHeaders.length ; i++){
		for (let i = response.responseHeaders.length - 1 ; i >= 0 ; i--){
			if (my.target[response.responseHeaders[i].name.toLowerCase()]){
				if (my.debug) my.log(response.responseHeaders[i].name+": "+response.responseHeaders[i].value.substring(0,60));
				let old_val = response.responseHeaders[i].value,
					new_val = cspMerge(old_val, my.directivesToAppend);
				response.responseHeaders[i].value = new_val;
				if (my.debug){
					let diff = my.dmp.diff_main(old_val, new_val), diff_str = "";
					for (let j = 0 ; j < diff.length ; j++){
						if (diff[j][0] != 0)
							diff_str += ',' + (diff[j][0] > 0 ? "+":"-") + '"' + diff[j][1] + '"';
					}
					my.log("appended: " + diff_str.substring(1));
				}
				modified = true;
			}
		}
		//let BlockingResponse = {};
		if (modified){
			my.appliedCounter++;
			return {responseHeaders: response.responseHeaders};
		}
    }
};

browser.runtime.getPlatformInfo().then(my.init);
