import base64
import binascii
import json
from pathlib import Path
import socket
import struct
import tempfile
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zlib

import uvicorn
from nexolab.adapters.web.auth import AuthStore
from nexolab.adapters.web.fastapi_server import create_app


def png(width=1, height=1):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', binascii.crc32(kind + data))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress((b'\0' + b'\xff\0\0\xff' * width) * height)) + chunk(b'IEND', b''))


class ProfileAvatarTests(unittest.TestCase):
    def test_authenticated_upload_persistence_removal_and_validation(self):
        with tempfile.TemporaryDirectory() as temporary:
            database = Path(temporary) / 'auth.sqlite3'
            store = AuthStore(database)
            store.create_admin('admin', 'a-secure-test-password')
            user = store.authenticate('admin', 'a-secure-test-password')
            token, _ = store.create_session(user['id'], False)
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', 0))
                port = probe.getsockname()[1]
            app = create_app(None, None, 'fixture', temporary, port, store)
            server = uvicorn.Server(uvicorn.Config(app, host='127.0.0.1', port=port, log_level='error'))
            thread = threading.Thread(target=server.run, daemon=True)
            thread.start()
            try:
                for _ in range(200):
                    if server.started: break
                    time.sleep(.01)
                self.assertTrue(server.started)
                def request(path='/api/profile', method='GET', body=None, authenticated=True):
                    headers = {'X-NexoLab-Request':'1', 'Content-Type':'application/json'}
                    if authenticated: headers['Cookie'] = f'{AuthStore.SESSION_COOKIE}={token}'
                    req = Request(f'http://127.0.0.1:{port}{path}', method=method, headers=headers,
                                  data=json.dumps(body).encode() if body is not None else None)
                    try:
                        response = urlopen(req, timeout=5)
                    except HTTPError as error:
                        response = error
                    with response:
                        return response.status, response.read()
                self.assertEqual(request(authenticated=False)[0], 401)
                self.assertEqual(json.loads(request()[1]), {'has_avatar':False})
                image = png()
                payload = {'image':base64.b64encode(image).decode()}
                self.assertEqual(request('/api/profile/avatar', 'PUT', payload, False)[0], 401)
                self.assertEqual(request('/api/profile/avatar', 'PUT', payload)[0], 200)
                self.assertEqual(request('/api/profile/avatar')[1], image)
                self.assertEqual(AuthStore(database).get_avatar(user['id']), image)
                for invalid in [b'<svg/>', image[:33], png(257), image[:-1]+b'x']:
                    self.assertEqual(request('/api/profile/avatar', 'PUT', {'image':base64.b64encode(invalid).decode()})[0], 400)
                self.assertEqual(store.get_avatar(user['id']), image)
                self.assertEqual(request('/api/profile/avatar', 'DELETE')[0], 200)
                self.assertEqual(request('/api/profile/avatar')[0], 404)
                self.assertIsNone(AuthStore(database).get_avatar(user['id']))
            finally:
                server.should_exit = True
                thread.join(timeout=5)
