from flask import render_template, request
from flask_login import current_user, login_required, login_user, UserMixin, LoginManager
from application_utils import *

application.login_manager = LoginManager()
@application.login_manager.user_loader
def load_user(user_id):
  user = UserMixin()
  user.id = user_id
  return user

host_redirect('/pages/login_admin.html', '/login_admin.html')
def login_admin():
  if request.method == 'GET':
    return render_template('login_admin.html')

  if request.form['username'] == 'foo' and request.form['password'] == 'bar':
    user = UserMixin()
    user.id = request.form['username']
    login_user(user)
    print('Logged in as', user.id)
    return redirect('/browse_admin.html')
  return render_template('login_admin.html')
application.add_url_rule('/pages/login_admin.html', 'login_admin', login_admin, methods=['GET', 'POST'])

host_redirect('/pages/browse_admin.html', '/browse_admin.html')
def browse_admin():
  if current_user.get_id() != 'foo':
    return render_template('404_generic.html')
  return render_template('browse_admin.html')
application.add_url_rule('/pages/browse_admin.html', 'browse_admin', browse_admin)

def delete():
  if current_user.get_id() == 'foo':
    print('Authenticated as', current_user.id, 'deleting puzzle', request.form['puzzle'])
    print(current_user.id)
  return '', 200
application.add_url_rule('/delete', 'delete', delete, methods=['POST'])

def refresh():
  if current_user.get_id() == 'foo':
    print('Authenticated as', current_user.id, 'refreshing puzzle', request.form['puzzle'])
    print(current_user.id)
  return '', 200
application.add_url_rule('/refresh', 'refresh', refresh, methods=['POST'])
