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

const normalizeErrorPayload = (payload, fallback = {}) => {
	if (!payload) return { ...fallback };
	if (typeof payload === 'string') {
		try {
			const parsed = JSON.parse(payload);
			if (parsed && typeof parsed === 'object') {
				return { ...fallback, ...parsed };
			}
		} catch (err) {
			return {
				...fallback,
				message: payload
			};
		}
		return { ...fallback };
	}
	if (typeof payload === 'object') {
		return { ...fallback, ...payload };
	}
	return { ...fallback };
};

const decodeChunkBuffer = (() => {
	const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
	return (arrayBuffer) => {
		if (!arrayBuffer) return '';
		if (decoder) {
			try {
				return decoder.decode(new Uint8Array(arrayBuffer), { stream: true });
			} catch (err) {
				// Fallback below.
			}
		}
		try {
			return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
		} catch (err) {
			return '';
		}
	};
})();

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

	// 测算（流式）
	drawFortuneStream: (userId, themeInfo, userProfile, signLevel, handlers = {}) => {
		const onPartial = typeof handlers.onPartial === 'function' ? handlers.onPartial : () => {};
		const onDone = typeof handlers.onDone === 'function' ? handlers.onDone : () => {};
		const onError = typeof handlers.onError === 'function' ? handlers.onError : () => {};

		const parseAndDispatchLines = (raw, state) => {
			state.buffer += raw;
			let lineEnd = state.buffer.indexOf('\n');
			while (lineEnd !== -1) {
				const line = state.buffer.slice(0, lineEnd).trim();
				state.buffer = state.buffer.slice(lineEnd + 1);
				if (line) {
					if (line === 'data: [DONE]') {
						state.done = true;
						lineEnd = state.buffer.indexOf('\n');
						continue;
					}

					const payloadLine = line.startsWith('data:') ? line.slice(5).trim() : line;
					try {
						const event = JSON.parse(payloadLine);
						if (event.type === 'partial' && event.sign) {
							state.partialSign = { ...state.partialSign, ...event.sign };
							onPartial(state.partialSign);
						} else if (event.type === 'done') {
							state.done = true;
							state.final = { sign: event.sign, recordId: event.recordId };
							onDone(state.final);
						} else if (event.type === 'error') {
							state.error = event;
							onError(event);
						}
					} catch (err) {
						// Ignore malformed partial lines.
					}
				}
				lineEnd = state.buffer.indexOf('\n');
			}
		};

		return new Promise((resolve, reject) => {
			const state = {
				buffer: '',
				partialSign: {},
				final: null,
				done: false,
				error: null,
				settled: false
			};

			const settleResolve = (payload) => {
				if (state.settled) return;
				state.settled = true;
				resolve(payload);
			};

			const settleReject = (err) => {
				if (state.settled) return;
				state.settled = true;
				reject(err);
			};

			const requestTask = uni.request({
				url: getCurrentBaseUrl() + '/fortune/draw-stream',
				method: 'POST',
				data: { userId, themeInfo, userProfile, signLevel },
				header: {
					'content-type': 'application/json',
					accept: 'text/event-stream'
				},
				timeout: 60000,
				enableChunked: true,
				success: (res) => {
					if (state.settled) return;
					if (res.statusCode !== 200) {
						const payload = normalizeErrorPayload(res.data, {
							statusCode: res.statusCode,
							message: `请求失败(${res.statusCode})`
						});
						onError(payload);
						settleReject(payload);
						return;
					}

					if (typeof res.data === 'string') {
						parseAndDispatchLines(res.data, state);
					}

					if (state.error) {
						settleReject(state.error);
						return;
					}

					if (state.final) {
						settleResolve({ success: true, ...state.final, streamed: true });
						return;
					}

					// Some runtimes may not emit chunk callbacks reliably; fallback to normal API result.
					request('/fortune/draw', 'POST', { userId, themeInfo, userProfile, signLevel })
						.then((normalRes) => settleResolve(normalRes))
						.catch((err) => settleReject(err));
				},
				fail: (err) => {
					if (state.settled) return;
					if (shouldRetryNetwork(err)) {
						request('/fortune/draw', 'POST', { userId, themeInfo, userProfile, signLevel })
							.then((normalRes) => settleResolve(normalRes))
							.catch((fallbackErr) => {
								onError(fallbackErr);
								settleReject(fallbackErr);
							});
						return;
					}
					onError(err);
					settleReject(err);
				}
			});

			if (requestTask && typeof requestTask.onChunkReceived === 'function') {
				requestTask.onChunkReceived((chunkRes) => {
					if (state.settled) return;
					const text = decodeChunkBuffer(chunkRes.data);
					if (!text) return;
					parseAndDispatchLines(text, state);
					if (state.error) {
						settleReject(state.error);
						return;
					}
					if (state.final) {
						settleResolve({ success: true, ...state.final, streamed: true });
					}
				});
			} else {
				if (requestTask && typeof requestTask.abort === 'function') {
					requestTask.abort();
				}
				request('/fortune/draw', 'POST', { userId, themeInfo, userProfile, signLevel })
					.then((normalRes) => settleResolve(normalRes))
					.catch((err) => {
						onError(err);
						settleReject(err);
					});
			}
		});
	},
	
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

	// AI大师解惑（流式对话）
	chatAskStream: (userId, message, history, handlers = {}) => {
		const onDelta = typeof handlers.onDelta === 'function' ? handlers.onDelta : () => {};
		const onDone = typeof handlers.onDone === 'function' ? handlers.onDone : () => {};
		const onError = typeof handlers.onError === 'function' ? handlers.onError : () => {};
		const streamTraceId = `chatstream-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

		const parseAndDispatchLines = (raw, state) => {
			state.buffer += raw;
			let lineEnd = state.buffer.indexOf('\n');
			while (lineEnd !== -1) {
				const line = state.buffer.slice(0, lineEnd).trim();
				state.buffer = state.buffer.slice(lineEnd + 1);
				if (line) {
					if (line === 'data: [DONE]') {
						state.done = true;
						onDone(state.fullText);
						lineEnd = state.buffer.indexOf('\n');
						continue;
					}

					const payloadLine = line.startsWith('data:') ? line.slice(5).trim() : line;
					try {
						const event = JSON.parse(payloadLine);
						if (event.type === 'delta' && typeof event.content === 'string') {
							state.fullText += event.content;
							onDelta(event.content, state.fullText);
						} else if (event.type === 'done') {
							state.done = true;
							onDone(state.fullText);
						} else if (event.type === 'error') {
							state.error = event;
							onError(event);
						}
					} catch (err) {
						// Ignore malformed partial lines.
					}
				}
				lineEnd = state.buffer.indexOf('\n');
			}
		};

		return new Promise((resolve, reject) => {
			console.info('[api.chatAskStream] start', { streamTraceId, userId, historySize: Array.isArray(history) ? history.length : 0 });
			const state = {
				fullText: '',
				buffer: '',
				done: false,
				error: null,
				settled: false,
				fallbacking: false
			};

			const settleResolve = () => {
				if (state.settled) return;
				state.settled = true;
				console.info('[api.chatAskStream] resolved', { streamTraceId, done: state.done, fullTextLength: state.fullText.length });
				resolve({ success: true, response: state.fullText, streamed: true });
			};

			const settleReject = (err) => {
				if (state.settled) return;
				state.settled = true;
				console.warn('[api.chatAskStream] rejected', { streamTraceId, err, fullTextLength: state.fullText.length, done: state.done });
				reject(err);
			};

			const requestTask = uni.request({
				url: getCurrentBaseUrl() + '/chat/ask-stream',
				method: 'POST',
				data: { userId, message, history, streamTraceId },
				header: {
					'content-type': 'application/json',
					accept: 'text/plain'
				},
				timeout: 300000,
				enableChunked: true,
				success: (res) => {
					if (state.settled) return;
					console.info('[api.chatAskStream] request success callback', { streamTraceId, statusCode: res.statusCode });
					if (res.statusCode !== 200) {
						const payload = normalizeErrorPayload(res.data, {
							statusCode: res.statusCode,
							message: `请求失败(${res.statusCode})`
						});
						onError(payload);
						settleReject(payload);
						return;
					}

					if (typeof res.data === 'string') {
						parseAndDispatchLines(res.data, state);
					}

					if (state.error) {
						console.warn('[api.chatAskStream] state error after success', { streamTraceId, error: state.error });
						settleReject(state.error);
						return;
					}

					if (!state.done) {
						onDone(state.fullText);
					}
					settleResolve();
				},
				fail: (err) => {
					if (state.settled) return;
					if (state.fallbacking) {
						console.warn('[api.chatAskStream] ignore stream fail during fallback', { streamTraceId, err });
						return;
					}
					console.warn('[api.chatAskStream] request fail callback', { streamTraceId, err, fullTextLength: state.fullText.length });
					if (state.fullText) {
						onDone(state.fullText);
						settleResolve();
						return;
					}
					onError(err);
					settleReject(err);
				}
			});

			if (requestTask && typeof requestTask.onChunkReceived === 'function') {
				console.info('[api.chatAskStream] chunk mode enabled', { streamTraceId });
				requestTask.onChunkReceived((chunkRes) => {
					if (state.settled) return;
					if (state.fallbacking) return;
					const text = decodeChunkBuffer(chunkRes.data);
					if (!text) return;
					parseAndDispatchLines(text, state);
					if (state.error) {
						console.warn('[api.chatAskStream] stream event error', { streamTraceId, error: state.error });
						settleReject(state.error);
						return;
					}
					if (state.done) {
						settleResolve();
					}
				});
			} else {
				console.warn('[api.chatAskStream] chunk mode unavailable, fallback to non-stream', { streamTraceId });
				// Runtime does not support chunk callback, fallback to non-stream API.
				state.fallbacking = true;
				request('/chat/ask', 'POST', { userId, message, history }, { timeout: 300000 })
					.then((res) => {
						if (state.settled) return;
						const text = String(res.response || '');
						onDelta(text, text);
						onDone(text);
						state.fullText = text;
						settleResolve();
					})
					.catch((err) => {
						if (state.settled) return;
						onError(err);
						settleReject(err);
					});
			}
		});
	},
	
	// 购买额外对话次数
	buyChatChance: (userId, amount) => request('/payment/buy-chat-chance', 'POST', { userId, amount }),

	// 看广告领取一次额外测算机会
	rewardDrawChanceByAd: (userId, adUnitId) => request('/ad/reward', 'POST', { userId, adUnitId, scene: 'draw_quota' }),
	
	// 获取聊天记录
	getChatHistory: (userId) => request(`/chat/history/${userId}`, 'GET')
};
