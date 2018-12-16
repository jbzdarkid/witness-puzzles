from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto import Random
import hashlib

# travis encrypt PASSWORD=password -a -x

sha = SHA256.new()
sha.update(raw_input('Password:'))
key = sha.hexdigest()[:AES.block_size*2]

text = open('emails.txt', 'rb').read()
iv = text[:AES.block_size]
cipher = text[AES.block_size:]
aes = AES.new(key, AES.MODE_CBC, iv)
plain = aes.decrypt(cipher).strip()

print 'Decrypted: "' + plain + '"'
plain += ','+raw_input('Append data:')
plain += ' '*(AES.block_size - len(plain)%AES.block_size)

iv = Random.new().read(AES.block_size)
aes = AES.new(key, AES.MODE_CBC, iv)
cipher = aes.encrypt(plain)
open('emails.txt', 'wb').write(iv+cipher)
