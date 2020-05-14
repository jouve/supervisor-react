import subprocess

from setuptools import setup
from setuptools.command.build_py import build_py as _build_py
from setuptools.command.sdist import sdist as _sdist


class build_py(_build_py):
    def run(self):
        subprocess.check_call(['make', 'supervisor_react/build'])
        _build_py.run(self)


class sdist(_sdist):
    def run(self):
        subprocess.check_call(['make', 'supervisor_react/build'])
        _sdist.run(self)


setup(cmdclass={
    'build_py': build_py,
    'sdist': sdist,
})
