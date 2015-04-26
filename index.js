var date = new Date();
var fs = require('fs');
var parsePath = require('parse-filepath');
var files   = [];
var allFiles = [];
var success = [];
var failures = [];

var gs = require('glob-stream');

var allFilesStream = gs.create(['./test/*.jpg', '!./test/*.diff.jpg', '!./test/*.fail.jpg']);

allFilesStream.on('data', function(file){
  allFiles.push(parsePath(file.path).name);
});

allFilesStream.on('end',function(){
	var failuresFilesStream = gs.create(['./test/failures/*.jpg']);
	failuresFilesStream.on('data', function(file){
  		failures.push(parsePath(file.path).name);
	});
	failuresFilesStream.on('end',function(){
		getAllSuccess();
	})
});

getAllSuccess = function () {
	for (var i = 0; i < allFiles.length; i++) {
		if (failures.indexOf(allFiles[i]) === -1) {
			success.push(allFiles[i]);
		}
	}
	console.log(success);
	console.log(failures);
	getReport();
}

getReport = function(){
	var builder = require('xmlbuilder');
	var root = builder.create('testsuites');
	root.dec('1.0', 'UTF-8', true);
	var testSuite = root.ele('testsuite');
	var properties = testSuite.ele('properties');
	var property = properties.ele('property');
	property.att('name', 'browser.fullName');
	property.att('value', 'PhantomJS/1.9.8');
	var failure;
	testSuite.att('name', 'phantomCSS Tests');
	testSuite.att('package', '');
	testSuite.att('timestamp', date.toISOString().substr(0, 19));
	testSuite.att('id', 1);
	testSuite.att('hostname', 'test');
	testSuite.att('tests', allFiles.length);
	testSuite.att('errors', failures.length);
	testSuite.att('failures', failures.length);
	testSuite.att('time', 0.0);

	root.com('Sample test suites');
	var item;
	for (var i = 0; i < failures.length; i++) {
		item = testSuite.ele('testcase');
		item.att('name', failures[i]);
		item.att('time', 0.0);
		item.att('classname', failures[i]);
		failure = item.ele('failure');
		failure.att('type', '');
		failure.txt('screenshot comparison failed for ' + failures[i]);
	}
	for (var j = 0; j < success.length; j++) {
		item = testSuite.ele('testcase');
		item.att('name', success[j]);
		item.att('time', 0.0);
		item.att('classname', success[j]);
	}
	var sysout = testSuite.ele('system-out');
	sysout.dat('');
	testSuite.ele('system-err');
	root.end({pretty: true});
	fs.writeFileSync('./report/phantomcss-results.xml', root);

}

