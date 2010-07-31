var sys = require('sys');

function deepEquals(actual, expected)
{
	switch(typeof(expected))
	{
		case 'object':
			for(p in expected)
			{
				switch(typeof(expected[p]))
				{
					case 'object':
						if (!deepEquals(actual[p], expected[p])) { return false };
						break;
					case 'function':
						if (typeof(actual[p])=='undefined' || (p != 'equals' && expected[p].toString() != actual[p].toString())) { return false; };
						break;
					default:
						if (expected[p] != actual[p]) { return false; }
				}
			};
			break;
		case 'function':
			if (typeof(actual)=='undefined' || (p != 'equals' && expected.toString() != actual.toString())) { return false; };
			break;
		default:
			if (expected != actual) { return false; }
	}

	return true;
}

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

function argumentsMatch(expected, actual, responseForUnmatchedArguments) {
	var matched = true;
	
	for(var i in actual) {
		if((typeof actual[i]) != 'function' && (typeof expected[i]) != 'function' && !deepEquals(actual[i], expected[i])) {
			if(responseForUnmatchedArguments)
				responseForUnmatchedArguments();

			matched = false;
		}
	}
	
	return matched;
}

function actualArgumentsShouldBeExpected(fn, expected, actual) {
	argumentsMatch(expected, actual,
		function() {
			var ex = "Unexpected arguments to function '" + fn + "'\nExpected " + expected.length + " arg(s): " + tostr(expected) + "\nReceived " + actual.length + " arg(s): " + tostr(actual) + "\n";
			throw new Error(ex);
		});
}

var stub = exports.stub = function(o) {
	var stubs = {};

	function stubCallAndParams(fn, params) {
		if(stubs[fn] == undefined)
			stubs[fn] = {
				list: []
			};
		
		stubs[fn].list[stubs[fn].list.length] = { params: [] };
		
		if(params != 'undefined')
			stubs[fn].list[stubs[fn].list.length - 1].params = params;
	}

	return {
		stubbedObj: o,
		
		expectCall: function(fn) {
			var params = (arguments.length > 1 ? argstoarray(arguments).splice(1) : []);
			return this.expect(fn).withArgs.apply(this, params);
		},

		andReturn: function(val) {
			this.lastStub().returnValue = val;
			return this;
		},
		
		executeCallback: function(indexOfCallback) {
			var callbackSpec = {
				index: indexOfCallback,
				params: (arguments.length > 1 ? argstoarray(arguments).splice(1) : [])
			};
			
			this.lastStub().callback = callbackSpec;
			
			return this;
		},
		
		withArgs: function () {
			this.lastStub().params = argstoarray(arguments);
			return this;
		},
		
		andThrow: function (e) {
			this.lastStub().exception = e;
		},
		
		defaultStub: function () {
			return stubs[this.fn].defaultStub;
		},

		setDefaultStub: function (stub) {
			stubs[this.fn].defaultStub = stub;
		},
		
		withUnexpectedArgs: function (fn) {
			if(this.defaultStub() == undefined) {
				this.setDefaultStub({params: [], isStub: true});
			}

			delete stubs[this.fn].list[stubs[this.fn].list.length - 1];
			stubs[this.fn].list.length = stubs[this.fn].list.length - 1;
			
			this.lastStub = function () {
				return this.defaultStub();
			};
			
			return this;
		},
		
		findStub: function(args) {
			for(var ctr = 0; ctr < stubs[this.fn].list.length; ctr ++) {
				var stub = stubs[this.fn].list[ctr];
				
				if(argumentsMatch(stub.params, args)) {
					return stub;
				}
			}
			
			if(this.defaultStub() == 'undefined') {
				throw new Error('No stub found for function ' + this.fn + ' with args ' + tostr(args));
			}
			
			return this.defaultStub();
		},
		
		expect: function(fn) {
			stubCallAndParams(fn);

			var self = this;

			o[fn] = function() {
				var stub = self.findStub(argstoarray(arguments));

				if(!stub.isStub)
					actualArgumentsShouldBeExpected(fn, stub.params, argstoarray(arguments));

				if(stub.exception != undefined) {
					throw stub.exception;
				}

				if(stub.callback != undefined) {
					arguments[stub.callback.index].apply(null, stub.callback.params);
				}

				var returnValue = undefined;

				if(stub.returnValue != undefined)
					returnValue = self.lastStub().returnValue;

				if(returnValue != undefined)
					return returnValue;
			};

			this.lastStub = function() {
				return stubs[fn].list[stubs[fn].list.length - 1];
			};
			
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

	return {
		mockedObj: o,
		
		expectCall: function(fn) {
			var params = (arguments.length > 1 ? argstoarray(arguments).splice(1) : []);
			return this.expect(fn).withArgs.apply(this, params);
		},
		
		andReturn: function(val) {
			var callExpectations = expectations[this.fn];
			expectations[this.fn][callExpectations.length - 1].returnValue = val;
			return this;
		},
		
		executeCallback: function(indexOfCallback) {
			var callbackSpec = {
				index: indexOfCallback,
				params: (arguments.length > 1 ? argstoarray(arguments).splice(1) : [])
			};
			
			expectations[this.fn][expectations[this.fn].length - 1].callback = callbackSpec;
			
			return this;
		},

		withArgs: function () {
			expectations[this.fn][expectations[this.fn].length - 1].params = argstoarray(arguments);
			return this;
		},

		expect: function(fn) {
			expectCallAndParams(fn, []);
			this.fn = fn;

			o[fn] = function () {
				if(expectations[fn] == undefined || expectations[fn].length == 0)
					throw new Error("Unexpected call to " + fn + " with arguments " + tostr(arguments));

				actualArgumentsShouldBeExpected(fn, expectations[fn][0].params, arguments);

				if(expectations[fn][0].callback != undefined) {
					arguments[expectations[fn][0].callback.index].apply(null, expectations[fn][0].callback.params);
				}

				var returnValue = undefined;

				if(expectations[fn][0].returnValue != undefined)
					returnValue = expectations[fn][0].returnValue;

				expectations[fn].shift();
				
				if(returnValue != undefined)
					return returnValue;
			}
			
			return this;
		},
		
		verifyMockedCalls: function () {
			var fn = this.fn;

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
		},
		
		playback: function (fn) {
			fn(this.mockedObj, this);
			this.verifyMockedCalls();
		}
	};
}
