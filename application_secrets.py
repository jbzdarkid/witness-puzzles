class Secrets:
  def __init__(self):
    self.RDS_USERNAME         = '' # Same as keepass
    self.RDS_PASSWORD         = '' # Same as keepass
    self.RDS_HOSTNAME         = '' # Instance endpoint
    self.RDS_PORT             = '' # Instance port
    self.RDS_DB_NAME          = '' # Instance configuration -> DB name
    self.S3_ACCESS_KEY        = '' # S3 username, keepass
    self.S3_SECRET_ACCESS_KEY = '' # S3 password, keepass
    self.SECRET_KEY           = 'default' # CSRF secret key, keepass

  def __bool__(self):
    return self.RDS_DB_NAME != ''

  def get_database_uri(self):
    if self:
      return 'mysql://{user}:{pswd}@{host}:{port}/{name}'.format(
        user = self.RDS_USERNAME,
        pswd = self.RDS_PASSWORD,
        host = self.RDS_HOSTNAME,
        port = self.RDS_PORT,
        name = self.RDS_DB_NAME,
      )
    else:
      return 'sqlite:///:memory:'

secrets = Secrets()
