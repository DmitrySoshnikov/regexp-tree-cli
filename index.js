/**
 * The MIT License (MIT)
 * Copyright (c) 2019-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

'use strict';

const colors = require('colors');
const os = require('os');
const regexpTree = require('regexp-tree');
const TablePrinter = require('./src/TablePrinter');

function enforceUnique(v) {
  return Array.isArray(v) ? v[v.length - 1] : v;
}

const options = require('yargs')
  .usage('Usage: $0 [options]')
  .options({
    expression: {
      alias: 'e',
      describe: 'A regular expression to be parsed',
      demandOption: true,
      requiresArg: true,
      coerce: enforceUnique,
    },
    loc: {
      alias: 'l',
      describe: 'Whether to capture AST node locations',
    },
    optimize: {
      alias: 'o',
      describe: 'Apply optimizer on the passed expression',
    },
    compat: {
      alias: 'c',
      describe: 'Apply compat-transpiler on the passed expression',
    },
    table: {
      alias: 't',
      describe: 'Print NFA/DFA transition tables (nfa/dfa/all)',
      nargs: 1,
      choices: ['nfa', 'dfa', 'all'],
      coerce: enforceUnique,
    }
  })
  .alias('help', 'h')
  .alias('version', 'v')
  .argv;

function shouldStripQuotes(expression) {
  return os.platform() === 'win32' && (
    (expression[0] === `'` && expression[expression.length - 1] === `'`) ||
    (expression[0] === '"' && expression[expression.length - 1] === '"')
  );
}

function normalize(expression) {
  if (!shouldStripQuotes(expression)) {
    return expression;
  }

  // For Windows strip ' at the beginning and end.
  return expression.slice(1, -1);
}

function main() {
  const {
    compat,
    loc,
    optimize,
    table,
  } = options;

  const expression = normalize(options.expression);

  // ------------------------------------------------------
  // Optimizer.

  if (optimize) {
    const optimized = regexpTree.optimize(expression);
    console.info('\n', colors.bold('Optimized:'), optimized.toString(), '\n');
    return;
  }

  // ------------------------------------------------------
  // Compat-transpiler.

  if (compat) {
    const compatTranspiled = regexpTree.compatTranspile(expression);
    console.info(
      '\n', colors.bold('Compat:'),
      compatTranspiled.toString(), '\n'
    );
    return;
  }

  // ------------------------------------------------------
  // Transition table.
  if (table) {
    const {fa} = regexpTree;

    const shouldPrintNFA = (table === 'nfa' || table === 'all');
    const shouldPrintDFA = (table === 'dfa' || table === 'all');

    console.info(`\n${colors.bold(colors.yellow('>'))} - starting`);
    console.info(`${colors.bold(colors.green('✓'))} - accepting`);

    if (shouldPrintNFA) {
      TablePrinter.printNFATable(fa.toNFA(expression));
    }

    if (shouldPrintDFA) {
      const dfa = fa.toDFA(expression);
      TablePrinter.printDFATable(dfa, '\nDFA: Original transition table:\n');

      dfa.minimize();
      TablePrinter.printDFATable(dfa, '\nDFA: Minimized transition table:\n');
    }

    return;
  }

  // ------------------------------------------------------
  // Parsing.

  const parseOptions = {
    captureLocations: loc,
  };

  const parsed = regexpTree.parse(expression, parseOptions);

  console.info(JSON.stringify(parsed, null, 2));

}

module.exports = main;

if (require.main === module) {
  main();
}