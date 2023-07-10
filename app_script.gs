function onSubmit(e) {
  // This input is untrusted, so we should verify that it's valid JSON (and *only* send JSON further downstream).
  var puzzle = JSON.parse(e.response.getItemResponses()[0].getResponse().trim())
  var payload = JSON.stringify({
    'ref': 'gh-pages',
    'inputs': {'puzzle': JSON.stringify(puzzle)},
  })
  var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer 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',
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

