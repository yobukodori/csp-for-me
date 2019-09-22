function parseUrls(strUrls)
{
	var urls = [];
	if (typeof strUrls === "string" && strUrls){
		var ar = strUrls.split(",");
		for (var i = 0 ; i < ar.length ; i++){
			var url = ar[i].trim();
			if (url)
				urls.push(url);
		}
	}
	return urls;
}

function csp_normalize_source(src, directive)
{
	let r;
	if (directive === "plugin-types"){
		return src.toLowerCase();
	}
	else {
		if (/^'(none|self|unsafe-inline|unsafe-eval)'$/i.test(src))
			return src.toLowerCase();
		else if (r = src.match(/^'(nonce|sha256|sha384|sha512)-([a-z\d+\/]+={0,2})'$/i))
			return "'" + r[1].toLowerCase() + "-" + r[2] + "'";
		else if (r = src.match(/^([a-zA-Z][a-zA-Z\d+\-\.]*\:)$/))
			return src.toLowerCase();
		else if (r = src.match(/^([a-zA-Z][a-zA-Z\d+\-\.]*\:\/\/)?((\*\.)?[a-zA-Z\d][a-zA-Z\d\-]*(\.[a-zA-Z\d\-]+)*|\*)(\:(\d+|\*))?(\/.*)?/)){
			return (r[1]?r[1].toLowerCase():"")+r[2].toLowerCase()+(r[5]?r[5]:"")+(r[7]?r[7]:"");
		}
		else {
			//console.error("can't parse "+src);
			return src.toLowerCase();
		}
	}
}

const CSP_DIRECTIVE_REX = /^\s*(([a-zA-Z\d\-]+)(\s.*)?)?$/;

function cspParse(csp_str)
{
	let ro = {error:"n/a", policy:[]};
	let dir_names = {}, a = csp_str.split(";");
	for (let i = 0 ; i < a.length ; i++){
		let r = a[i].match(CSP_DIRECTIVE_REX);
		if (r){
			if (r[2]){
				let name = r[2].toLowerCase(), value = r[3] ? r[3] : "";
				if (dir_names[name] == null){
					dir_names[name] = i;
					let add = [], remove = [], removeDirective = false;
					value.split(" ").forEach(src=>{
						if (src){
							let r = src.match(/^'remove':(.*)/i);
							if (r){
								if (! r[1]){
									ro.error = "wrong 'remove': in " + name;
									return ro;
								}
								let ss = r[1].split(",");
								ss.forEach(s=>{
									if (s.toLowerCase() == "'directive'")
										removeDirective = true;
									else if (/^\/.*\/$/.test(s )){
										try {
											remove.push(new RegExp(s.substring(1,s.length-1)));
										}
										catch(e){
											ro.error = e + " " + src + " in " + name;
											return ro;
										}
									}
									else if (s.length > 0)
										remove.push(csp_normalize_source(s));
								});
							}
							else {
								add.push(csp_normalize_source(src));
							}
						}
					});
					ro.policy.push({
						name: name, 
						add: add, 
						remove: remove,
						removeDirective: removeDirective
					});
				}
			}
		}
		else {
			ro.error = "wrong CSP directive: " + a[i].substring(0,40);
			return ro;
		}
	}
	ro.error = null;
	return ro;
}

function csp_policy2str(policy)
{
	let p = [];
	for (let i = 0 ; i < policy.length ; i++){
		let directive = policy[i], source = [];
		if (directive.removeDirective)
			source.push("'remove':'directive'");
		else {
			if (directive.remove.length > 0)
				source.push("'remove':" + directive.remove.join(","));
			directive.add.forEach(s=>source.push(s));
		}
		p.push(policy[i].name + " " + source.join(" "));
	}
	return p.join(";");
}

function cspMerge(csp_str, policy4me)
{
	let policy = [], dir_names = {};
	csp_str.split(";").forEach(directive=>{
		let r = directive.match(CSP_DIRECTIVE_REX);
		if (r && r[2]){
			let name = r[2].toLowerCase(), value = r[3] ? r[3] : "";
			if (dir_names[name] == null){
				let sources = [];
				value.split(" ").forEach(src=>{if (src) sources.push(csp_normalize_source(src));});
				dir_names[name] = policy.push({name: name, sources: sources}) - 1;
			}
		}
	});
	let modified, log = "";
	policy4me.forEach(directive=>{
		let pi = dir_names[directive.name], added = [], removed = [];
		if (pi != null){
			if (directive.removeDirective){
				policy.splice(pi, 1);
				Object.keys(dir_names).forEach(name=>{if (dir_names[name] > pi) --dir_names[name];});
				modified = true;
				log += directive.name + " <removed>;";
				return;
			}
			policy[pi].sources = policy[pi].sources.filter(src=>{
				for (let i = 0 ; i < directive.remove.length ; i++){
					let exp = directive.remove[i];
					if (exp instanceof RegExp ? exp.test(src) : exp === src){
						removed.push(src);
						return false;
					}
				}
				return true;
			});
			directive.add.forEach(src=>{
				if (! policy[pi].sources.includes(src)){
					policy[pi].sources.push(src);
					added.push(src);
				}
			});
			if (added.length + removed.length > 0){
				modified = true;
				log += directive.name + (removed.length ? " -" + removed.join(" -") : "") + (added.length ? " +" + added.join(" +") : "")
			}
		}
		else {
			policy.push({name: directive.name, sources: directive.add});
			modified = true;
			log += "+" + directive.name + (directive.add.length ? " "+directive.add.join(" ") : "")+";";
		}
	});
	let a = [];
	policy.forEach(directive=>a.push(directive.name+" "+directive.sources.join(" ")));
	return {
		modified: modified,
		policy: a.length > 0 ? a.join(";") : "",
		log: log
	};
}
