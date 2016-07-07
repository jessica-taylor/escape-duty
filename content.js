

(function() {

  // Any URL with this as a substring will get gated.
  var gatedSites = ['www.reddit.com', 'www.facebook.com'];

  var windowMins = 20.0;

  var windowMs = 1000 * 60 * windowMins;

  /* Check whether the page is gated and act appropriately
   * callType is 'initial' for the first call when the page is loaded, or
   * 'periodic' for periodic timed calls.
   */
  function checkForGated(callType) {

    var currentPage = window.location.href;

    var isGated = false;
    for (var i = 0; i < gatedSites.length; ++i) {
      if (currentPage.indexOf(gatedSites[i]) != -1) {
        isGated = true;
        break;
      }
    }

    if (isGated) {

      var currentTimeMs = new Date().getTime();

      chrome.runtime.sendMessage({getRecords: {amount: 10}}, function(dict) {

        // Find the last record in which the user visited a page.
        var records = dict.records;
        var lastRecord = {};
        for (var i = records.length - 1; i >= 0; --i) {
          if (records[i].isVisitingPage) {
            lastRecord = records[i];
            break;
          }
        }

        // Check to see if we should redirect to the prompt page.
        var lastTimeMs = lastRecord.timeMs || 0;
        var lastPage = lastRecord.targetPage || null;
        var lastIsJustPage = lastRecord.lastIsJustPage || false;
        var timeUp = currentTimeMs - lastTimeMs > windowMs;
        if ((callType == 'initial' && timeUp) || (lastIsJustPage && lastPage != currentPage)) {
          // Redirect to the prompt page.
          var promptURL = chrome.extension.getURL('prompt.html');
          var fullURL = promptURL + '?target=' + encodeURIComponent(currentPage);
          chrome.runtime.sendMessage({redirect: fullURL});
        }
      });

    }
  }

  checkForGated('initial');
  setInterval(function() { checkForGated('periodic'); }, 10 * 1000);

})()


