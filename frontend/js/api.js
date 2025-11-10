// API配置
const API_BASE_URL = 'http://localhost:8091/api';

// 工具函数：获取Token
function getToken() {
    return localStorage.getItem('token');
}

// 工具函数：设置Token
function setToken(token) {
    localStorage.setItem('token', token);
}

// 工具函数：移除Token
function removeToken() {
    localStorage.removeItem('token');
}

// 工具函数：获取用户信息
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// 工具函数：设置用户信息
function setUserInfo(userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

// 工具函数：清除用户信息
function clearUserInfo() {
    localStorage.removeItem('userInfo');
}

// API请求封装
async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (data.code === 1001) {
            // Token过期或无效，跳转到登录页
            removeToken();
            clearUserInfo();
            window.location.href = '/pages/login.html';
            return null;
        }

        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 用户认证API
const authAPI = {
    // 注册
    register: (username, password, email, phone) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email, phone })
        });
    },

    // 登录
    login: (username, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    // 获取用户信息
    getProfile: () => {
        return apiRequest('/users/profile');
    }
};

// 商品API
const productAPI = {
    // 搜索商品
    search: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/products/search?${queryString}`);
    },

    // 获取商品详情
    getDetail: (productId) => {
        return apiRequest(`/products/${productId}`);
    },

    // 创建商品（管理员功能）
    create: (productData) => {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }
};

// 购物车API
const cartAPI = {
    // 获取购物车
    get: () => {
        return apiRequest('/cart');
    },

    // 添加商品到购物车
    addItem: (productId, quantity) => {
        return apiRequest('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    },

    // 更新购物车项
    updateItem: (productId, quantity, selected) => {
        const body = { quantity };
        if (selected !== undefined) {
            body.selected = selected;
        }
        return apiRequest(`/cart/items/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    // 删除购物车项
    deleteItem: (productId) => {
        return apiRequest(`/cart/items/${productId}`, {
            method: 'DELETE'
        });
    }
};

// 地址API
const addressAPI = {
    // 获取地址列表
    getList: () => {
        return apiRequest('/addresses');
    },

    // 添加地址
    add: (addressData) => {
        return apiRequest('/addresses', {
            method: 'POST',
            body: JSON.stringify(addressData)
        });
    },

    // 更新地址
    update: (addressId, addressData) => {
        return apiRequest(`/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(addressData)
        });
    },

    // 删除地址
    delete: (addressId) => {
        return apiRequest(`/addresses/${addressId}`, {
            method: 'DELETE'
        });
    }
};

// 订单API
const orderAPI = {
    // 创建订单
    create: (orderData) => {
        return apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    // 获取订单列表
    getList: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/orders?${queryString}`);
    },

    // 获取订单详情
    getDetail: (orderId) => {
        return apiRequest(`/orders/${orderId}`);
    }
};

// 支付API
const paymentAPI = {
    // 发起支付
    pay: (orderId, paymentMethod) => {
        return apiRequest('/payments/pay', {
            method: 'POST',
            body: JSON.stringify({ orderId, paymentMethod })
        });
    },

    // 支付回调
    callback: (paymentId, status) => {
        return apiRequest('/payments/callback', {
            method: 'POST',
            body: JSON.stringify({ paymentId, status })
        });
    }
};

// 评论API
const commentAPI = {
    // 获取商品评论
    getList: (productId, params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/products/${productId}/comments?${queryString}`);
    },

    // 发表评论
    create: (commentData) => {
        return apiRequest('/comments', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }
};
