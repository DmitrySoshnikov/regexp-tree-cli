# regexp-tree-cli

Regular expressions processor in JavaScript

The `regexp-tree-cli` is a command line utility fo the [regexp-tree](https://www.npmjs.com/package/regexp-tree) package.

### Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Usage as a CLI](#usage-as-a-cli)
- [Parsing and printing AST](#parsing-and-printing-ast)
- [Capturing locations](#capturing-locations)
- [Using optimizer API](#using-optimizer-api)
- [Using compat-transpiler API](#using-compat-transpiler-api)
- [Printing NFA/DFA tables](#printing-nfadfa-tables)

### Installation

The CLI can be installed as an [npm module](https://www.npmjs.com/package/regexp-tree-cli):

```
npm install -g regexp-tree-cli

regexp-tree-cli --help
```

### Development

1. Fork https://github.com/DmitrySoshnikov/regexp-tree-cli repo
2. If there is an actual issue from the [issues](https://github.com/DmitrySoshnikov/regexp-tree-cli/issues) list you'd like to work on, feel free to assign it yourself, or comment on it to avoid collisions (open a new issue if needed)
3. Make your changes
5. Submit a PR

### Usage as a CLI

Check the options available from CLI:

```
regexp-tree-cli --help
```

```
Usage: regexp-tree-cli [options]

Options:
  --help, -h        Show help                                          [boolean]
  --version, -v     Show version number                                [boolean]
  --expression, -e  A regular expression to be parsed                 [required]
  --loc, -l         Whether to capture AST node locations
  --optimize, -o    Apply optimizer on the passed expression
  --compat, -c      Apply compat-transpiler on the passed expression
  --table, -t       Print NFA/DFA transition tables (nfa/dfa/all)
                                                  [choices: "nfa", "dfa", "all"]
```

### Parsing and printing AST

To parse a regular expression, pass `-e` option:

```
regexp-tree-cli -e '/a|b/i'
```

Which produces an AST node corresponding to this regular expression:

```js
{
  type: 'RegExp',
  body: {
    type: 'Disjunction',
    left: {
      type: 'Char',
      value: 'a',
      symbol: 'a',
      kind: 'simple',
      codePoint: 97
    },
    right: {
      type: 'Char',
      value: 'b',
      symbol: 'b',
      kind: 'simple',
      codePoint: 98
    }
  },
  flags: 'i',
}
```

> NOTE: the format of a regexp is `/ Body / OptionalFlags`.

### Capturing locations

For source code transformation tools it might be useful also to capture _locations_ of the AST nodes. From the command line it's controlled via the `-l` option:

```
regexp-tree-cli -e '/ab/' -l
```

This attaches `loc` object to each AST node:

```js
{
  type: 'RegExp',
  body: {
    type: 'Alternative',
    expressions: [
      {
        type: 'Char',
        value: 'a',
        symbol: 'a',
        kind: 'simple',
        codePoint: 97,
        loc: {
          start: {
            line: 1,
            column: 1,
            offset: 1,
          },
          end: {
            line: 1,
            column: 2,
            offset: 2,
          },
        }
      },
      {
        type: 'Char',
        value: 'b',
        symbol: 'b',
        kind: 'simple',
        codePoint: 98,
        loc: {
          start: {
            line: 1,
            column: 2,
            offset: 2,
          },
          end: {
            line: 1,
            column: 3,
            offset: 3,
          },
        }
      }
    ],
    loc: {
      start: {
        line: 1,
        column: 1,
        offset: 1,
      },
      end: {
        line: 1,
        column: 3,
        offset: 3,
      },
    }
  },
  flags: '',
  loc: {
    start: {
      line: 1,
      column: 0,
      offset: 0,
    },
    end: {
      line: 1,
      column: 4,
      offset: 4,
    },
  }
}
```

### Using optimizer API

[Optimizer](https://github.com/DmitrySoshnikov/regexp-tree/tree/master/src/optimizer) transforms your regexp into an _optimized_ version, replacing some sub-expressions with their idiomatic patterns. This might be good for different kinds of minifiers, as well as for regexp machines.

> NOTE: the Optimizer is implemented as a set of _regexp-tree_ [plugins](#transform-plugins).

From CLI the optimizer is available via `--optimize` (`-o`) option:

```
regexp-tree-cli -e '/[a-zA-Z_0-9][A-Z_\da-z]*\e{1,}/' -o
```

Result:

```
Optimized: /\w+e+/
```

See the [optimizer README](https://github.com/DmitrySoshnikov/regexp-tree/tree/master/src/optimizer) for more details.

### Using compat-transpiler API

The [compat-transpiler](https://github.com/DmitrySoshnikov/regexp-tree/tree/master/src/compat-transpiler) module translates your regexp in new format or in new syntax, into an equivalent regexp in a legacy representation, so it can be used in engines which don't yet implement the new syntax.

> NOTE: the compat-transpiler is implemented as a set of _regexp-tree_ [plugins](#transform-plugins).

Example, "dotAll" `s` flag:


```js
/./s
```

Is translated into:

```js
/[\0-\uFFFF]/
```

Or [named capturing groups](#named-capturing-group):

```js
/(?<value>a)\k<value>\1/
```

Becomes:

```js
/(a)\1\1/
```

From CLI the compat-transpiler is available via `--compat` (`-c`) option:

```
regexp-tree-cli -e '/(?<all>.)\k<all>/s' -c
```

Result:

```
Compat: /([\0-\uFFFF])\1/
```

### Printing NFA/DFA tables

The `--table` option allows displaying NFA/DFA transition tables. RegExp Tree also applies _DFA minimization_ (using _N-equivalence_ algorithm), and produces the minimal transition table as its final result.

In the example below for the `/a|b|c/` regexp, we first obtain the NFA transition table, which is further converted to the original DFA transition table (down from the 10 non-deterministic states to 4 deterministic states), and eventually minimized to the final DFA table (from 4 to only 2 states).

```
./bin/regexp-tree-cli -e '/a|b|c/' --table all
```

Result:

```
> - starting
✓ - accepting

NFA transition table:

┌─────┬───┬───┬────┬─────────────┐
│     │ a │ b │ c  │ ε*          │
├─────┼───┼───┼────┼─────────────┤
│ 1 > │   │   │    │ {1,2,3,7,9} │
├─────┼───┼───┼────┼─────────────┤
│ 2   │   │   │    │ {2,3,7}     │
├─────┼───┼───┼────┼─────────────┤
│ 3   │ 4 │   │    │ 3           │
├─────┼───┼───┼────┼─────────────┤
│ 4   │   │   │    │ {4,5,6}     │
├─────┼───┼───┼────┼─────────────┤
│ 5   │   │   │    │ {5,6}       │
├─────┼───┼───┼────┼─────────────┤
│ 6 ✓ │   │   │    │ 6           │
├─────┼───┼───┼────┼─────────────┤
│ 7   │   │ 8 │    │ 7           │
├─────┼───┼───┼────┼─────────────┤
│ 8   │   │   │    │ {8,5,6}     │
├─────┼───┼───┼────┼─────────────┤
│ 9   │   │   │ 10 │ 9           │
├─────┼───┼───┼────┼─────────────┤
│ 10  │   │   │    │ {10,6}      │
└─────┴───┴───┴────┴─────────────┘


DFA: Original transition table:

┌─────┬───┬───┬───┐
│     │ a │ b │ c │
├─────┼───┼───┼───┤
│ 1 > │ 4 │ 3 │ 2 │
├─────┼───┼───┼───┤
│ 2 ✓ │   │   │   │
├─────┼───┼───┼───┤
│ 3 ✓ │   │   │   │
├─────┼───┼───┼───┤
│ 4 ✓ │   │   │   │
└─────┴───┴───┴───┘


DFA: Minimized transition table:

┌─────┬───┬───┬───┐
│     │ a │ b │ c │
├─────┼───┼───┼───┤
│ 1 > │ 2 │ 2 │ 2 │
├─────┼───┼───┼───┤
│ 2 ✓ │   │   │   │
└─────┴───┴───┴───┘
```