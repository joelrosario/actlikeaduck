var sys = require('sys');

function tostr(arr) {
	var str = "";
	
	for(var ctr = 0; ctr < arr.length; ctr ++) {
		if(str.length > 0) str += ", ";
		str += arr[ctr];
	}
	
	return str;
}

function argstoarray(args) {
	var arr = [];

	for(var ctr = 0; ctr < args.length; ctr ++) {
		arr[ctr] = args[ctr];
	}

	return arr;
}

function actualArgumentsShouldBeExpected(fn, expected, actual) {
	for(var i in actual) {
		if(actual[i] != expected[i] && (typeof actual[i]) != 'function' && (typeof expected[i]) != 'function')
		{
			var ex = "Unexpected arguments to function '" + fn + "'\nExpected args (" + expected.length + "): " + tostr(expected) + "\nActual args (" + actual.length + "): " + tostr(actual) + "\n";
			throw new Error(ex);
		}
	}
}

var stub = exports.stub = function(o) {
	var stubs = {};

	function stubCallAndParams(fn, params) {
		stubs[fn] = {
		};
		
		if(params != 'undefined')
			stubs[fn].params = params;
	}

	return {
		expectCall: function(fn) {
			var params = (arguments.length > 1 ? argstoarray(arguments).splice(1) : []);
			return this.expect(fn).withArgs.apply(this, params);
		},

		andReturn: function(val) {
			stubs[this.fn].returnValue = val;
			return this;
		},
		
		executeCallback: function(indexOfCallback) {
			var callbackSpec = {
				index: indexOfCallback,
				params: (arguments.length > 1 ? argstoarray(arguments).splice(1) : [])
			};
			
			stubs[this.fn].callback = callbackSpec;
			
			return this;
		},
		
		withArgs: function () {
			stubs[this.fn].params = argstoarray(arguments);
			return this;
		},
		
		expect: function(fn) {
			stubCallAndParams(fn);

			o[fn] = function() {
				actualArgumentsShouldBeExpected(fn, stubs[fn].params, argstoarray(arguments));

				if(stubs[fn].callback != undefined) {
					arguments[stubs[fn].callback.index].apply(null, stubs[fn].callback.params);
				}

				var returnValue = undefined;

				if(stubs[fn].returnValue != undefined)
					returnValue = stubs[fn].returnValue;

				if(returnValue != undefined)
					return returnValue;
			}

			this.fn = fn;
			return this;
		}
	};
}

var mock = exports.mock = function (o) {
	var expectations = {};

	function expectCallAndParams(fn, params) {
		if(expectations[fn] == undefined) expectations[fn] = [];
		var callExpectations = expectations[fn];
		callExpectations[callExpectations.length] = {
			params: params
		};
	}

	o['verifyMockedCalls'] = function () {
		var unInvokedExpectations = '';
		
		for(var fn in expectations) {
			if(expectations[fn].length > 0) {
				if (unInvokedExpectations.length == 0)
					unInvokedExpectations += "The following calls were not received on an object:";
				
				unInvokedExpectations += "\n";
				
				unInvokedExpectations += "Function: " + fn + "\n";
				
				for(var ctr in expectations[fn]) {
					unInvokedExpectations +=  "  Parameters: " + tostr(expectations[fn][ctr].params);
					if(expectations[fn][ctr].returnValue != undefined)
						unInvokedExpectations += "\n    Returns: " + expectations[fn][ctr].returnValue;
					unInvokedExpectations += "\n";
				}
			}
		}

		if(unInvokedExpectations.length > 0)
			throw new Error(unInvokedExpectations);
	}

	return {
		expectCall: function(fn) {
			var params = (arguments.length > 1 ? argstoarray(arguments).splice(1) : []);
			expectCallAndParams(fn, params);
			this.fn = fn;

			o[fn] = function () {
				if(expectations[fn] == undefined || expectations[fn].length == 0)
					throw new Error("Unexpected call to " + fn + " with arguments " + tostr(arguments));

				actualArgumentsShouldBeExpected(fn, expectations[fn][0].params, arguments);
				
				var returnValue = undefined;
				
				if(expectations[fn][0].returnValue != undefined)
					returnValue = expectations[fn][0].returnValue;

				expectations[fn].shift();
				
				if(returnValue != undefined)
					return returnValue;
			}
			
			return this;
		},
		
		andReturn: function(val) {
			var callExpectations = expectations[this.fn];
			expectations[this.fn][callExpectations.length - 1].returnValue = val;
			return this;
		}
	};
}
