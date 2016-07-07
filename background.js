function getRecordsMetadata(callback) {
  chrome.storage.local.get('recordsMetadata', function(dict) {
    callback(dict.recordsMetadata || {});
  });
}

/*
 * JSON data types
 *
 * <record> := {
 *   visitType: 'purpose' or 'entertainment',
 *   targetPage: string,
 *   isVisitingPage: bool,
 *   timeMs: int,
 *   promptText: string
 * }
 * <records-metadata> := {
 *   numRecords: int
 * }
 * 
 *
 *
 *

/*
 * Available calls:
 *
 * {redirect: {url: string}}
 * Redirects the page to the given URL.
 *
 * {getRecords: {amount: int}}
 * Retrieve records of things entered in the prompt page.
 * Data is returned as {records: [<record>], metadata: <records-metadata>}
 *
 * {addRecord: {record: <record>}}
 * Adds a record to the database.
 */
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  console.log('got request', request);
  if (request.redirect) {
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
    callback();
  } else if (request.getRecords) {
    console.log('getRecords');
    var amount = request.getRecords.amount || 0;
    getRecordsMetadata(function(recordsMetadata) {
      console.log('getRecordsMetadata', recordsMetadata);
      var numRecords = recordsMetadata.numRecords || 0;
      var indices = [];
      for (var i = Math.max(0, numRecords - amount); i < numRecords; ++i) {
        indices.push(i);
      }
      var recordNames = indices.map(function(i) { return 'record_' + i; });
      chrome.storage.local.get(recordNames, function(dict2) {
        console.log('got record names', recordNames);
        callback({
          records: indices.map(function(i) { return dict2['record_' + i]; }),
          metadata: recordsMetadata
        });
      });
    });
  } else if (request.addRecord) {
    console.log('addRecord');
    newRecord = request.addRecord.newRecord;
    getRecordsMetadata(function(recordsMetadata) {
      console.log('got records metadat');
      var numRecords = recordsMetadata.numRecords || 0;
      var newMetadata = JSON.parse(JSON.stringify(recordsMetadata));
      newMetadata.numRecords = numRecords + 1;
      var updates = {recordsMetadata: newMetadata};
      updates['record_' + numRecords] = newRecord;
      console.log('got records metadata');
      console.log('updates', updates);
      chrome.storage.local.set(updates, callback);
    });
  } else {
    console.log('UNKNOWN REQUEST: ', request);
  }
  return true;
});

