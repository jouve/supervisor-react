all: dist


fmt:
	isort *.py supervisor_react/*.py
	unify -i *.py supervisor_react/*.py
	yapf -i *.py supervisor_react/*.py

lint:
	flake8 *.py supervisor_react/*.py
	bandit *.py supervisor_react/*.py
	pylint *.py supervisor_react/*.py

dist: supervisor_react/build
	python setup.py bdist_wheel

upload:
	twine upload dist/supervisor_react-*-py2.py3-none-any.whl
clean:
	make -C react-app clean
	rm -rf build dist supervisor_react/build

supervisor_react/build:
	make -C react-app
	cp -r react-app/build supervisor_react/build
