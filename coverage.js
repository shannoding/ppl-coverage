let breakpoints = [];


function insertBreakpoint(elem) {
	let n = parseInt(elem.innerHTML);
	if (breakpoints.includes(n)) {
		elem.classList.remove("breakpoint");
		let i = breakpoints.indexOf(n);
		breakpoints.splice(i, 1);
		// remove from breakpoints
	}
	else {
		elem.classList.add("breakpoint");
		breakpoints.push(n);
	}

	return;
}

function updateBreakpoints() {
	breakpoints = [];
	let allBreaks = document.querySelectorAll(".breakpoint");
	allBreaks.forEach(elem => {
		breakpoints.push(parseInt(elem.innerHTML));
	});

}

function makeWrapperStr() {
	let targetFnBox = document.getElementById("targetFn");
	let targetParamsBox = document.getElementById("targetParams");
	let fnName = targetFnBox.value;
	let paramNames = targetParamsBox.value.split('\n')
		.map(x => {
			let eqSplit = x.split('=');
			return { name: eqSplit[0], value: eqSplit[1] }
		});

	let declarations = paramNames.map(elem => {
		return `var ${elem.name} = ${elem.value};`;
	}).join('\n');

	let args = paramNames.map(elem => elem.name).join(',');
	let wrap = `
	var geometric = function(p) {
	  return flip(p) ? 0 : geometric() + 1;
	}

	var binomial = function(n, p) {
	  if (n == 0) {
	  	 return 0;
	  }
	  return flip(p) ? (binomial(n-1, p) + 1) : binomial(n-1, p);
	}


	var coverageWrapper = function() {
		${declarations}
		${fnName}(${args});
		return globalStore.x;
	}
	`;
	return wrap;
}

function handleRun(code) {
	breakpoints.sort(function(a, b) {
  		return a - b;
	});
	let codeArr = code.split('\n');
	codeArr.splice(0,0, "globalStore.x = 0;");
	for (let i = 0; i < breakpoints.length; i++) {
		let flagStr = "globalStore.x += " + Math.pow(2, i) + ";";

		codeArr.splice(breakpoints[i] + i, 0, flagStr);

	}

	let wrapperStr = makeWrapperStr();
	codeArr.push(wrapperStr);
	let inferStr = "var dist = Infer({method: 'enumerate', maxExecutions: 10}, coverageWrapper);"
	codeArr.push(inferStr);
	codeArr.push("dist.getDist()");
	let flaggedCode = codeArr.join('\n');

	return flaggedCode;

}

function flaggedI(nexp, i) {
	const nexp1 = nexp % (Math.pow(2, i+1));
	const nexp2 = Math.floor(nexp1 / (Math.pow(2, i)));
	return nexp2;
}

function handleReturn(returnValue) {
	let n = breakpoints.length;
	if (n == 0) {
		return "No lines selected! Click the line numbers to select lines to analyze coverage for.";
	}
	let nexp = Math.pow(2, n);

	let result = [];
	for (let i = 0; i < n; i++) {
		result[i] = {
			"line": breakpoints[i],
			"prob": 0
		};
	}


	for (const property in returnValue) {
	  let flaggedValue = parseInt(property);
	  let partprob = returnValue[property].prob;

	  for (let i = 0; i < n; i++) {
	  	if (flaggedI(flaggedValue, i)) {
	  		result[i].prob += partprob;
	  	}
	  }

	}
	return result;
}


function restoreBreakpoints() {
	let allLines = document.querySelectorAll(".CodeMirror-gutter-elt");
	allLines.forEach(elem => {
		elem.classList.remove("breakpoint");
	});
	for (let i = 0; i < breakpoints.length; i++) {
		let lineNum = breakpoints[i];
		allLines[lineNum - 1].classList.add("breakpoint");
	}
}
