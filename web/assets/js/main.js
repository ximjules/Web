// Sample Products
const products = [
    {name: 'Cyberpunk 2077', img: 'pictures/cyberpunk.jpg', price: 39.99},
    {name: 'Elden Ring', img: 'pictures/eldenring.jpg', price: 49.99},
    {name: 'Spider-Man 2', img: 'pictures/spiderman2.jpg', price: 59.99}
    ];
    
    
    const cart = [];
    
    
    function loadProducts(){
    const container = document.getElementById('productGrid');
    products.forEach((p,i)=>{
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<img src='${p.img}' alt='${p.name}' /><h3>${p.name}</h3><p>${p.price}€</p><button onclick='addToCart(${i})'>Add to Cart</button>`;
    container.appendChild(card);
    });
    }
    
    
    function addToCart(index){
    cart.push(products[index]);
    updateCart();
    }
    
    
    function updateCart(){
    const cartDiv = document.getElementById('cartItems');
    cartDiv.innerHTML = '';
    let total = 0;
    cart.forEach(item=>{
    cartDiv.innerHTML += `<p>${item.name} - ${item.price}€</p>`;
    total += item.price;
    });
    document.getElementById('cartTotal').innerText = `Total: ${total.toFixed(2)}€`;
    }
    
    
    window.onload = loadProducts;