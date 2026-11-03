import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
from urllib.error import HTTPError
from nexolab.adapters.web.service import EvaluationService

class ConnectionProbeTests(unittest.TestCase):
    def service(self):
        return EvaluationService(Path("runs"), lambda: None, connection={"settings":{"adapter":"nexora","base_url":"http://localhost:8000"},"token":"secret"})

    def test_authenticated_success(self):
        response = MagicMock()
        response.status = 200
        response.read.return_value = b'{"username":"tester"}'
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value = response
        with patch("urllib.request.build_opener", return_value=opener):
            result = self.service().test_connection()
        self.assertTrue(result["ok"])
        self.assertNotIn("secret", str(result))

    def test_expired_session(self):
        opener = MagicMock()
        opener.open.side_effect = HTTPError("http://localhost:8000",401,"",{},None)
        with patch("urllib.request.build_opener", return_value=opener):
            result = self.service().test_connection()
        self.assertFalse(result["ok"])
        self.assertEqual(result["reason"], "unauthorized")
