from pathlib import Path
import os
import re
import subprocess

def gpg_decrypt(ciphertext, key):
    # For security reasons, GPG always prefers to read and write from files.
    tmp = os.environ.get('RUNNER_TEMP', '/tmp')
    with open(f'{tmp}/ciphertext.txt', 'wb') as f:
        f.write(ciphertext)
    with open(f'{tmp}/key.txt', 'w') as f:
        f.write(key)
    subprocess.run([
        'gpg', '--batch', '--symmetric',
        '--cipher-algo', 'AES256',
        '--passphrase-file', f'{tmp}/key.txt',
        '-o', f'{tmp}/plaintext.txt',
        '-c', f'{tmp}/ciphertext.txt',
    ], check=True, stdout=subprocess.DEVNULL)
    with open(f'{tmp}/plaintext.txt', 'r') as f:
        return f.read()

solution = '8c0d04090302bbbd7c239bddad33ffd26001d0412417d35052fdf3d5e9f0f69ad7bbe55f69835ea1f6b3c024a7e79ac1f82c15dad80c40b7cc57483c2387059eb876cecdf899f64bd5bf1f17bfc6c1e361a0fb7917fecb1d274254705f7946c8e43b13434b33b1f2be4854858c53a54438'

ciphertext = bytes.fromhex(solution)

display_hash = os.environ['DISPLAY_HASH']
with open(f'play/{display_hash}.html', 'r', encoding='utf-8') as f:
  contents = f.read()
start_index = contents.index('<!-- ')
end_index = contents.index(' -->')


solution_path = gpg_decrypt(solution_path, os.environ['SECRET'])


# 

