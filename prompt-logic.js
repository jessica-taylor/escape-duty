var RECORDS_TO_DISPLAY = 10;

// get URL parameter
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getVisitType() {
  return $("input[name='visit-type']:checked").val();
}

$(function() {
  var targetPage = getParameterByName('target');
  $('title').text('Before you go to ' + targetPage);

  // Convert the form entries into a record.
  function compileRecord(isVisitingPage) {
    var visitType = getVisitType();
    var promptText = $('#prompt-text').val();
    if (!promptText) {
      if (isVisitingPage) {
        $('#nothing-entered-alert').show();
      }
      return null;
    }
    var record = {
      visitType: visitType,
      targetPage: targetPage,
      timeMs: new Date().getTime(),
      promptText: promptText,
      isVisitingPage: isVisitingPage
    };
    if (visitType == 'purpose') {
      record.onlyTargetPage = $("input[name='only-target-page']").is(':checked');
    } else if (visitType == 'entertainment') {
      // no special logic yet
    } else {
      alert('ERROR visit type ' + visitType);
    }
    return record;
  }

  // Try to add the record and maybe visit the page.
  function submit(isVisitingPage) {
    var record = compileRecord(isVisitingPage);
    if (record) {
      chrome.runtime.sendMessage({addRecord: {newRecord: record}}, function() {
        if (isVisitingPage) {
          window.location = targetPage;
        }
      });
    }
    if (!isVisitingPage) {
      window.history.go(-2);
    }
  }

  function updateVisitType() {
    var visitType = getVisitType();
    if (visitType == 'purpose') {
      $('.entertainment-section').hide();
      $('.purpose-section').show();
      $('#prompt-text').attr('rows', '2');
    } else if (visitType == 'entertainment') {
      $('.purpose-section').hide();
      $('.entertainment-section').show();
      $('#prompt-text').attr('rows', '8');
    } else {
      alert('INTERNAL ERROR: visitType = "' + visitType + '"');
    }
  }

  updateVisitType();
  $("input[name='visit-type']").click(updateVisitType);

  $('.back-button').click(function() {
    submit(false);
  });

  $('.go-button').click(function() {
    submit(true);
  });

  $('#history-button').click(function() {
    $('#history-button').hide();
    $('#records-section').show();
  });

  // Converts a record to a DOM element (displayed at the bottom of the page).
  function recordToElement(record) {
    var container = $('<li>');
    container.addClass('list-group-item');
    var description = '';
    if (record.isVisitingPage) {
      description += 'Visited';
    } else {
      description += 'Chose not to visit';
    }
    description += ' ' + record.targetPage + ' for';
    if (record.visitType == 'purpose') {
      description += ' a specific purpose:';
    } else {
      description += ' ' + record.visitType + '.';
    }
    container.append($('<h4>').text(description));
    container.append($('<p>').text(record.promptText).css('white-space', 'pre-wrap'));
    return container;
  }

  chrome.runtime.sendMessage({getRecords: {amount: 10}}, function(dict) {
    var records = dict.records;
    for (var i = records.length - 1; i >= 0; --i) {
      var element = recordToElement(records[i]);
      $('#records-list').append(element);
    }
  });

});

