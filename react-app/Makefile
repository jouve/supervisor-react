all: build

fmt:
	./node_modules/.bin/prettier --write --print-width 120 *.json public/*.{html,json} src/*.{ts,tsx}

node_modules:
	yarn install

build: node_modules
	yarn build

clean:
	rm -rf build
