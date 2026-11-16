"""Serve web/ locally with caching off, so a rebuild shows up on a plain reload.

Usage: python3 scripts/serve.py [port]
"""

import functools
import http.server
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / "web"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(NoCacheHandler, directory=str(WEB))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Serving {WEB} at http://localhost:{port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
