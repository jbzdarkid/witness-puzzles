function onSubmit(e) {
  var puzzle = e.response.getItemResponses()[0].getResponse()
  var payload = JSON.stringify({
    'ref': 'gh-pages',
    'inputs': {'puzzle': puzzle},
  })
  var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer <TOKEN>',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': headers,
  }
  UrlFetchApp.fetch('https://api.github.com/repos/jbzdarkid/witness-puzzles/actions/workflows/62200595/dispatches', options);
}
