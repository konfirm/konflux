# Generate the list of authors with the number of occurences in the git log (representing the amount of commits)
commit-count:
	@git log --format='%aN <%aE>' | sort | uniq -c | sort -r;

# The list of authors, with the commit-count itself removed
credits:
	@$(MAKE) commit-count | sed 's/^ *[0-9]* //';

authors:
	@$(MAKE) credits > AUTHORS;
