const CLOUD_BASE_URL = 'https://1ls09us5f17oi-env-ucta8euk6e.service.douyincloud.run/api';
const BASE_URL = uni.getStorageSync('apiBaseUrl') || CLOUD_BASE_URL;

const request = (url, method, data = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method: method,
			data: data,
			header: {
				'content-type': 'application/json'
			},
			timeout: 120000, // 增加超时时间到 2 分钟
			success: (res) => {
				if (res.statusCode === 200 && res.data.success) {
					resolve(res.data);
				} else {
					console.error('API Request Failed:', url, res.data);
					const errorMsg = res.data.message || `请求失败(${res.statusCode})`;
					
					// 特殊错误码不显示Toast，交由页面自行处理
					const silentErrors = ['QUOTA_EXCEEDED', 'VIP_QUOTA_EXCEEDED'];
					if (!silentErrors.includes(res.data.code) && !silentErrors.includes(res.data.message)) {
						uni.showToast({
							title: errorMsg,
							icon: 'none'
						});
					}
					
					reject(res.data);
				}
			},
			fail: (err) => {
				console.error('API Network Error:', url, err);
				uni.showToast({
					title: '网络错误，请检查连接',
					icon: 'none'
				});
				reject(err);
			}
		});
	});
};

export default {
	// 用户登录
	login: (code) => request('/auth/login', 'POST', { code }),
	
	// 求签
	drawFortune: (userId, theme) => request('/fortune/draw', 'POST', { userId, theme }),
	
	// AI深度解读
	aiInterpret: (userId, signInfo, userInfo) => request('/fortune/ai-interpret', 'POST', { userId, signInfo, userInfo }),
	
	// 创建支付订单
	createPayment: (userId, productType, amount) => request('/payment/create', 'POST', { userId, productType, amount }),
	
	// 获取用户信息
	getUserInfo: (userId) => request(`/user/${userId}`, 'GET'),
	
	// 获取求签历史
	getFortuneHistory: (userId) => request(`/fortune/history/${userId}`, 'GET'),
	
	// 获取福运榜
	getRanking: () => request('/fortune/ranking', 'GET'),
	
	// 更新功德
	updateMerit: (userId, merit) => request('/user/merit', 'POST', { userId, merit }),
	
	// 大师解惑（对话）
	chatAsk: (userId, message, history) => request('/chat/ask', 'POST', { userId, message, history }),
	
	// 购买额外对话次数
	buyChatChance: (userId) => request('/payment/buy-chat-chance', 'POST', { userId, amount: 1 }),
	
	// 获取聊天记录
	getChatHistory: (userId) => request(`/chat/history/${userId}`, 'GET')
};
