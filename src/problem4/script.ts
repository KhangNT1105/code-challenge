// Implementation 1: Iterative approach (O(n) time, O(1) space)
function sum_to_n_a(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

// Implementation 2: Mathematical formula (O(1) time, O(1) space)
function sum_to_n_b(n: number): number {
    return (n * (n + 1)) / 2;
}

// Implementation 3: Dynamic Programming with Memoization (O(n) time, O(n) space)
function sum_to_n_c(n: number): number {
    const memo = new Map<number, number>();
    
    function calculateSum(num: number): number {
        if (num <= 0) return 0;
        if (num === 1) return 1;
        
        if (memo.has(num)) {
            return memo.get(num)!;
        }
        
        const result = num + calculateSum(num - 1);
        memo.set(num, result);
        
        return result;
    }
    
    return calculateSum(n);
}
