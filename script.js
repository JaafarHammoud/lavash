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
    addToCart(product, option = null) {
        const cartItem = {
            id: `${product.name}-${option ? option.name : 'default'}`,
            name: product.name,
            description: option ? option.name : product.description,
            price: option ? option.price : product.price,
            image: product.image,
            quantity: 1
        };

        const existingItem = this.cart.find(item => item.id === cartItem.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push(cartItem);
        }

        this.saveCartToStorage();
        this.updateCartUI();
        this.showCartNotification();
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
        this.clearCartStorage();
        this.updateCartUI();
    }

    // UI Updates
    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        cartCount.textContent = this.cart.length;

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

    // Navigation
    showBranchSelection() {
        this.currentBranch = null;
        this.currentCategory = null;
        this.saveNavigationState();
        document.getElementById('branchSelection').style.display = 'block';
        document.getElementById('categoriesSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'none';
    }

    showCategories(branch) {
        this.currentBranch = branch;
        this.currentCategory = null;
        this.saveNavigationState();
        document.getElementById('branchSelection').style.display = 'none';
        document.getElementById('categoriesSection').style.display = 'block';
        document.getElementById('productsSection').style.display = 'none';
        
        document.getElementById('branchTitle').textContent = `Меню - ${branch.name}`;
        this.loadCategories(branch);
    }

    showProducts(category) {
        this.currentCategory = category;
        this.saveNavigationState();
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
                // Product with multiple options
                return `
                    <div class="product-card fade-in">
                        <img src="assets/${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description">${product.description}</div>
                            <div class="product-options">
                                ${product.options.map(option => `
                                    <div class="option-item">
                                        <span class="option-name">${option.name}</span>
                                        <span class="option-price">${option.price}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="add-to-cart-btn" onclick="appState.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}, ${JSON.stringify(product.options[0]).replace(/"/g, '&quot;')})">
                                Добавить в корзину - ${product.options[0].price}
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
                            <button class="add-to-cart-btn" onclick="appState.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
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
                            <button class="add-to-cart-btn" onclick="appState.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                                Добавить в корзину
                            </button>
                        </div>
                    </div>
                `;
            }
        }).join('');
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
