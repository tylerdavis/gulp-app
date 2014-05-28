'use strict';
var path = require('path');
var spawn = require('child_process').spawn;
var gui = require('nw.gui');
var findupSync = require('findup-sync');
var currentPath = require('current-path');
var displayNotification = require('display-notification');
var util = require('./node-util');
var getGruntTasks = require('./get-grunt-tasks');

var DEBUG = true;
var TRAY_UPDATE_INTERVAL = 1000;

// fix the $PATH on OS X
// OS X doesn't read .bashrc/.zshrc for GUI apps
if (process.platform === 'darwin') {
	process.env.PATH += ':/usr/local/bin';
	process.env.PATH += ':' + process.env.HOME + '/.nodebrew/current/bin';
}

function runTask(taskName) {
	// TODO: find workaround for node-webkit bug:
	// https://github.com/rogerwang/node-webkit/issues/213
	// so I don't have to hardcode the node path
	var cp = spawn('node', ['/usr/local/bin/grunt', taskName, '--no-color']);

	cp.stdout.setEncoding('utf8');
	cp.stdout.on('data', function (data) {
		console.log(data);
	});

	// TODO: show progress in menubar menu
	//tray.menu = createTrayMenu(name, [], 'progress here');

	cp.stderr.setEncoding('utf8');
	cp.stderr.on('data', function (data) {
		console.error(data);
		displayNotification({text: '[error] ' + data});
	});

	cp.on('exit', function (code) {
		if (code === 0) {
			displayNotification({
				title: 'grunt',
				subtitle: 'Finished running tasks'
			});
		} else {
			console.error('Exited with error code ' + code);

			displayNotification({
				title: 'grunt',
				subtitle: 'Exited with error code ' + code,
				sound: 'Basso'
			});
		}
	});
}

function createTrayMenu(name, tasks, status) {
	var menu = new gui.Menu();

	menu.append(new gui.MenuItem({
		label: name,
		enabled: false
	}));

	if (status) {
		menu.append(new gui.MenuItem({type: 'separator'}));
		menu.append(new gui.MenuItem({
			label: status,
			enabled: false
		}));
	}

	if (tasks && tasks.length > 0) {
		menu.append(new gui.MenuItem({type: 'separator'}));

		tasks.forEach(function (el) {
			menu.append(new gui.MenuItem({
				label: el,
				click: function () {
					runTask(el);
				}
			}));
		});
	}

	menu.append(new gui.MenuItem({type: 'separator'}));
	menu.append(new gui.MenuItem({
		label: 'Quit',
		click: gui.App.quit
	}));

	return menu;
}

function updateTrayMenu() {
	tray.menu = createTrayMenu.apply(null, arguments);
}

function updateTray() {
	currentPath(function (err, dirPath) {
		setTimeout(updateTray, TRAY_UPDATE_INTERVAL);

		process.chdir(dirPath);

		var pkg;
		var pkgPath = findupSync('package.json');

		if (pkgPath) {
			pkg = require(pkgPath);
		} else {
			console.log('Couldn\'t find package.json.');
			return;
		}

		var name = pkg.name || path.basename(dirPath, path.extname(dirPath));

		getGruntTasks(function (err, tasks) {
			if (err) {
				console.log(err);
				return;
			}

			updateTrayMenu(name, tasks);
		});
	});
}

var tray = new gui.Tray({
	icon: 'menubar-icon@2x.png',
	alticon: 'menubar-icon-alt@2x.png'
});

updateTrayMenu('No gruntfile found');
updateTray();

if (DEBUG) {
	gui.Window.get().showDevTools();
}
