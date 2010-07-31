var sys = require('sys');
var assert = require('assert');

require.paths.unshift("./src");
require.paths.unshift("./lib");

var actlikeaduck = require('actlikeaduck');

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

exports['A mock object should be available from the stub repo.'] = function () {
	var file = {};
	var called = false;

	var mockRepo = actlikeaduck.mock(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
		assert.deepEqual(file, mockRepo.mockedObj);
};

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
	var gotException = false;

	actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).andThrow(new Error("file not found"));

	try {
		file.readContents("testfile.txt", function(err, data) { });
	} catch(e) {
		if(e.message == "file not found")
			gotException = true;
		else
			throw e;
	}

	assert.ok(gotException, "The stubbed exception should have been thrown.");
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