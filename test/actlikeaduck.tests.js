var sys = require('sys');
var assert = require('assert');

require.paths.unshift("./src");
require.paths.unshift("./lib");

var actlikeaduck = require('actlikeaduck');

exports['Mock duck to quack.'] = function () {
	var duck = {};

	actlikeaduck.mock(duck).expectCall("sound", "quacks").andReturn("it quacks");
	assert.equal("it quacks", duck.sound("quacks"));
}

exports['A mocked duck can quack only as many times as the quack call has been mocked'] = function () {
	var duck = {};
	actlikeaduck.mock(duck)
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "quacks").andReturn("it quacks");

	assert.equal("it quacks", duck.sound("quacks"));
	assert.equal("it quacks", duck.sound("quacks"));
	assert.throws(function () { duck.sound("quacks"); }, "it quacks");
	assert.throws(function () { duck.sound("quacks"); }, "it quacks");
}

exports['All mocked expectations must be called.'] = function () {
	var duck = {};
	actlikeaduck.mock(duck)
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "quacks").andReturn("it quacks")
		.expectCall("sound", "squeaks").andReturn("itSqueaks");

	duck.sound("quacks");

	try { duck.verifyMockedCalls(); } catch(e) {
		["sound", "quacks", "squeaks"].forEach(function (token) {
			assert.ok(e.message.indexOf(token) > -1);
		});
	}
}

exports['Stub frog to croak.'] = function () {
	var frog = {};
	actlikeaduck.stub(frog).expectCall("sound", "croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));

	actlikeaduck.stub(frog).expect("sound").withArgs("croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));
}

exports['A stubbed frog can croak any number of times.'] = function () {
	var frog = {};
	actlikeaduck.stub(frog).expectCall("sound", "croak").andReturn("it croaks");
	assert.equal("it croaks", frog.sound("croak"));
	assert.equal("it croaks", frog.sound("croak"));
}

exports['A stubbed operation to readContents should call the callback function passed to it as the third argument.'] = function () {
	var file = {};
	var called = false;

	actlikeaduck.stub(file).expectCall("readContents", "testfile.txt", function() { }).executeCallback(1, null, "hello world");
	file.readContents("testfile.txt", function(err, data) { assert.equal(null, err); assert.equal("hello world", data); called = true; });
	assert.ok(called);
}