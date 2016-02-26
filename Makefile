#  Generate the list of authors with the number of occurences in the git log
#  (representing the amount of commits)
commit-count:
	@git log --format='%aN <%aE>' | sort | uniq -c | sort -r;

#  The list of authors, with the commit-count itself removed
credits:
	@$(MAKE) commit-count | sed 's/^ *[0-9]* //';

#  The list of authors piped into AUTHORS file
authors:
	@$(MAKE) credits > AUTHORS;

#  clean up the build target (if exists)
clean:
	@rm -rf ./build/* || mkdir -p ./build;

#  build the konflux and script targets
build:
	@devour konflux addon;

build-all:
	@devour konflux addon konflux:{ajax,browser,dom,event,iterator,observer,style};

#  create a package for the minified sources
release-min:
	@find ./build/konflux/* -iname "*.map" -o -iname "*.min.js" | \
		xargs tar zcf ./build/konflux-`node -pe "require('./package.json').version"`-min-map.tgz;

#  create a package for the full (compiled) sources
release-full:
	@find ./build/konflux/* -name "*.js" | \
		grep -v "min.js" | grep -v "min.js.map" | \
		xargs tar zcf ./build/konflux-`node -pe "require('./package.json').version"`.tgz;

#  create both the full and the minified packages
release:
	@$(MAKE) clean build-all release-min release-full;

#  work around name clashes (where make-tasks conflict with directories)
.PHONY: build
