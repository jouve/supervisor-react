all: dist

fmt:
	unify --in-place --recursive supervisor_react
	isort supervisor_react
	black supervisor_react

lint:
	flake8 --append-config pyproject.toml supervisor_react/*.py
	bandit supervisor_react/*.py
	pylint supervisor_react/*.py
	mypy supervisor_react
	#semgrep --config=p/ci supervisor_react
	#semgrep --config=p/security-audit supervisor_react

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
