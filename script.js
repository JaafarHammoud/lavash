// Global state management
class AppState {
    constructor() {
        this.currentBranch = null;
        this.currentCategory = null;
        this.cart = this.loadCartFromStorage();
        this.products = null;
        this.theme = localStorage.getItem('theme') || 'light';
    }

    // Cart persistence
    saveCartToStorage() {
        localStorage.setItem('lavash_cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('lavash_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
    }

    // Navigation persistence
    saveNavigationState() {
        const state = {
            currentBranch: this.currentBranch,
            currentCategory: this.currentCategory
        };
        localStorage.setItem('lavash_navigation', JSON.stringify(state));
    }

    loadNavigationState() {
        try {
            const savedState = localStorage.getItem('lavash_navigation');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentBranch = state.currentBranch;
                this.currentCategory = state.currentCategory;
                return state;
            }
        } catch (error) {
            console.error('Error loading navigation state:', error);
        }
        return null;
    }

    clearNavigationState() {
        localStorage.removeItem('lavash_navigation');
    }

    // Theme management
    initTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (this.theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (this.theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Cart management
    addToCart(product, option = null, buttonElement = null) {
        const cartItem = {
            id: `${product.name}-${option ? option.name : 'default'}`,
            name: product.name,
            description: option ? option.name : product.description,
            price: option ? option.price : product.price,
            image: product.image,
            quantity: 1
        };

        const isFirstItem = this.cart.length === 0;
        const existingItem = this.cart.find(item => item.id === cartItem.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push(cartItem);
        }

        this.saveCartToStorage();
        this.updateCartUI();
        
        // Show animation for first item only
        if (isFirstItem && buttonElement) {
            this.showAddToCartAnimation(buttonElement);
        } else {
            this.showCartNotification();
        }
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCartToStorage();
        this.updateCartUI();
    }

    updateCartQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                item.quantity = quantity;
                this.saveCartToStorage();
                this.updateCartUI();
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => {
            const price = parseFloat(item.price.replace(/[^\d]/g, ''));
            return total + (price * item.quantity);
        }, 0);
    }

    clearCart() {
        this.cart = [];
        localStorage.removeItem('lavash_cart');
        // Force immediate UI update
        this.updateCartUI();
    }

    clearCartAndGoHome() {
        // Clear cart and navigation
        this.clearCart();
        this.clearNavigationState();
        
        // Close any open modals/sidebars
        const cartSidebar = document.getElementById('cartSidebar');
        const checkoutModal = document.getElementById('checkoutModal');
        const successModal = document.getElementById('successModal');
        
        if (cartSidebar.classList.contains('open')) {
            closeCart();
        }
        if (checkoutModal.classList.contains('open')) {
            closeCheckout();
        }
        if (successModal.classList.contains('open')) {
            closeSuccessModal();
        }
        
        // Go to home page (branch selection)
        this.showBranchSelection(true);
        
        // Show notification
        this.showCartClearedNotification();
    }

    // UI Updates
    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const oldCount = parseInt(cartCount.textContent) || 0;
        const newCount = this.cart.length;
        
        // Add animation class for visual feedback
        if (newCount === 0 && oldCount > 0) {
            cartCount.classList.add('cart-cleared-animation');
            setTimeout(() => {
                cartCount.classList.remove('cart-cleared-animation');
            }, 500);
        }
        
        cartCount.textContent = newCount;

        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Корзина пуста</p>
                </div>
            `;
            cartTotal.textContent = '0 ₽';
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <img src="assets/${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-description">${item.description}</div>
                        <div class="cart-item-price">${item.price}</div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="appState.updateCartQuantity('${item.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="appState.updateCartQuantity('${item.id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-item-btn" onclick="appState.removeFromCart('${item.id}')">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            cartTotal.textContent = `${this.getCartTotal()} ₽`;
        }
    }

    showAddToCartAnimation(buttonElement) {
        // Create animated element
        const animatedElement = document.createElement('div');
        animatedElement.className = 'add-to-cart-animation';
        animatedElement.innerHTML = '<i class="fas fa-shopping-cart"></i>';
        
        // Get button position
        const buttonRect = buttonElement.getBoundingClientRect();
        const cartIcon = document.getElementById('cartIcon');
        const cartRect = cartIcon.getBoundingClientRect();
        
        // Set initial position
        animatedElement.style.cssText = `
            position: fixed;
            left: ${buttonRect.left + buttonRect.width / 2}px;
            top: ${buttonRect.top + buttonRect.height / 2}px;
            width: 40px;
            height: 40px;
            background: var(--primary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            z-index: 5000;
            pointer-events: none;
            transform: scale(0);
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;
        
        document.body.appendChild(animatedElement);
        
        // Animate to cart
        setTimeout(() => {
            animatedElement.style.transform = `scale(1) translate(${cartRect.left - buttonRect.left - buttonRect.width / 2}px, ${cartRect.top - buttonRect.top - buttonRect.height / 2}px)`;
        }, 50);
        
        // Remove element and show notification
        setTimeout(() => {
            animatedElement.style.transform += ' scale(0)';
            setTimeout(() => {
                document.body.removeChild(animatedElement);
                this.showCartNotification();
            }, 300);
        }, 600);
    }

    showCartNotification() {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = '<i class="fas fa-check"></i> Товар добавлен в корзину';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 30px var(--shadow-color);
            z-index: 5000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    showCartClearedNotification() {
        // Create a temporary notification for cart cleared
        const notification = document.createElement('div');
        notification.className = 'cart-cleared-notification';
        notification.innerHTML = '<i class="fas fa-trash"></i> Корзина очищена';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 30px var(--shadow-color);
            z-index: 5000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // Navigation
    showBranchSelection(forceShow = false) {
        // Check if cart has items and show confirmation (unless forced)
        if (this.cart.length > 0 && !forceShow) {
            this.showBranchSwitchConfirmation();
            return;
        }
        
        this.currentBranch = null;
        this.currentCategory = null;
        this.saveNavigationState();
        
        // Update browser history
        if (window.history.state !== 'branch-selection') {
            window.history.pushState('branch-selection', '', window.location.pathname);
        }
        
        document.getElementById('branchSelection').style.display = 'block';
        document.getElementById('categoriesSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'none';
    }

    showBranchSwitchConfirmation() {
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'branch-confirmation-modal';
        confirmationModal.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>Очистить корзину?</h3>
                <p>В вашей корзине есть товары из текущего филиала. При переключении на другой филиал корзина будет очищена.</p>
                <div class="confirmation-buttons">
                    <button class="confirm-btn cancel" onclick="this.closest('.branch-confirmation-modal').remove()">
                        <i class="fas fa-times"></i>
                        Отмена
                    </button>
                    <button class="confirm-btn confirm" onclick="appState.confirmBranchSwitch()">
                        <i class="fas fa-trash"></i>
                        Очистить и продолжить
                    </button>
                </div>
            </div>
        `;
        
        confirmationModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--overlay-color);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 4000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        document.body.appendChild(confirmationModal);
    }

    confirmBranchSwitch() {
        // Remove confirmation modal first
        const modal = document.querySelector('.branch-confirmation-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clear cart and navigation
        this.clearCart();
        this.clearNavigationState();
        
        // Immediately update cart UI to show empty state
        this.updateCartUI();
        
        // Show branch selection
        this.currentBranch = null;
        this.currentCategory = null;
        document.getElementById('branchSelection').style.display = 'block';
        document.getElementById('categoriesSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'none';
        
        // Show success notification after a small delay to ensure UI is updated
        setTimeout(() => {
            this.showCartClearedNotification();
        }, 100);
    }

    showCategories(branch) {
        this.currentBranch = branch;
        this.currentCategory = null;
        this.saveNavigationState();
        
        // Update browser history
        window.history.pushState('categories', '', `#categories-${branch.name.replace(/\s+/g, '-')}`);
        
        document.getElementById('branchSelection').style.display = 'none';
        document.getElementById('categoriesSection').style.display = 'block';
        document.getElementById('productsSection').style.display = 'none';
        
        document.getElementById('branchTitle').textContent = `Меню - ${branch.name}`;
        this.loadCategories(branch);
    }

    showProducts(category) {
        this.currentCategory = category;
        this.saveNavigationState();
        
        // Update browser history
        window.history.pushState('products', '', `#products-${category.name.replace(/\s+/g, '-')}`);
        
        document.getElementById('categoriesSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'block';
        
        document.getElementById('categoryTitle').textContent = category.name;
        this.loadProducts(category);
    }

    // Data loading
    async loadData() {
        try {
            const response = await fetch('products.json');
            this.products = await response.json();
            this.loadBranches();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    loadBranches() {
        const branchesGrid = document.getElementById('branchesGrid');
        
        if (!this.products || !this.products.branches) {
            branchesGrid.innerHTML = '<div class="empty-cart"><i class="fas fa-exclamation-triangle"></i><p>Нет доступных филиалов</p></div>';
            return;
        }
        
        branchesGrid.innerHTML = this.products.branches.map(branch => `
            <div class="branch-card fade-in" onclick="appState.showCategories(${JSON.stringify(branch).replace(/"/g, '&quot;')})">
                <div class="branch-name">${branch.name}</div>
                <div class="branch-address">${branch.address}</div>
                <div class="branch-phone">${branch.phone}</div>
            </div>
        `).join('');
    }

    loadCategories(branch) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        
        if (!branch.categories) {
            categoriesGrid.innerHTML = '<div class="empty-cart"><i class="fas fa-exclamation-triangle"></i><p>Нет доступных категорий</p></div>';
            return;
        }
        
        categoriesGrid.innerHTML = branch.categories.map(category => `
            <div class="category-card fade-in" onclick="appState.showProducts(${JSON.stringify(category).replace(/"/g, '&quot;')})">
                <img src="${category.logo}" alt="${category.name}" class="category-logo">
                <div class="category-name">${category.name}</div>
            </div>
        `).join('');
    }

    loadProducts(category) {
        const productsGrid = document.getElementById('productsGrid');
        
        if (!category.products) {
            productsGrid.innerHTML = '<div class="empty-cart"><i class="fas fa-exclamation-triangle"></i><p>Нет доступных продуктов</p></div>';
            return;
        }
        
        productsGrid.innerHTML = category.products.map(product => {
            if (product.options && product.options.length > 1) {
                // Product with multiple options - use checkboxes
                return `
                    <div class="product-card fade-in">
                        <img src="assets/${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description" id="desc-${product.name.replace(/\s+/g, '-')}">${product.description}</div>
                            <div class="product-options">
                                ${product.options.map((option, index) => `
                                    <button class="option-button ${index === 0 ? 'selected' : ''}" 
                                            data-index="${index}" 
                                            data-product-id="${product.name.replace(/\s+/g, '-')}"
                                            onclick="appState.selectProductOption('${product.name.replace(/\s+/g, '-')}', ${index}, ${JSON.stringify(product).replace(/"/g, '&quot;')})">
                                        <span class="option-name">${option.name}</span>
                                        <span class="option-price">${option.price}</span>
                                    </button>
                                `).join('')}
                            </div>
                            <button class="add-to-cart-btn" onclick="appState.addToCartWithSelectedOption('${product.name.replace(/\s+/g, '-')}', ${JSON.stringify(product).replace(/"/g, '&quot;')}, this)">
                                Добавить в корзину
                            </button>
                        </div>
                    </div>
                `;
            } else if (product.options && product.options.length === 1) {
                // Product with single option
                return `
                    <div class="product-card fade-in">
                        <img src="assets/${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description">${product.description}</div>
                            <div class="product-price">${product.price}</div>
                            <button class="add-to-cart-btn" onclick="appState.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}, null, this)">
                                Добавить в корзину
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Product without options
                return `
                    <div class="product-card fade-in">
                        <img src="assets/${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description">${product.description}</div>
                            <div class="product-price">${product.price}</div>
                            <button class="add-to-cart-btn" onclick="appState.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}, null, this)">
                                Добавить в корзину
                            </button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    // Product option handling
    selectProductOption(productId, optionIndex, product) {
        // Remove selected class from all buttons for this product
        const allButtons = document.querySelectorAll(`[data-product-id="${productId}"]`);
        allButtons.forEach(button => button.classList.remove('selected'));
        
        // Add selected class to clicked button
        const selectedButton = document.querySelector(`[data-product-id="${productId}"][data-index="${optionIndex}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
        
        // Update description
        const selectedOption = product.options[optionIndex];
        const descriptionElement = document.getElementById(`desc-${productId}`);
        
        if (descriptionElement) {
            descriptionElement.textContent = selectedOption.name;
        }
    }

    updateProductDescription(productId, product) {
        const selectedButton = document.querySelector(`[data-product-id="${productId}"].selected`);
        if (selectedButton) {
            const selectedOptionIndex = parseInt(selectedButton.getAttribute('data-index'));
            const selectedOption = product.options[selectedOptionIndex];
            const descriptionElement = document.getElementById(`desc-${productId}`);
            
            if (descriptionElement) {
                descriptionElement.textContent = selectedOption.name;
            }
        }
    }

    addToCartWithSelectedOption(productId, product, buttonElement) {
        const selectedButton = document.querySelector(`[data-product-id="${productId}"].selected`);
        if (selectedButton) {
            const selectedOptionIndex = parseInt(selectedButton.getAttribute('data-index'));
            const selectedOption = product.options[selectedOptionIndex];
            this.addToCart(product, selectedOption, buttonElement);
        } else {
            // Fallback to first option if none selected
            const selectedOption = product.options[0];
            this.addToCart(product, selectedOption, buttonElement);
        }
    }

    // Error handling
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--accent-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 30px var(--shadow-color);
            z-index: 5000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 3000);
    }
}

// Initialize app
const appState = new AppState();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    appState.initTheme();
    
    // Load products data
    appState.loadData();
    
    // Initialize cart UI
    appState.updateCartUI();
    
    // Initialize browser history state
    if (!window.history.state) {
        window.history.replaceState('branch-selection', '', window.location.pathname);
    }
    
    // Restore navigation state after data is loaded
    setTimeout(() => {
        const savedState = appState.loadNavigationState();
        if (savedState && savedState.currentBranch) {
            if (savedState.currentCategory) {
                // Restore to products view
                appState.showProducts(savedState.currentCategory);
            } else {
                // Restore to categories view
                appState.showCategories(savedState.currentBranch);
            }
        }
    }, 100);
    
    // Event listeners
    document.getElementById('themeToggle').addEventListener('click', () => {
        appState.toggleTheme();
    });
    
    document.getElementById('cartIcon').addEventListener('click', () => {
        openCart();
    });
    
    document.getElementById('closeCart').addEventListener('click', () => {
        closeCart();
    });
    
    document.getElementById('cartOverlay').addEventListener('click', () => {
        closeCart();
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        appState.showBranchSelection();
    });
    
    document.getElementById('backToCategoriesBtn').addEventListener('click', () => {
        appState.showCategories(appState.currentBranch);
    });
    
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (appState.cart.length === 0) {
            appState.showError('Корзина пуста');
            return;
        }
        openCheckout();
    });
    
    document.getElementById('closeCheckout').addEventListener('click', () => {
        closeCheckout();
    });
    
    document.getElementById('checkoutOverlay').addEventListener('click', () => {
        closeCheckout();
    });
    
    document.getElementById('checkoutForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
    });
    
    document.getElementById('successBtn').addEventListener('click', () => {
        closeSuccessModal();
    });
    
    document.getElementById('successOverlay').addEventListener('click', () => {
        closeSuccessModal();
    });
    
    // Handle browser back button
    window.addEventListener('popstate', (event) => {
        const state = event.state;
        
        // Prevent infinite loops by checking if we're already in the correct state
        const currentSection = document.querySelector('section[style*="block"]');
        
        if (state === 'branch-selection' || state === null) {
            if (currentSection && currentSection.id !== 'branchSelection') {
                appState.showBranchSelection(true);
            }
        } else if (state === 'categories' && appState.currentBranch) {
            if (currentSection && currentSection.id !== 'categoriesSection') {
                appState.showCategories(appState.currentBranch);
            }
        } else if (state === 'products' && appState.currentCategory) {
            if (currentSection && currentSection.id !== 'productsSection') {
                appState.showProducts(appState.currentCategory);
            }
        } else {
            // Fallback to branch selection
            appState.showBranchSelection(true);
        }
    });
});

// Cart functions
function openCart() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Checkout functions
function openCheckout() {
    updateOrderSummary();
    document.getElementById('checkoutModal').classList.add('open');
    document.getElementById('checkoutOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('open');
    document.getElementById('checkoutOverlay').classList.remove('open');
    document.body.style.overflow = 'auto';
}

function updateOrderSummary() {
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    
    orderItems.innerHTML = appState.cart.map(item => `
        <div class="order-item">
            <span>${item.name} (${item.description}) x${item.quantity}</span>
            <span>${item.price}</span>
        </div>
    `).join('');
    
    orderTotal.textContent = `${appState.getCartTotal()} ₽`;
}

function submitOrder() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    
    const orderData = {
        customer: {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value
        },
        notes: document.getElementById('orderNotes').value,
        items: appState.cart,
        total: appState.getCartTotal(),
        branch: appState.currentBranch,
        timestamp: new Date().toISOString()
    };
    
    // Simulate order submission
    console.log('Order submitted:', orderData);
    
    // Show success modal
    closeCheckout();
    closeCart();
    showSuccessModal();
    
    // Clear cart and form
    appState.clearCart();
    appState.clearNavigationState();
    form.reset();
}

function showSuccessModal() {
    document.getElementById('successModal').classList.add('open');
    document.getElementById('successOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('open');
    document.getElementById('successOverlay').classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Utility functions
function formatPrice(price) {
    return price.replace(/(\d+)/, '$1 ₽');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Add loading states
function showLoading(element) {
    element.innerHTML = '<div class="loading"></div>';
}

function hideLoading(element) {
    // Loading will be replaced by content
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('cartSidebar').classList.contains('open')) {
            closeCart();
        } else if (document.getElementById('checkoutModal').classList.contains('open')) {
            closeCheckout();
        } else if (document.getElementById('successModal').classList.contains('open')) {
            closeSuccessModal();
        }
    } else if (e.key === 'Delete') {
        // Clear cart and go to home page
        appState.clearCartAndGoHome();
    }
});

// Add touch support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0 && document.getElementById('cartSidebar').classList.contains('open')) {
            // Swipe right to close cart
            closeCart();
        }
    }
}

// Performance optimization: Lazy loading for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', lazyLoadImages);
