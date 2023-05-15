all: dist

fmt:
	isort supervisor_react
	black supervisor_react

lint:
	ruff supervisor_react
	flake8 supervisor_react
	bandit -c pyproject.toml -r supervisor_react
	pylint supervisor_react
	mypy supervisor_react

dist: supervisor_react/statics
	poetry build

clean:
	make -C react-app clean
	rm -rf build dist supervisor_react/statics

update: update-py update-node

update-py:
	./update.sh

update-node:
	react-app/update.sh

supervisor_react/statics:
	make -C react-app
	rm -rf supervisor_react/statics
	cp -r react-app/build supervisor_react/statics

.PHONY: update
