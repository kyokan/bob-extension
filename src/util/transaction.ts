import {Transaction} from "@src/ui/ducks/transactions";

export function getTXValue(tx: Transaction): number {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  let covValue = 0;
  let totalValue = 0;

  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      if (output.path) {
        totalValue += output.value;
      }
      continue;
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    covAction = covenant.action;

    // Special case for reveals and registers, indicate how much
    // spendable balance is returning to the wallet
    // as change from the mask on the bid, or the difference
    // between the highest and second-highest bid.
    if (covenant.action === 'REVEAL'
      || covenant.action === 'REGISTER') {
      covValue += !output.path
        ? output.value
        : tx.inputs[i].value - output.value;
    } else {
      covValue += output.value;
    }

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'RENEW' ||
      covenant.action === 'UPDATE' ||
      covenant.action === 'TRANSFER' ||
      covenant.action === 'FINALIZE') {
      covValue = 0;
    }
  }

  if (covAction === 'BID') {
    return -covValue;
  }

  // This TX was a covenant, return.
  if (covAction) {
    return covValue;
  }

  // This TX must have been a plain send from the wallet.
  const inputValue = tx.inputs.reduce((sum, input) => {
    if (input.coin) {
      return sum + input.coin.value;
    }
    return sum + input.value;
  }, 0);

  const outputValue = tx.outputs.reduce((sum, output) => {
    if (output.path || output.owned) {
      return sum + output.value;
    } else {
      return sum;
    }
  }, 0);

  return outputValue - inputValue + tx.fee;
}

export function getTXAction(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  let covValue = 0;
  let totalValue = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      if (output.path) {
        totalValue += output.value;
      }
      continue;
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    covAction = covenant.action;

    // Special case for reveals and registers, indicate how much
    // spendable balance is returning to the wallet
    // as change from the mask on the bid, or the difference
    // between the highest and second-highest bid.
    if (covenant.action === 'REVEAL'
      || covenant.action === 'REGISTER') {
      covValue += !output.path
        ? output.value
        : tx.inputs[i].value - output.value;
    } else {
      covValue += output.value;
    }

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'RENEW' ||
      covenant.action === 'UPDATE' ||
      covenant.action === 'TRANSFER' ||
      covenant.action === 'FINALIZE') {
      covValue = 0;
    }
  }

  // This TX was a covenant, return.
  if (covAction) {
    return covAction;
  }

  // If there were outputs to the wallet's receive branch
  // but no covenants, this was just a plain receive.
  // Note: assuming input[0] is the "from" is not really helpful data.
  if (totalValue > 0) {
    return 'RECEIVE';
  }

  // This TX must have been a plain send from the wallet.
  // Assume that the first non-wallet output of the TX is the "to".
  const output = tx.outputs.filter(({path}) => !path)[0];

  if (!output) {
    return 'SEND';
  }

  return 'SEND';
}

export function getTXRecipient(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  let covValue = 0;
  let totalValue = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      if (output.path) {
        totalValue += output.value;
      }
      continue;
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    covAction = covenant.action;

    // Special case for reveals and registers, indicate how much
    // spendable balance is returning to the wallet
    // as change from the mask on the bid, or the difference
    // between the highest and second-highest bid.
    if (covenant.action === 'REVEAL'
      || covenant.action === 'REGISTER') {
      covValue += !output.path
        ? output.value
        : tx.inputs[i].value - output.value;
    } else {
      covValue += output.value;
    }

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'RENEW' ||
      covenant.action === 'UPDATE' ||
      covenant.action === 'TRANSFER' ||
      covenant.action === 'FINALIZE') {
      covValue = 0;
    }
  }

  // This TX was a covenant, return.
  if (covAction) {
    return '';
  }

  // If there were outputs to the wallet's receive branch
  // but no covenants, this was just a plain receive.
  // Note: assuming input[0] is the "from" is not really helpful data.
  if (totalValue > 0) {
    return '';
  }

  // This TX must have been a plain send from the wallet.
  // Assume that the first non-wallet output of the TX is the "to".
  const output = tx.outputs.filter(({path}) => !path)[0];

  if (!output) {
    return '';
  }

  return output.address;
}

export function getTXNameHash(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      continue;
    }

    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    return covenant.items[0]
  }

  return '';
}

export function getTXRecords(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'REGISTER' ||
      covenant.action === 'UPDATE') {
      return covenant.items[2];
    }
  }

  return '';
}
