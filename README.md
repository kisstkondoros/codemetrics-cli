# Code Metrics - CLI

Computes complexity in TypeScript / JavaScript files.

# Complexity calculation

The steps of the calculation:

- create an AST from the input source file
- walk through each and every node of it
- depending on the type of the node and the configuration associated with it create a new entry about the node.
  This entry contains everything necessary for further use
  (e.g. a textual representation for the node, complexity increment, child nodes etc.)
- show the sum of complexity of child nodes for methods and the maximum of child nodes for classes

Please note that it is not a standard metric, but it is a close approximation
of [Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity).

Please also note that it is possible to balance the complexity calculation for the
project / team / personal taste by adjusting the relevant configuration entries.

For example if one prefers [guard clauses](https://refactoring.com/catalog/replaceNestedConditionalWithGuardClauses.html),
and is ok with all the branches in switch statements then the following could be applied:

```javascript
// codemetrics.config.js
// @ts-check
/** @type {import("codemetrics-cli").MetricsConfiguration}*/
var config = {};
config.ReturnStatement = 0;
config.CaseClause = 0;
config.DefaultClause = 0;

module.exports = config;
```

## Configuration

The computation can be configured by default via the `codemetrics.config.js` file which is looked up automatically in the current and in the parent directories or by specifying the config file (with a relative or absolute path) via the `--config` parameter.

The file must have a single export, the configuration itself for which typescript type definitions are also provided. (See the example above)

## Parameters

```
  -t, --threshold <number>  Minimum complexity to be shown
  -c, --config <string>     Path to the config file
  -l, --lint                Exit with non-zero on issues
  -p, --pattern <string>    Glob pattern
```

You can also use `codemetrics-cli --help` to get the list of the possible options.

## Contributions

- Add lint option to `fail` output when threshold not met - by @kopach
