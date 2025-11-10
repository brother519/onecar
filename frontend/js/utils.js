// 格式化价格
function formatPrice(price) {
    return '¥' + price.toFixed(2);
}

// 格式化时间
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 显示提示消息
function showMessage(message, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.className = `message-box message-${type}`;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.add('show');
    }, 10);

    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageBox);
        }, 300);
    }, 3000);
}

// 显示加载状态
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'loading-overlay';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
}

// 隐藏加载状态
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        document.body.removeChild(loading);
    }
}

// 确认对话框
function confirm(message) {
    return window.confirm(message);
}

// 检查登录状态
function checkLogin() {
    const token = getToken();
    if (!token) {
        window.location.href = '/pages/login.html';
        return false;
    }
    return true;
}

// 退出登录
function logout() {
    removeToken();
    clearUserInfo();
    window.location.href = '/pages/login.html';
}

// 防抖函数
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

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 渲染星级评分
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
        html += '<span class="star star-full">★</span>';
    }
    if (hasHalfStar) {
        html += '<span class="star star-half">★</span>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        html += '<span class="star star-empty">☆</span>';
    }

    return html;
}

// 计算购物车总数量
function getCartCount() {
    // 从localStorage获取购物车数量（简化实现）
    const cartCount = localStorage.getItem('cartCount') || 0;
    return parseInt(cartCount);
}

// 更新购物车数量显示
function updateCartCount(count) {
    localStorage.setItem('cartCount', count);
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'block' : 'none';
    }
}
