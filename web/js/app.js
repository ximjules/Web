// ============================================
// Product Functions
// ============================================

// Get all products from database
async function getProducts() {
    try {
        const response = await fetch('api/products.php?action=get_all');
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Failed to fetch products:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Get single product
async function getProduct(id) {
    try {
        const response = await fetch(`api/products.php?action=get&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Failed to fetch product:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Display products on shop or index page
// If maxCount is provided, show up to that many unique products (by name)
async function displayProducts(maxCount) {
    const ponudaGrid = document.querySelector('.ponuda-grid');
    if (!ponudaGrid) return;

    ponudaGrid.innerHTML = '<p>Loading products...</p>';

    const products = await getProducts();

    if (products.length === 0) {
        ponudaGrid.innerHTML = '<p>No products available</p>';
        return;
    }

    // Deduplicate by name (case-insensitive) to avoid showing the same game twice
    const uniqueMap = new Map();
    for (const p of products) {
        const key = (p.name || '').toString().trim().toLowerCase();
        if (!uniqueMap.has(key)) uniqueMap.set(key, p);
    }

    let uniqueProducts = Array.from(uniqueMap.values());

    // Shuffle the array so customers see different items each visit
    for (let i = uniqueProducts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueProducts[i], uniqueProducts[j]] = [uniqueProducts[j], uniqueProducts[i]];
    }

    // If maxCount provided, limit to that many products
    if (typeof maxCount === 'number' && maxCount > 0) {
        uniqueProducts = uniqueProducts.slice(0, maxCount);
    }

    ponudaGrid.innerHTML = '';

    uniqueProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'ponuda-card';

        const img = document.createElement('img');
        img.src = product.image_url || 'images/placeholder.png';
        img.alt = product.name;

        const h3 = document.createElement('h3');
        h3.textContent = product.name;

        const desc = document.createElement('p');
        desc.textContent = product.description || '';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        const priceSpan = document.createElement('span');
        priceSpan.className = 'price';
        priceSpan.textContent = `$${parseFloat(product.price).toFixed(2)}`;

        const stockSpan = document.createElement('span');
        stockSpan.className = 'stock';
        stockSpan.textContent = `Stock: ${product.stock}`;

        infoDiv.appendChild(priceSpan);
        infoDiv.appendChild(stockSpan);

        const btn = document.createElement('button');
        btn.className = 'add-to-cart-btn';
        btn.textContent = 'Add to Cart';
        btn.addEventListener('click', () => addToCart(Number(product.id), product.name, Number(product.price)));

        productCard.appendChild(img);
        productCard.appendChild(h3);
        productCard.appendChild(desc);
        productCard.appendChild(infoDiv);
        productCard.appendChild(btn);

        ponudaGrid.appendChild(productCard);
    });
}

// ============================================
// Shopping Cart Functions
// ============================================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(productId, productName, productPrice) {
    let cart = getCart();
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }
    
    saveCart(cart);
    alert(`${productName} added to cart!`);
    updateCartCount();
}

// Remove item from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    displayCart();
    updateCartCount();
}

// Update item quantity
function updateQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
            displayCart();
        }
    }
}

// Display cart items
function displayCart() {
    const cartContainer = document.querySelector('.cart-items');
    if (!cartContainer) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty</p>';
        return;
    }
    
    let html = '<table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th>Action</th></tr></thead><tbody>';
    
    cart.forEach(item => {
        const total = (item.price * item.quantity).toFixed(2);
        html += `
            <tr>
                <td>${item.name}</td>
                <td>$${parseFloat(item.price).toFixed(2)}</td>
                <td>
                    <input type="number" min="1" value="${item.quantity}" 
                           onchange="updateQuantity(${item.id}, this.value)">
                </td>
                <td>$${total}</td>
                <td>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">Remove</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    cartContainer.innerHTML = html;
    displayCartTotal();
}

// Display cart total
function displayCartTotal() {
    const totalContainer = document.querySelector('.cart-total');
    if (!totalContainer) return;
    
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    
    totalContainer.innerHTML = `<h3>Total: $${total}</h3>`;
}

// Update cart count in navbar
function updateCartCount() {
    const cart = getCart();
    const cartCount = document.querySelector('.cart-count');
    
    if (cartCount) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = count;
    }
}

// ============================================
// Checkout Functions
// ============================================

async function checkout() {
    const user = getCurrentUser();
    
    if (!isLoggedIn()) {
        alert('Please log in to checkout');
        window.location.href = 'login.html';
        return;
    }
    
    const cart = getCart();
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Here you would send the order to your server
    alert(`Order placed successfully! Total: $${total.toFixed(2)}`);
    
    // Clear cart
    localStorage.setItem('cart', JSON.stringify([]));
    window.location.href = 'shop.html';
}

// ============================================
// Initialize on page load
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Display products if on shop page
    if (document.querySelector('.ponuda-grid')) {
        // If we're on the site root or index page, show only 6 unique products
        const pathname = window.location.pathname;
        const last = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (last === '' || last === 'index.html') {
            displayProducts(6);
        } else {
            displayProducts();
        }
    }
    
    // Display cart if on cart page
    if (document.querySelector('.cart-items')) {
        displayCart();
    }
});
