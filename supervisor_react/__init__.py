import argparse
import os
from urllib.parse import urljoin

from httpx import AsyncClient
from starlette.applications import Starlette
from starlette.responses import Response, StreamingResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles
from uvicorn import run


async def logtail(request):
    response = await request.app.state.client.send(
        request.app.state.client.build_request(
            request.scope['method'],
            urljoin(request.app.state.SUPERVISOR_URL, request.scope['path']),
        ),
        stream=True,
        timeout=300
    )
    return StreamingResponse(response.aiter_raw(), response.status_code, response.headers, background=response.aclose)


async def rpc2(request):
    response = await request.app.state.client.request(
        request.method,
        urljoin(request.app.state.SUPERVISOR_URL, request.scope['path']),
        content=await request.body(),
    )
    return Response(response.content, response.status_code, response.headers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-H', '--host', default='127.0.0.1', help='default: %(default)s')
    parser.add_argument('-p', '--port', type=int, default=8888, help='default: %(default)s')
    parser.add_argument('-s', '--supervisor', default='http://localhost:9001', help='default: %(default)s')
    parser.add_argument('-v', '--verbose', action='count', default=0)
    args = parser.parse_args()

    app = Starlette(
        args.verbose >= 1,
        [
            Route('/RPC2', rpc2, methods=['POST']),
            Route('/logtail/{path:path}', logtail),
            Route('/mainlogtail', logtail),
            Mount('/', StaticFiles(directory=os.path.join(os.path.dirname(__file__), 'build'), html=True)),
        ],
    )
    app.state.SUPERVISOR_URL = args.supervisor
    app.state.client = AsyncClient()
    run(app, host=args.host, port=args.port, log_level=['info', 'debug', 'trace'][min(args.verbose, 2)])
