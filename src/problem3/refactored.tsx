import React, { useMemo } from 'react';

// Define blockchain type for type safety
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain; // Added missing property
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface BoxProps {
  // Define BoxProps interface (assuming it exists in your codebase)
  className?: string;
  children?: React.ReactNode;
}

interface Props extends BoxProps {}

// Move getPriority outside component - pure function doesn't need to be inside
const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100;
    case 'Ethereum':
      return 50;
    case 'Arbitrum':
      return 30;
    case 'Zilliqa':
      return 20;
    case 'Neo':
      return 20;
    default:
      return -99;
  }
};

// Assuming these hooks are defined elsewhere
declare function useWalletBalances(): WalletBalance[];
declare function usePrices(): Record<string, number>;

// Assuming WalletRow component exists
declare const WalletRow: React.FC<{
  className?: string;
  key?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}>;

// Assuming classes object exists
declare const classes: {
  row: string;
};

const WalletPage: React.FC<Props> = (props: Props) => {
  const { ...rest } = props; // Removed unused 'children'
  const balances = useWalletBalances();
  const prices = usePrices();

  // Memoize sorted and filtered balances
  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain); // Fixed: was 'lhsPriority'
        // Fixed logic: keep balances with positive amounts and valid priority
        return balancePriority > -99 && balance.amount > 0;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);

        // Sort in descending order by priority
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        }
        return 0; // Added missing return for equal priorities
      });
  }, [balances]); // Removed 'prices' - not used in this computation

  // Memoize formatted balances to avoid recalculation
  const formattedBalances = useMemo(() => {
    return sortedBalances.map((balance: WalletBalance): FormattedWalletBalance => {
      return {
        ...balance,
        formatted: balance.amount.toFixed(2), // Specify 2 decimal places for currency
      };
    });
  }, [sortedBalances]);

  // Memoize rows to prevent unnecessary re-renders
  const rows = useMemo(() => {
    return formattedBalances.map((balance: FormattedWalletBalance) => {
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          className={classes.row}
          key={balance.currency} // Use unique identifier instead of index
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [formattedBalances, prices]); // Added proper dependencies

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
