var sys = require('sys');
var assert = require('assert');

require.paths.unshift("./src");
require.paths.unshift("./lib");

var actlikeaduck = require('actlikeaduck');

function throwsException(test, exceptionMsg, message) {
	var gotException = false;

	try {
		test();
	} catch(e) {
		gotException = true;

		if(exceptionMsg && e.message != exceptionMsg)
			gotException = false;

		if(gotException == false)
			throw e;
	}

	if(message)
		assert.ok(gotException, message);
	else
		assert.ok(gotException, "The stubbed exception should have been thrown.");
}

exports['Mock duck to quack.'] = function () {
	var duck = {};

	actlikeaduck.mock(duck).expectCall("sound", "quacks").andReturn("it quacks");
	assert.equal("it quacks", duck.sound("quacks"));

	actlikeaduck.mock(duck).expect("sound").withArgs({is: "quacks"}).andReturn("it quacks");
	assert.equal("it quacks", duck.sound({is: "quacks"}));
};

exports['A mocked duck can quack only as many times as the quack call has been mocked'] = function () {
	var duck = {};
	actlikeaduck.mock(duck)
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "quacks").andReturn("it quacks");

	assert.equal("it quacks", duck.sound("quacks"));
	assert.equal("it quacks", duck.sound("quacks"));
	assert.throws(function () { duck.sound("quacks"); }, "it quacks");
	assert.throws(function () { duck.sound("quacks"); }, "it quacks");
};

exports['All mocked expectations must be called.'] = function () {
	var duck = {};
	var mockRepo = actlikeaduck.mock(duck)
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "squeaks").andReturn("itSqueaks");

	duck.sound("quacks");

	try { mockRepo.verifyMockedCalls(); } catch(e) {
		["sound", "quacks", "squeaks"].forEach(function (token) {
			assert.ok(e.message.indexOf(token) > -1);
		});
	}
};

exports['playback should automatically verify the mocked calls at the end of the test.'] = function () {
	assert.ok((function() {
		try {
			actlikeaduck.mock({})
				.expectCall("sound", "quacks").andReturn("it quacks")
				.expectCall("sound", "quacks").andReturn("it quacks")
				.expectCall("sound", "squeaks").andReturn("itSqueaks")
				.playback(function(duck, mock) {
					duck.sound("quacks");
				});
		} catch(e) {
			["sound", "quacks", "squeaks"].forEach(function (token) {
				assert.ok(e.message.indexOf(token) > -1, "token " + token + " not found in the error msg");
			});

			return true;
		}
	})(), "playback failed to verify all mocked calls at the end of the test.");
};

exports['A mocked operation to readContents should call the callback function passed to it as the second argument.'] = function () {
	var file = {};
	var called = false;

	actlikeaduck.mock(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
	file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called = true; });
	assert.ok(called);
};

exports['An operation should signal an error if asked to mock a callback for a param that is not expected to be a function'] = function() {
	var file = {};
	var called = false;

	throwsException (function () {
		actlikeaduck.mock(file).expectCall("readContents", "testfile.txt", null).executeCallback(1, null, "hello world");
	}, "A function is not expected at position 1.");
}

exports['A mock object should be available from the stub repo.'] = function () {
	var file = {};
	var called = false;

	var mockRepo = actlikeaduck.mock(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
		assert.deepEqual(file, mockRepo.mockedObj);
};

exports['One can set an expectation on a call to a function which does not belong to an object.'] = function () {
	var called = false;
	
	var fn = actlikeaduck.expectACall(1, function () {
		called = true;
	});
	
	throwsException(function () {
		fn.verifyCall();
	});

	fn();
	fn.verifyCall();
	
	assert.ok(called);
}

exports['Stub frog to croak.'] = function () {
	var frog = {};
	actlikeaduck.stub(frog).expectCall("sound", "croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));

	actlikeaduck.stub(frog).expect("sound").withArgs("croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));
};

exports['A stubbed frog can croak any number of times.'] = function () {
	var frog = {};
	actlikeaduck.stub(frog).expectCall("sound", "croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));
	assert.equal("it croaks", frog.sound("croak"));
};

exports['A stubbed operation to readContents should call the callback function passed to it as the second argument.'] = function () {
	var file = {};
	var called = false;

	actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
	file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called = true; });
	assert.ok(called, "The callback function at arguments index 1 should have been called.");
};

exports['A stubbed operation to readContents may be stubbed to throw an exception to simulate a file that does not exist.'] = function () {
	var file = {};
	
	actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).andThrow(new Error("file not found"));

	throwsException(function () {
		file.readContents("testfile.txt", function(err, data) { });
	}, "file not found");
};

exports['A readContents operation may be stubbed to throw an exception to simulate a file that does not exist.'] = function () {
	var file = {};
	var called = false;

	actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
	file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called = true; });
	assert.ok(called, "The callback function at arguments index 1 should have been called.");
};

exports['A stubbed object should be available from the stub repo.'] = function () {
	var file = {};
	var called = false;

	var stubRepo = actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
	assert.deepEqual(file, stubRepo.stubbedObj);
};

exports['An operation should signal an error if asked to stub a callback for a param that is not expected to be a function'] = function() {
	var file = {};
	var called = false;

	throwsException (function () {
		actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", null).executeCallback(1, null, "hello world");
	}, "A function is not expected at position 1.");
}

exports['An operation successfully stub out a callback when being stubbed for unexpected arguments.'] = function() {
	var file = {};
	var called = false;

	actlikeaduck.stub(file).expect("readContents").withUnexpectedArgs().executeCallback(1, null, "hello world");
}

exports['An operation may be stubbed out with different responses for different parameters.'] = function () {
	var file = {};
	var called = 0;

	actlikeaduck.stub(file)
		.expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world").andReturn(true)
		.expectCall("readContents", "testfile2.txt", function() { }).executeCallback(1, null, "hello world 2").andReturn(true);

	assert.ok(file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called++; }));
	assert.ok(file.readContents("testfile2.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world 2", data); called++; }));

	assert.equal(2, called);
};

exports['Different operations may be stubbed out at the same time.'] = function () {
	var file = {};
	var called = 0;

	actlikeaduck.stub(file)
		.expect("readContents").withArgs("testfile.txt", function() { }).executeCallback(1, null, "hello world").andReturn(true)
		.expect("readContents").withArgs("testfile2.txt", function() { }).executeCallback(1, null, "hello world 2").andReturn(true)
		.expect("stat").withArgs("testfile.txt", actlikeaduck.anyFunction).executeCallback(1, undefined, "file");

	assert.ok(file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called++; }));
	assert.ok(file.readContents("testfile2.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world 2", data); called++; }));
	file.stat("testfile.txt", function(err, data) { assert.equal("file", data); });
	
	assert.equal(2, called);

	var fakeFileSystem = actlikeaduck.stub({})
			.expect("stat").withArgs("./test.html", function() {}).executeCallback(1,
																	undefined, actlikeaduck.stub({})
																		.expect("isDirectory").andReturn(false)
																		.expect("isFile").andReturn(true)
																		.stubbedObj)
			.expect("readFile").withArgs("./test.html", "utf-8", function() {}).executeCallback(2, undefined, "test data")
			.stubbedObj;

	fakeFileSystem.stat("./test.html", function(err, stats) {
		assert.ok(stats.hasOwnProperty('isDirectory'));
		assert.ok(stats.hasOwnProperty('isFile'));
	});
};

exports['An operation may be stubbed out with a default response.'] = function () {
	var file = {};
	var called = false;

	actlikeaduck.stub(file)
		.expect("readContents").withArgs("testfile.txt", function() { }).executeCallback(1, null, "hello world").andReturn(true)
		.expect("readContents").withUnexpectedArgs().andThrow(new Error("file not found"));

	file.readContents("testfile.txt", function (val, data) { assert.equal("hello world", data); called = true;});
	assert.ok(called, "readContents(testfile.txt) should have yielded content.");

	throwsException(function () {
		file.readContents("testfile234.txt", actlikeaduck.anyFunction);
	}, "file not found", "The default response should have been triggered, which was to throw a file not found exception.")
}
