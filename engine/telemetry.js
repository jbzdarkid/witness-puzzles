namespace(function() {

// https://stackoverflow.com/q/12571650
window.addEventListener('error', function(event) {
  console.error('Error in file ' + event.filename + ' on line ' + event.lineno)

  console.error('To open a bug, click the link below:')
  if (window.settings.githubAccount != 'true') {
    console.error('Note that you will need a (free) GitHub account.')
  }

  var issueUrl = window.getIssueUrl({
    'labels': 'bug report',
    'title': 'Bug report',
    'body': 'Page: ' + window.location.href + '\n' +
            'Stacktrace: ```' + (event.error ? event.error.stack : 'null') + '```\n' +
            'Additional comments: ',
  })
  console.error(issueUrl)
})

})
