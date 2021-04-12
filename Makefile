all: dist

fmt:
	unify --in-place --recursive supervisor_react
	isort --recursive supervisor_react
	black supervisor_react

lint:
	flake8 --append-config pyproject.toml supervisor_react/*.py
	bandit supervisor_react/*.py
	pylint supervisor_react/*.py

dist: supervisor_react/build
	poetry build

upload:
	twine upload dist/supervisor_react-*-py2.py3-none-any.whl

clean:
	make -C react-app clean
	rm -rf build dist supervisor_react/build

update: update3 react-app-update

update3:
	./update.sh

react-app-update:
	react-app/update.sh

supervisor_react/build:
	make -C react-app
	cp -r react-app/build supervisor_react/build

.PHONY: update
