/**
 * The MIT License (MIT)
 * Copyright (c) 2019-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

'use strict';

const colors = require('colors');
const Table = require('cli-table3');

const EPSILON = 'ε';
const EPSILON_CLOSURE = `${EPSILON}*`;

/**
 * Wrapper class over `cli-table3` with default options preset.
 */
class TablePrinter {
  constructor(options) {
    return new Table(
      Object.assign({}, options, {
        style: {
          head: ['blue'],
          border: ['gray'],
        },
      })
    );
  }

  /**
   * Prints a NFA table.
   */
  static printNFATable(nfa) {
    console.info(colors.bold(`\nNFA transition table:\n`));

    const alphabet = [...nfa.getAlphabet(), EPSILON_CLOSURE];

    const printer = new TablePrinter({
      head: [''].concat(alphabet),
    });

    const table = nfa.getTransitionTable();
    const acceptingStates = nfa.getAcceptingStateNumbers();

    for (const stateNumber in table) {
      const tableRow = table[stateNumber];

      let stateLabel = acceptingStates.has(Number(stateNumber))
        ? colors.bold(colors.green(`${stateNumber} ✓`))
        : colors.blue(stateNumber);

      if (stateNumber == 1) {
        stateLabel += colors.yellow(' >');
      }

      const row = {[stateLabel]: []};

      alphabet.forEach(symbol => {
        let entry = '';

        if (Array.isArray(tableRow[symbol])) {
          entry = tableRow[symbol].length === 1
            ? tableRow[symbol][0]
            : `{${tableRow[symbol].join(',')}}`;
        }

        row[stateLabel].push(entry);
      });

      printer.push(row);
    }

    console.info(printer.toString());
    console.info('');
  }

  /**
   * Prints a DFA table.
   */
  static printDFATable(dfa, header = '\nDFA transition table:\n') {
    console.info(colors.bold(header));

    const alphabet = [...dfa.getAlphabet()];

    const printer = new TablePrinter({
      head: [''].concat(alphabet),
    });

    const table = dfa.getTransitionTable();
    const acceptingStates = dfa.getAcceptingStateNumbers();

    for (const stateNumber in table) {
      const tableRow = table[stateNumber];

      let stateLabel = acceptingStates.has(Number(stateNumber))
        ? colors.bold(colors.green(`${stateNumber} ✓`))
        : colors.blue(stateNumber);

      if (stateNumber == 1) {
        stateLabel += colors.yellow(' >');
      }

      const row = {[stateLabel]: []};

      alphabet.forEach(symbol => {
        row[stateLabel].push(tableRow[symbol] || '');
      });

      printer.push(row);
    }

    console.info(printer.toString());
    console.info('');
  }
}

module.exports = TablePrinter;