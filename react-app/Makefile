all: build

fmt:
	./node_modules/.bin/prettier --write --print-width 120 *.json public/*.{html,json} src/*.{ts,tsx}

build:
	./build.sh

clean:
	rm -rf build
