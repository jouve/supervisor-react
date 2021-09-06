import argparse
import os

from httpx import AsyncClient
from starlette.applications import Starlette
from starlette.responses import Response, StreamingResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles
from uvicorn import run


async def logtail(request):
    response = await request.app.state.client.send(
        request.app.state.client.build_request(
            request.method,
            request.scope['path'],
        ),
        stream=True,
        timeout=300,
    )
    return StreamingResponse(response.aiter_raw(), response.status_code, response.headers, background=response.aclose)


async def rpc2(request):
    response = await request.app.state.client.request(
        request.method,
        request.scope['path'],
        content=await request.body(),
    )
    return Response(response.content, response.status_code, response.headers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-V', '--version', action='version', version='0.2.1')
    parser.add_argument(
        '-v',
        '--verbose',
        action='count',
        default=0,
        help='Verbose mode. Multiple -v options increase the verbosity. The maximum is 2.',
    )
    parser.add_argument('-H', '--host', default='127.0.0.1', help='Bind socket to this host. default: %(default)s')
    parser.add_argument('-p', '--port', type=int, default=8888, help='Bind socket to this port. default: %(default)s')
    parser.add_argument(
        '-s', '--supervisor', default='http://localhost:9001', help='Supervisor rpc interface. default: %(default)s'
    )
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
    app.state.client = AsyncClient(base_url=args.supervisor)
    run(app, host=args.host, port=args.port, log_level=['info', 'debug', 'trace'][min(args.verbose, 2)])
