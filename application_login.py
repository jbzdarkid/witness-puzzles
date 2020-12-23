from flask import render_template, request
from flask_login import current_user, login_required, login_user, UserMixin, LoginManager
from application_utils import *

def browse_admin():
  def request_is_authorized():
    if not request.authorization:
        return False # No auth provided, block access
    if ('foo' == request.authorization.username and
        'bar' == request.authorization.password):
      return True # Correct user/pass provided, allow access
  if not request_is_authorized():
    return '', 401, {'WWW-Authenticate': 'Basic realm=""'}

  user = UserMixin()
  user.id = '1'
  login_user(user)
  return render_template('browse_admin.html')
application.add_url_rule('/pages/browse_admin.html', 'browse_admin', browse_admin)

application.login_manager = LoginManager()
@application.login_manager.user_loader
def load_user(user_id):
  user = UserMixin()
  user.id = user_id
  return user

def delete():
  if current_user.get_id():
    print('Authenticated as', current_user.id, 'deleting puzzle', request.form['puzzle'])
    print(current_user.id)
  return '', 200
application.add_url_rule('/delete', 'delete', delete, methods=['POST'])

def refresh():
  if current_user:
    print('Authenticated as', current_user.id, 'refreshing puzzle', request.form['puzzle'])
    print(current_user.id)
  return '', 200
application.add_url_rule('/refresh', 'refresh', refresh, methods=['POST'])
