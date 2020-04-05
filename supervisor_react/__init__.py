import argparse
import contextlib
import logging
import os

from tornado.gen import WaitIterator, coroutine
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from tornado.iostream import StreamClosedError
from tornado.locks import Condition
from tornado.log import LogFormatter
from tornado.simple_httpclient import HTTPStreamClosedError
from tornado.simple_httpclient import SimpleAsyncHTTPClient as _SimpleAsyncHTTPClient
from tornado.simple_httpclient import _HTTPConnection
from tornado.web import Application, RequestHandler, StaticFileHandler

try:
    from urllib.parse import urljoin
except ImportError:
    from urlparse import urljoin


class HTTPConnection(_HTTPConnection):
    def headers_received(self, first_line, headers):
        if self.request.expect_100_continue and first_line.code == 100:
            self._write_body(False)
            return
        self.code = first_line.code
        self.reason = first_line.reason
        self.headers = headers

        if self._should_follow_redirect():
            return

        if self.request.header_callback is not None:
            self.request.header_callback(first_line, headers)


class SimpleAsyncHTTPClient(_SimpleAsyncHTTPClient):
    def _connection_class(self):
        return HTTPConnection


AsyncHTTPClient.configure(SimpleAsyncHTTPClient)


class SupervisorHandler(RequestHandler):
    def initialize(self, supervisor):
        self.supervisor = supervisor


class LogtailHandler(SupervisorHandler):
    @coroutine
    def get(self, path=''):
        cond = Condition()

        def header_callback(_first_line, headers):
            for k, v in headers.items():
                if k == 'Transfer-Encoding':
                    continue
                self.set_header(k, v)
            cond.notify()

        def streaming_callback(chunk):
            try:
                self.write(chunk)
            except RuntimeError:  # client closed the connection
                pass
            cond.notify()

        # AsyncHTTPClient adds 'Connection: close' by default
        # it causes supervisor to close the connection, and so to not stream it
        with contextlib.closing(AsyncHTTPClient()) as client:
            fut = client.fetch(
                urljoin(self.supervisor, path),
                streaming_callback=streaming_callback,
                header_callback=header_callback,
                connect_timeout=3600,
                request_timeout=3600,
                headers={'Connection': 'Keep-Alive'},
            )
            while True:
                try:
                    yield WaitIterator(cond.wait(), fut).next()
                except HTTPStreamClosedError:  # connection to supervisor closed
                    pass
                try:
                    yield self.flush()
                except StreamClosedError:  # client closed the connection
                    break
                if fut.done():
                    break


class RPC2Handler(SupervisorHandler):
    @coroutine
    def post(self):
        resp = yield AsyncHTTPClient().fetch(
            urljoin(self.supervisor, 'RPC2'),
            method='POST',
            body=self.request.body,
        )
        for k, v in resp.headers.items():
            self.set_header(k, v)
        self.write(resp.body)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-d', '--debug', action='store_true')
    parser.add_argument('-p', '--port', type=int, default=8888, help='default: %(default)s')
    parser.add_argument('-s', '--supervisor', default='http://localhost:9001', help='default: %(default)s')
    parser.add_argument('-v', '--verbose', action='count', default=0)
    args = parser.parse_args()

    logging.basicConfig(level=[logging.WARNING, logging.INFO, logging.DEBUG][min(args.verbose, 2)])
    logging.getLogger().handlers[0].setFormatter(LogFormatter())

    app = Application(
        [
            (r'/RPC2', RPC2Handler, {
                'supervisor': args.supervisor
            }),
            (r'/(mainlogtail|logtail/.*)', LogtailHandler, {
                'supervisor': args.supervisor
            }),
            (r'/(.*)', StaticFileHandler, {
                'path': os.path.join(os.path.dirname(__file__), 'build'),
                'default_filename': 'index.html'
            }),
        ],
        debug=args.debug,
    )
    app.listen(args.port)
    IOLoop.current().start()
