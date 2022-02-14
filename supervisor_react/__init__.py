import xmlrpc.client
from argparse import ArgumentParser
from contextlib import asynccontextmanager
from functools import partial
from typing import List, TypedDict, cast

from httpx import AsyncClient
from starlette.applications import Starlette
from starlette.background import BackgroundTask
from starlette.requests import Request
from starlette.responses import JSONResponse, StreamingResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles
from uvicorn import run  # type: ignore


async def logtail(request: Request):
    client: AsyncClient = request.app.state.client
    response = await client.send(
        client.build_request(
            request.method,
            request.scope['path'],
        ),
        stream=True,
    )
    return StreamingResponse(
        response.aiter_raw(),
        response.status_code,
        cast(dict, response.headers),
        background=BackgroundTask(response.aclose),
    )


class JsonXmlRpc(TypedDict):
    params: List[str]
    methodname: str


async def rpc2(request: Request):
    client: AsyncClient = request.app.state.client
    data: JsonXmlRpc = await request.json()
    response = await client.request(
        request.method,
        request.scope['path'],
        content=xmlrpc.client.dumps(tuple(data['params']), data['methodname']),
    )
    return JSONResponse(xmlrpc.client.loads(response.text, use_builtin_types=True)[0][0])


@asynccontextmanager
async def lifespan(app: Starlette, base_url: str):
    async with AsyncClient(base_url=base_url) as client:
        app.state.client = client
        yield


def main():
    parser = ArgumentParser()
    parser.add_argument('-V', '--version', action='version', version='0.3.0')
    parser.add_argument(
        '-v',
        '--verbose',
        action='count',
        default=0,
        help='Verbose mode. Multiple -v options increase the verbosity. The maximum is 2.',
    )
    parser.add_argument('-H', '--host', default='localhost', help='Bind socket to this host. default: %(default)s')
    parser.add_argument('-p', '--port', type=int, default=8888, help='Bind socket to this port. default: %(default)s')
    parser.add_argument(
        '-s', '--supervisor', default='http://localhost:9001', help='Supervisor rpc interface. default: %(default)s'
    )
    args = parser.parse_args()

    run(
        Starlette(
            args.verbose >= 1,
            [
                Route('/RPC2', rpc2, methods=['POST']),
                Route('/logtail/{path:path}', logtail),
                Route('/mainlogtail', logtail),
                Mount('/', StaticFiles(packages=[__package__], html=True)),
            ],
            lifespan=partial(lifespan, base_url=args.supervisor),
        ),
        host=args.host,
        port=args.port,
        log_level=['info', 'debug', 'trace'][min(args.verbose, 2)],
    )
