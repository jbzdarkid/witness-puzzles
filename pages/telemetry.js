namespace(function() {

var table = document.createElement('table')
window.onload = function() {
  var logout = document.createElement('a')
  logout.href = '/logout?next=browse.html'
  logout.innerText = 'Logout'
  document.body.appendChild(logout)

  document.body.appendChild(document.createElement('br'))

  table.cellSpacing = '0'
  table = document.body.appendChild(table)

  var row = table.insertRow()
  insertCell(row).innerText = ''
  insertCell(row).innerText = 'Page'
  insertCell(row).innerText = 'Date'
  insertCell(row).innerText = 'Contents'

  for (var data of window.allFeedback) addTableRow(data, 'feedback')
  for (var data of window.allErrors) addTableRow(data, 'error')
}

function insertCell(row) {
  var cell = row.insertCell()
  cell.style.borderRight  = '1px solid black'
  cell.style.borderBottom = '1px solid black'
  if (row.cells.length === 1)  cell.style.borderLeft = '1px solid black'
  if (table.rows.length === 1) cell.style.borderTop = '1px solid black'
  return cell
}

function addTableRow(data, type) {
  var row = table.insertRow()
  var cell = insertCell(row)
  var button = document.createElement('button')
  button.innerText = 'X'
  button.style = 'background: black; color: red; font-size: 12px; cursor: pointer'
  button.onpointerdown = function(event) {
    event.preventDefault()
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
      if (this.readyState != XMLHttpRequest.DONE) return
      if (this.status === 200) {
        table.tBodies[0].removeChild(button.parentElement.parentElement)
      } else {
        alert(this.responseText)
      }
    }
    request.timeout = 120000 // 120,000 milliseconds = 2 minutes
    request.open('POST', '/delete_telemetry', true)
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.setRequestHeader('X-CSRFToken', window.csrfToken)
    request.send('id=' + data.id + '&type=' + type)
  }
  cell.appendChild(button)

  insertCell(row).innerText = data.page
  insertCell(row).innerText = data.date
  insertCell(row).innerText = data.data
}

})
