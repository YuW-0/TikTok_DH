const CLOUD_BASE_URL = 'https://1ls09us5f17oi-env-ucta8euk6e.service.douyincloud.run/api';

const getCurrentBaseUrl = () => uni.getStorageSync('apiBaseUrl') || CLOUD_BASE_URL;

const isAbortLikeError = (err = {}) => {
	const errMsg = String(err.errMsg || '').toLowerCase();
	return errMsg.includes('abort') || err.errNo === 21101 || err.errorCode === 100022;
};

const shouldRetryNetwork = (err = {}) => {
	const errMsg = String(err.errMsg || '').toLowerCase();
	return isAbortLikeError(err) || errMsg.includes('timeout') || errMsg.includes('network');
};

const request = (url, method, data = {}, options = {}) => {
	return new Promise((resolve, reject) => {
		const timeout = options.timeout || 120000;
		const call = (baseUrl, attempt = 0, hasSwitchedBase = false) => {
			uni.request({
				url: baseUrl + url,
				method: method,
				data: data,
				header: {
					'content-type': 'application/json'
				},
				timeout,
				success: (res) => {
					if (res.statusCode === 200 && res.data.success) {
						resolve(res.data);
						return;
					}

					const silentErrors = ['QUOTA_EXCEEDED', 'VIP_QUOTA_EXCEEDED', 'LIMIT_REACHED', 'Daily limit reached', 'USER_NOT_FOUND', 'User not found', 'ALREADY_CHECKED_IN', 'INVITE_ALREADY_BOUND', 'INVITE_CODE_INVALID', 'INVITE_SELF_BIND', 'AD_TOKEN_LIMIT_REACHED', 'CHAT_TOKEN_REQUIRED', 'TOKEN_INSUFFICIENT'];
					const isSilent = silentErrors.includes(res.data.code) || silentErrors.includes(res.data.message);
					if (isSilent) {
						console.warn('API Request Handled:', url, res.data);
					} else {
						console.error('API Request Failed:', url, res.data);
					}
					const errorMsg = res.data.message || `请求失败(${res.statusCode})`;

					// 特殊错误码不显示Toast，交由页面自行处理
					if (!isSilent) {
						uni.showToast({
							title: errorMsg,
							icon: 'none'
						});
					}

					reject(res.data);
				},
				fail: (err) => {
					if (isAbortLikeError(err)) {
						console.warn('API Request Aborted:', url, err);
					} else {
						console.error('API Network Error:', url, err);
					}

					const customBaseUrl = uni.getStorageSync('apiBaseUrl');

					// 1) Retry once for transient abort/network failures.
					if (attempt < 1 && shouldRetryNetwork(err)) {
						setTimeout(() => call(baseUrl, attempt + 1, hasSwitchedBase), 300);
						return;
					}

					// 2) If a custom base URL is configured and still failing, fallback to cloud URL.
					if (!hasSwitchedBase && customBaseUrl && customBaseUrl !== CLOUD_BASE_URL && shouldRetryNetwork(err)) {
						uni.removeStorageSync('apiBaseUrl');
						setTimeout(() => call(CLOUD_BASE_URL, 0, true), 300);
						return;
					}

					if (!isAbortLikeError(err)) {
						uni.showToast({
							title: '网络错误，请检查连接',
							icon: 'none'
						});
					}
					reject(err);
				}
			});
		};

		call(getCurrentBaseUrl(), 0, false);
	});
};

export default {
	// 用户登录
	login: (code) => request('/auth/login', 'POST', { code }),
	
	// 测算
	drawFortune: (userId, themeInfo, userProfile, signLevel) => request('/fortune/draw', 'POST', {
		userId,
		themeInfo,
		userProfile,
		signLevel
	}),
	
	// AI深度解读
	aiInterpret: (userId, signInfo, userInfo) => request('/fortune/ai-interpret', 'POST', { userId, signInfo, userInfo }, { timeout: 300000 }),

	// 查询AI深度解读结果（用于离开页面后恢复）
	getAiInterpretResult: (userId, recordId) => request(`/fortune/ai-interpret/result/${recordId}`, 'GET', { userId }),
	
	// 创建支付订单
	createPayment: (userId, productType, amount) => request('/payment/create', 'POST', { userId, productType, amount }),
	
	// 获取用户信息
	getUserInfo: (userId) => request(`/user/${userId}`, 'GET'),

	// 更新用户昵称
	updateNickname: (userId, nickname) => request('/user/profile', 'POST', { userId, nickname }),

	// 代币状态
	getTokenStatus: (userId) => request(`/token/status/${userId}`, 'GET'),

	// 每日签到获得代币
	checkinToken: (userId) => request('/token/checkin', 'POST', { userId }),

	// 观看广告获得代币
	rewardTokenByAd: (userId, adUnitId) => request('/token/ad-reward', 'POST', { userId, adUnitId }),

	// 绑定邀请码
	bindInviteCode: (userId, inviteCode) => request('/token/bind-invite', 'POST', { userId, inviteCode }),
	
	// 获取历史签文
	getFortuneHistory: (userId) => request(`/fortune/history/${userId}`, 'GET'),

	// 删除历史签文
	deleteFortuneHistory: (userId, recordId) => request('/fortune/history/delete', 'POST', { userId, recordId }),
	
	// 获取福运榜
	getRanking: () => request('/fortune/ranking', 'GET'),
	
	// 更新功德
	updateMerit: (userId, merit) => request('/user/merit', 'POST', { userId, merit }),
	
	// 获取聊天次数状态
	getChatQuota: (userId) => request(`/chat/quota/${userId}`, 'GET'),

	// AI大师解惑（对话）
	chatAsk: (userId, message, history) => request('/chat/ask', 'POST', { userId, message, history }),
	
	// 购买额外对话次数
	buyChatChance: (userId, amount) => request('/payment/buy-chat-chance', 'POST', { userId, amount }),

	// 看广告领取一次额外测算机会
	rewardDrawChanceByAd: (userId, adUnitId) => request('/ad/reward', 'POST', { userId, adUnitId, scene: 'draw_quota' }),
	
	// 获取聊天记录
	getChatHistory: (userId) => request(`/chat/history/${userId}`, 'GET')
};
