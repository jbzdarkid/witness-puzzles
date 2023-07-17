function onSubmit(e) {
  // This input is untrusted, so we must validate it before sending it further downstream.
  var puzzle = JSON.parse(e.response.getItemResponses()[0].getResponse().trim())
  var requestId = JSON.parse(e.response.getItemResponses()[0].getResponse().trim())
  var payload = JSON.stringify({
    'ref': 'gh-pages',
    'inputs': {'requestId': requestId, 'puzzle': JSON.stringify(puzzle)},
  })
  var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer your_personal_access_token',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': headers,
  }
  var response = UrlFetchApp.fetch('https://api.github.com/repos/jbzdarkid/witness-puzzles/actions/workflows/62200595/dispatches', options);
  console.info(response.getResponseCode(), response.getContentText())
}

