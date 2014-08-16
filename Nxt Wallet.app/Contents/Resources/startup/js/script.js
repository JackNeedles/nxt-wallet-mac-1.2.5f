var __entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

String.prototype.escapeHTML = function() {
	return String(this).replace(/[&<>"'\/]/g, function(s) {
		return __entityMap[s];
	});
}
                              
function showPreferencesWindow(preferences) {
	bootbox.hideAll();

	preferences = JSON.parse(preferences);

	bootbox.dialog({
		message: "<div class='checkbox'><input type='checkbox' name='check_for_updates' id='check_for_updates' value='1' " + (preferences.checkForUpdates != 0 ? " checked='checked'" : "") + " style='margin-left:0' /> <label for='check_for_updates'>Automatically check for updates</label></div>" +
			"<div class='checkbox'><input type='checkbox' name='check_for_beta_updates' id='check_for_beta_updates' value='1' " + (preferences.checkForUpdates == 2 ? " checked='checked'" : "") + " style='margin-left:0' /> <label for='check_for_beta_updates'>Update to beta versions when available</label></div>",
		title: "Preferences",
		buttons: {
			save: {
				label: "OK",
				className: "btn-primary",
				callback: function() {
					var checkForUpdates = (document.getElementById("check_for_updates").checked ? (document.getElementById("check_for_beta_updates").checked ? 2 : 1) : 0);

					var preferences = {
						"checkForUpdates": checkForUpdates
					};

					App.savePreferences(JSON.stringify(preferences));
				}
			}
		}
	});
}

function showNoJavaInstalledWindow() {
	bootbox.hideAll();

    document.getElementById("loading_indicator_container").style.display = "none";
	document.getElementById("server_output").innerHTML = "";
                                  
	bootbox.dialog({
		message: "<p>The correct java version was not found on your system. Click on the button below to start downloading. Reopen the app after installation.</p>" +
			"<div class='progress progress-striped active' style='margin-top:10px;margin-bottom:0;'>" +
			"<div id='java_download_progress' class='progress-bar' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='width:0%'>" +
			"<span class='sr-only'>0% Complete</span>" +
			"</div>" +
			"</div>",
		title: "Java Not Found...",
		closeButton: false,
		buttons: {
			cancel: {
				label: "Cancel (Quit)",
				className: "btn-default",
				callback: function() {
					App.quit();
				}
			},
			download: {
				label: "Download",
				className: "btn-primary",
				callback: function() {
					App.downloadJava();
					$(".bootbox button").attr("disabled", true);
					return false;
				}
			}
		}
	});
}

function logServerOutput(data) {
	var opacities = [0.6, 0.7, 0.8, 0.9, 1];

	data = data.split("\n");

	var lastLines = [];
                                  
	for (var i = data.length; i >= 0; i--) {
		if (data[i]) {
            data[i] = $.trim(data[i].replace(/^\s*[0-9\s\-:\.]+\s*(INFO\s*:\s*)?/i, ""));

			if (data[i] && !data[i].match(/(^nxt)|enabled|disabled|database is at level|Invalid well known peer|:INFO:|genesis block|\.\.\.done|DEBUG/i)) {
				var opacity = opacities.pop();

				lastLines.push("<span style='opacity:" + opacity + "'>" + String(data[i]).escapeHTML() + "</span>");
				if (lastLines.length == 5) {
					break;
				}
			}
		}
	}

	if (lastLines.length) {
		lastLines.reverse();

		document.getElementById("server_output").innerHTML = lastLines.join("<br />");
	}
}

function viewServerLog(serverOutput) {                                  
	bootbox.hideAll();

	var log = serverOutput.join("\n");

	log = log.replace(/\n\s*\n/g, "\n");

	bootbox.dialog({
		message: "<p>Below are the last 100 messages from the server log:</p>" +
			"<textarea style='margin-top:10px;width:100%;' rows='6' class='form-control'>" + String(log).escapeHTML() + "</textarea>",
		title: "Server Log",
		buttons: {
			ok: {
				label: "OK",
				className: "btn-primary"
			}
		}
	});
}

function showUpdateNotice(version, changelog) {
	bootbox.hideAll();

    document.getElementById("loading_indicator_container").style.display = "none";
    document.getElementById("server_output_container").style.display = "none";

	if (!changelog) {
		bootbox.confirm("A new version of the Nxt client is available (" + String(version).escapeHTML() + "). Would you like to update?", function(result) {
			if (result) {
				showDownloadWindow(version);
			}
		});
	} else {
		bootbox.dialog({
			message: "<p>A new version of the Nxt client is available (" + String(version).escapeHTML() + "). Would you like to update?</p>" +
				"<textarea style='margin-top:10px;width:100%;' rows='6' class='form-control'>" + String(changelog).escapeHTML() + "</textarea>",
			title: "Update Available",
			buttons: {
				cancel: {
					label: "Cancel",
					className: "btn-default"
				},
				update: {
					label: "OK",
					className: "btn-primary",
					callback: function() {
						showDownloadWindow(version);
					}
				}
			}
		});
	}
}

function showDownloadWindow(version) {
	bootbox.hideAll();

	bootbox.dialog({
		message: "<p>The new client is being downloaded. Upon completion the app will restart.</p>" +
			"<div class='progress progress-striped active' style='margin-top:10px'>" +
			"<div id='nrs_update_progress' class='progress-bar' role='progressbar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='width:0%'>" +
			"<span class='sr-only'>0% Complete</span>" +
			"</div>" +
			"</div>",
		title: "Updating Nxt Client...",
		closeButton: false
	});

	App.downloadNxt(version);
}

function updateDownloadProgress(type, percent) {
	var el = document.getElementById(type == "nxt" ? "nrs_update_progress" : "java_download_progress");

	if (el) {
		el.style.width = percent + "%";
	}
}

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    if (event.origin != "http://localhost:7876" && event.origin != "http://localhost:6876") {
		return;
	}

	if (typeof event.data == "object") {
		if (event.data.type == "copy") {
			App.copyToClipboard(event.data.text);
		} else if (event.data.type == "update") {
			App.downloadUpdateType(event.data.update.type);
        } else if (event.data.type == "language") {
            //console.log(event.data.version);
        } else if (event.data.type == "appUpdate") {
            //console.log(event.data);
        }
	} else if (event.data == "loaded") {
        document.getElementById("nrs").contentWindow.focus();
		document.getElementById("nrs_container").style.display = "block";
		document.getElementById("loading_indicator_container").style.display = "none";
		document.getElementById("server_output_container").style.display = "none";
    }
}