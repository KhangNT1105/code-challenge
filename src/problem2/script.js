// Currency Swap Application
// Main application state
const state = {
  tokens: [],
  prices: {},
  fromToken: null,
  toToken: null,
  fromAmount: '',
  toAmount: '',
  currentSelector: null, // 'from' or 'to'
  isLoading: false,
};

// DOM Elements
const elements = {
  // Inputs
  fromAmountInput: document.getElementById('from-amount'),
  toAmountInput: document.getElementById('to-amount'),

  // Token selectors
  fromTokenSelector: document.getElementById('from-token-selector'),
  toTokenSelector: document.getElementById('to-token-selector'),

  // Token display
  fromTokenIcon: document.getElementById('from-token-icon'),
  fromTokenSymbol: document.getElementById('from-token-symbol'),
  toTokenIcon: document.getElementById('to-token-icon'),
  toTokenSymbol: document.getElementById('to-token-symbol'),

  // USD values
  fromUsdValue: document.getElementById('from-usd-value'),
  toUsdValue: document.getElementById('to-usd-value'),

  // Error messages
  fromError: document.getElementById('from-error'),
  toError: document.getElementById('to-error'),

  // Rate info
  rateInfo: document.getElementById('rate-info'),
  rateValue: document.getElementById('rate-value'),
  priceImpact: document.getElementById('price-impact'),
  networkFee: document.getElementById('network-fee'),

  // Buttons
  swapDirectionBtn: document.getElementById('swap-direction-btn'),
  submitButton: document.getElementById('submit-button'),

  // Modal
  modal: document.getElementById('token-modal'),
  modalOverlay: document.getElementById('modal-overlay'),
  closeModal: document.getElementById('close-modal'),
  tokenSearch: document.getElementById('token-search'),
  tokenList: document.getElementById('token-list'),

  // Success message
  successMessage: document.getElementById('success-message'),

  // Form
  form: document.getElementById('swap-form'),
};

// Constants
const TOKEN_ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/';
const PRICES_URL = 'https://interview.switcheo.com/prices.json';

// Utility Functions
const formatNumber = (num, decimals = 2) => {
  if (!num || isNaN(num)) return '0.00';
  return parseFloat(num).toFixed(decimals);
};

const formatUSD = (amount) => {
  if (!amount || isNaN(amount)) return '$0.00';
  const num = parseFloat(amount);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const isValidNumber = (value) => {
  if (!value) return true;
  return /^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value));
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// API Functions
const fetchPrices = async () => {
  try {
    const response = await fetch(PRICES_URL);
    if (!response.ok) throw new Error('Failed to fetch prices');
    const data = await response.json();

    // Process prices - group by currency and get latest price
    const priceMap = {};
    data.forEach(item => {
      if (item.price && parseFloat(item.price) > 0) {
        const key = item.currency.toUpperCase();
        // If we already have this currency, keep the higher priority one
        if (!priceMap[key] || parseFloat(item.price) > 0) {
          priceMap[key] = {
            price: parseFloat(item.price),
            currency: item.currency
          };
        }
      }
    });

    return priceMap;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return {};
  }
};

const loadTokensAndPrices = async () => {
  try {
    // Fetch prices
    state.prices = await fetchPrices();

    // Create token list from prices
    state.tokens = Object.entries(state.prices).map(([symbol, data]) => ({
      symbol: symbol,
      name: data.currency,
      price: data.price,
      iconUrl: `${TOKEN_ICON_BASE_URL}${symbol}.svg`,
    })).sort((a, b) => b.price - a.price); // Sort by price descending

    renderTokenList(state.tokens);
  } catch (error) {
    console.error('Error loading tokens:', error);
    elements.tokenList.innerHTML = '<div class="loading-tokens">Failed to load tokens. Please refresh.</div>';
  }
};

// Token Selection Functions
const openTokenModal = (selector) => {
  state.currentSelector = selector;
  elements.modal.style.display = 'flex';
  elements.tokenSearch.value = '';
  elements.tokenSearch.focus();
  renderTokenList(state.tokens);
};

const closeTokenModal = () => {
  elements.modal.style.display = 'none';
  state.currentSelector = null;
  elements.tokenSearch.value = '';
};

const selectToken = (token) => {
  if (state.currentSelector === 'from') {
    // Prevent selecting same token for both
    if (state.toToken && state.toToken.symbol === token.symbol) {
      // Swap the tokens
      state.fromToken = token;
      state.toToken = state.toToken; // Keep the old fromToken
    } else {
      state.fromToken = token;
    }
    updateTokenDisplay('from', token);
  } else if (state.currentSelector === 'to') {
    // Prevent selecting same token for both
    if (state.fromToken && state.fromToken.symbol === token.symbol) {
      // Swap the tokens
      state.toToken = token;
      state.fromToken = state.fromToken;
    } else {
      state.toToken = token;
    }
    updateTokenDisplay('to', token);
  }

  closeTokenModal();
  calculateSwap();
  updateSubmitButton();
};

const updateTokenDisplay = (type, token) => {
  if (type === 'from') {
    elements.fromTokenSymbol.textContent = token.symbol;
    elements.fromTokenIcon.innerHTML = `<img src="${token.iconUrl}" alt="${token.symbol}" onerror="this.style.display='none'">`;
  } else {
    elements.toTokenSymbol.textContent = token.symbol;
    elements.toTokenIcon.innerHTML = `<img src="${token.iconUrl}" alt="${token.symbol}" onerror="this.style.display='none'">`;
  }
};

const renderTokenList = (tokens) => {
  if (!tokens || tokens.length === 0) {
    elements.tokenList.innerHTML = '<div class="loading-tokens">No tokens available</div>';
    return;
  }

  const searchTerm = elements.tokenSearch.value.toLowerCase();
  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm) ||
    token.name.toLowerCase().includes(searchTerm)
  );

  if (filteredTokens.length === 0) {
    elements.tokenList.innerHTML = '<div class="loading-tokens">No tokens found</div>';
    return;
  }

  elements.tokenList.innerHTML = filteredTokens.map(token => {
    const isSelected = (state.currentSelector === 'from' && state.toToken?.symbol === token.symbol) ||
                      (state.currentSelector === 'to' && state.fromToken?.symbol === token.symbol);

    return `
      <div class="token-item ${isSelected ? 'disabled' : ''}" data-symbol="${token.symbol}">
        <div class="token-item-icon">
          <img src="${token.iconUrl}" alt="${token.symbol}" onerror="this.style.display='none'">
        </div>
        <div class="token-item-info">
          <span class="token-item-symbol">${token.symbol}</span>
          <span class="token-item-name">${token.name}</span>
        </div>
        <div class="token-item-price">$${formatNumber(token.price, 4)}</div>
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.token-item:not(.disabled)').forEach(item => {
    item.addEventListener('click', () => {
      const symbol = item.dataset.symbol;
      const token = tokens.find(t => t.symbol === symbol);
      if (token) selectToken(token);
    });
  });
};

// Swap Calculation Functions
const calculateSwap = () => {
  if (!state.fromToken || !state.toToken) {
    elements.rateInfo.style.display = 'none';
    return;
  }

  const fromAmount = parseFloat(state.fromAmount) || 0;

  if (fromAmount > 0) {
    // Calculate exchange rate
    const fromValueUSD = fromAmount * state.fromToken.price;
    const toAmount = fromValueUSD / state.toToken.price;

    state.toAmount = formatNumber(toAmount, 6);
    elements.toAmountInput.value = state.toAmount;

    // Update USD values
    elements.fromUsdValue.textContent = formatUSD(fromValueUSD);
    elements.toUsdValue.textContent = formatUSD(fromValueUSD);

    // Update rate info
    const rate = state.toToken.price / state.fromToken.price;
    elements.rateValue.textContent = `1 ${state.fromToken.symbol} = ${formatNumber(rate, 6)} ${state.toToken.symbol}`;
    elements.rateInfo.style.display = 'block';
  } else {
    state.toAmount = '';
    elements.toAmountInput.value = '';
    elements.fromUsdValue.textContent = '$0.00';
    elements.toUsdValue.textContent = '$0.00';
    elements.rateInfo.style.display = 'none';
  }
};

// Input Validation
const validateAmount = (value) => {
  elements.fromError.textContent = '';

  if (!value) {
    elements.fromAmountInput.classList.remove('invalid', 'valid');
    return true;
  }

  if (!isValidNumber(value)) {
    elements.fromError.textContent = 'Please enter a valid number';
    elements.fromAmountInput.classList.add('invalid');
    elements.fromAmountInput.classList.remove('valid');
    return false;
  }

  const numValue = parseFloat(value);
  if (numValue <= 0) {
    elements.fromError.textContent = 'Amount must be greater than 0';
    elements.fromAmountInput.classList.add('invalid');
    elements.fromAmountInput.classList.remove('valid');
    return false;
  }

  if (numValue > 1000000000) {
    elements.fromError.textContent = 'Amount is too large';
    elements.fromAmountInput.classList.add('invalid');
    elements.fromAmountInput.classList.remove('valid');
    return false;
  }

  elements.fromAmountInput.classList.remove('invalid');
  elements.fromAmountInput.classList.add('valid');
  return true;
};

// Submit Button State
const updateSubmitButton = () => {
  const hasTokens = state.fromToken && state.toToken;
  const hasValidAmount = state.fromAmount && parseFloat(state.fromAmount) > 0;
  const isValid = validateAmount(state.fromAmount);

  if (!hasTokens) {
    elements.submitButton.disabled = true;
    elements.submitButton.querySelector('.button-text').textContent = 'Select tokens';
  } else if (!hasValidAmount) {
    elements.submitButton.disabled = true;
    elements.submitButton.querySelector('.button-text').textContent = 'Enter an amount';
  } else if (!isValid) {
    elements.submitButton.disabled = true;
    elements.submitButton.querySelector('.button-text').textContent = 'Invalid amount';
  } else {
    elements.submitButton.disabled = false;
    elements.submitButton.querySelector('.button-text').textContent = 'Confirm Swap';
  }
};

// Swap Direction
const swapTokens = () => {
  if (!state.fromToken || !state.toToken) return;

  // Swap tokens
  const temp = state.fromToken;
  state.fromToken = state.toToken;
  state.toToken = temp;

  // Update display
  updateTokenDisplay('from', state.fromToken);
  updateTokenDisplay('to', state.toToken);

  // Recalculate
  calculateSwap();
};

// Form Submission
const handleSubmit = async (e) => {
  e.preventDefault();

  if (state.isLoading) return;

  // Final validation
  if (!state.fromToken || !state.toToken || !validateAmount(state.fromAmount)) {
    return;
  }

  // Show loading state
  state.isLoading = true;
  elements.submitButton.classList.add('loading');
  elements.submitButton.disabled = true;
  elements.submitButton.querySelector('.button-text').textContent = 'Processing...';
  elements.submitButton.querySelector('.spinner').style.display = 'block';

  // Simulate API call with timeout (as per requirement)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Hide loading state
  state.isLoading = false;
  elements.submitButton.classList.remove('loading');
  elements.submitButton.querySelector('.spinner').style.display = 'none';

  // Show success message
  elements.successMessage.style.display = 'flex';

  // Hide success message after 3 seconds
  setTimeout(() => {
    elements.successMessage.style.display = 'none';
  }, 3000);

  // Reset form
  setTimeout(() => {
    state.fromAmount = '';
    state.toAmount = '';
    elements.fromAmountInput.value = '';
    elements.toAmountInput.value = '';
    elements.fromUsdValue.textContent = '$0.00';
    elements.toUsdValue.textContent = '$0.00';
    elements.rateInfo.style.display = 'none';
    elements.fromAmountInput.classList.remove('valid');
    updateSubmitButton();
  }, 3500);
};

// Event Listeners
const initEventListeners = () => {
  // Amount input with debounced calculation
  const handleAmountChange = debounce(() => {
    state.fromAmount = elements.fromAmountInput.value;
    validateAmount(state.fromAmount);
    calculateSwap();
    updateSubmitButton();
  }, 300);

  elements.fromAmountInput.addEventListener('input', (e) => {
    // Only allow numbers and decimal point
    const value = e.target.value;
    if (value && !isValidNumber(value)) {
      e.target.value = state.fromAmount;
      return;
    }
    handleAmountChange();
  });

  // Token selectors
  elements.fromTokenSelector.addEventListener('click', () => openTokenModal('from'));
  elements.toTokenSelector.addEventListener('click', () => openTokenModal('to'));

  // Modal controls
  elements.closeModal.addEventListener('click', closeTokenModal);
  elements.modalOverlay.addEventListener('click', closeTokenModal);

  // Token search
  elements.tokenSearch.addEventListener('input', () => {
    renderTokenList(state.tokens);
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.style.display === 'flex') {
      closeTokenModal();
    }
  });

  // Swap direction
  elements.swapDirectionBtn.addEventListener('click', swapTokens);

  // Form submission
  elements.form.addEventListener('submit', handleSubmit);

  // Balance click (mock - set max)
  document.getElementById('from-balance').addEventListener('click', () => {
    if (state.fromToken) {
      // Mock balance - set a random amount
      const mockBalance = (Math.random() * 1000).toFixed(2);
      elements.fromAmountInput.value = mockBalance;
      state.fromAmount = mockBalance;
      validateAmount(state.fromAmount);
      calculateSwap();
      updateSubmitButton();
    }
  });
};

// Initialize Application
const init = async () => {
  console.log('=€ Initializing Currency Swap Application...');

  // Load tokens and prices
  await loadTokensAndPrices();

  // Initialize event listeners
  initEventListeners();

  // Update UI
  updateSubmitButton();

  console.log(' Application initialized successfully');
  console.log(`=Ê Loaded ${state.tokens.length} tokens`);
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging (optional)
window.swapApp = {
  state,
  elements,
  formatNumber,
  formatUSD,
};
