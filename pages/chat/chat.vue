<template>
	<view class="container">
		<!-- 聊天记录区域 -->
		<scroll-view class="chat-list" scroll-y="true" :scroll-top="scrollTop" :scroll-with-animation="true" id="chatList">
			<view class="chat-item" v-for="(msg, index) in messages" :key="index" :class="msg.role">
				<view class="avatar-container">
					<image class="avatar" :src="msg.role === 'ai' ? '/static/master_avatar.png' : userAvatar" mode="aspectFill"></image>
				</view>
				<view class="message-content">
					<view class="bubble">
						<template v-if="msg.role === 'ai' && loading && !msg.content && index === messages.length - 1">
							<view class="dot"></view>
							<view class="dot"></view>
							<view class="dot"></view>
						</template>
						<text v-else selectable>{{ msg.content }}</text>
					</view>
				</view>
			</view>
			
			<!-- 底部占位，防止被输入框遮挡 -->
			<view class="padding-bottom"></view>
		</scroll-view>

		<!-- 底部输入框 -->
		<view class="input-area">
			<view class="chat-quota-bar">
				<view class="quota-pill">
					<text>剩余对话次数 {{ chatRemaining }}</text>
				</view>
				<view class="quota-buy" @click="openPurchasePanel">购买</view>
			</view>
			<view class="input-wrapper">
				<input 
					class="input-box" 
					v-model="inputMessage" 
					placeholder="请善信输入心中困惑..." 
					placeholder-class="input-placeholder"
					confirm-type="send"
					@confirm="sendMessage"
					:disabled="loading"
				/>
				<button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || loading">
					<uni-icons type="paperplane-filled" size="20" color="#fff"></uni-icons>
				</button>
			</view>
		</view>

		<view class="custom-modal-mask" v-if="purchaseVisible" @click="closePurchasePanel">
			<view class="purchase-panel" @click.stop>
				<view class="purchase-title">购买对话次数</view>
				<view class="purchase-balance">{{ tokenName }}余额：{{ tokenBalance }}</view>
				<view
					class="purchase-item"
					v-for="item in purchaseOptions"
					:key="item.count"
					@click="buyExtraChance(item.count)"
				>
					<view class="item-left">
						<text class="item-count">买{{ item.count }}次</text>
						<text class="item-cost">消耗 {{ item.cost }}{{ tokenName }}</text>
					</view>
					<view class="item-right">购买</view>
				</view>
				<view class="purchase-cancel" @click="closePurchasePanel">取消</view>
			</view>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';

	export default {
		data() {
			return {
				messages: [],
				inputMessage: '',
				loading: false,
				scrollTop: 0,
				userAvatar: '/static/male_Taoist.png', // 默认头像
				userInfo: null,
				chatTokenCost: 8,
				tokenName: '福缘珠',
				tokenBalance: 0,
				chatRemaining: 0,
				purchaseVisible: false,
				pendingMessage: '',
				purchaseOptions: [
					{ count: 10, cost: 80 },
					{ count: 50, cost: 400 },
					{ count: 100, cost: 800 }
				]
			}
		},
		onLoad() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.userInfo = userInfo;
				this.userAvatar = userInfo.avatar || '/static/male_Taoist.png';
			}
			
			// 初始欢迎语
			const welcomeMsg = {
				role: 'ai',
				content: '无量天尊。贫道乃古籍大师，善信有何困惑，不妨与贫道一叙。无论是运势起伏，还是心中不解，贫道愿略尽绵薄之力。'
			};
			
			if (this.userInfo && this.userInfo.id) {
				// 加载历史记录
				this.loadHistory(welcomeMsg);
				this.refreshChatAssets();
			} else {
				this.messages.push(welcomeMsg);
			}
		},
		methods: {
			refreshChatAssets() {
				const userId = this.userInfo && this.userInfo.id;
				if (!userId) return;

				Promise.all([
					api.getChatQuota(userId),
					api.getTokenStatus(userId)
				]).then(([quotaRes, tokenRes]) => {
					this.chatRemaining = Number(quotaRes.totalRemaining) || 0;
					this.chatTokenCost = Number(quotaRes.tokenCostPerChance) || this.chatTokenCost;
					this.tokenName = String(tokenRes.tokenName || this.tokenName);
					this.tokenBalance = Number(tokenRes.balance) || 0;
					this.purchaseOptions = [10, 50, 100].map((count) => ({
						count,
						cost: count * this.chatTokenCost
					}));
				}).catch(() => {});
			},
			openPurchasePanel() {
				this.refreshChatAssets();
				this.purchaseVisible = true;
			},
			closePurchasePanel() {
				this.purchaseVisible = false;
			},
			showDyToast(title, icon = 'none') {
				if (typeof tt !== 'undefined' && tt.showToast) {
					tt.showToast({ title, icon });
					return;
				}
				uni.showToast({ title, icon });
			},
			showDyLoading(title = '请稍候...') {
				if (typeof tt !== 'undefined' && tt.showLoading) {
					tt.showLoading({ title });
					return;
				}
				uni.showLoading({ title });
			},
			hideDyLoading() {
				if (typeof tt !== 'undefined' && tt.hideLoading) {
					tt.hideLoading();
					return;
				}
				uni.hideLoading();
			},
			loadHistory(welcomeMsg) {
				api.getChatHistory(this.userInfo.id).then(res => {
					if (res.messages && res.messages.length > 0) {
						// 转换格式
						const history = res.messages.map(m => ({
							role: m.role,
							content: m.content
						}));
						this.messages = history;
					} else {
						// 无历史记录，显示欢迎语
						this.messages.push(welcomeMsg);
					}
					this.scrollToBottom();
				}).catch(err => {
					console.error('Failed to load history', err);
					this.messages.push(welcomeMsg);
					this.scrollToBottom();
				});
			},
			sendMessage() {
				if (!this.inputMessage.trim() || this.loading) return;
				
				const message = this.inputMessage.trim();
				
				// 1. 准备历史记录
				const history = this.messages.slice(-10).map(m => ({
					role: m.role,
					content: m.content
				}));
				
				// 2. 添加用户消息
				this.messages.push({
					role: 'user',
					content: message
				});

				this.messages.push({
					role: 'ai',
					content: ''
				});
				const aiIndex = this.messages.length - 1;
				
				this.inputMessage = '';
				this.loading = true;
				this.scrollToBottom();
				
				// 3. 调用 API
				const userId = this.userInfo ? this.userInfo.id : 'guest';
				const streamTraceId = `chat-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
				let hasDelta = false;
				const recoverFromLatestHistory = () => {
					if (!userId || userId === 'guest') return Promise.resolve(false);
					return api.getChatHistory(userId).then((historyRes) => {
						const list = (historyRes && historyRes.messages) || [];
						if (!Array.isArray(list) || !list.length) return false;
						const lastAi = [...list].reverse().find((item) => item && item.role === 'ai' && String(item.content || '').trim());
						if (!lastAi) return false;
						if (this.messages[aiIndex] && this.messages[aiIndex].role === 'ai') {
							this.messages[aiIndex].content = String(lastAi.content || '').trim();
						} else {
							this.messages.push({ role: 'ai', content: String(lastAi.content || '').trim() });
						}
						this.pendingMessage = '';
						this.refreshChatAssets();
						this.scrollToBottom();
						return true;
					}).catch(() => false);
				};
				const fallbackToNormalChat = () => {
					return api.chatAsk(userId, message, history).then((res) => {
						const text = String(res.response || '').trim() || '贫道正在思量此事。';
						if (this.messages[aiIndex]) {
							this.messages[aiIndex].content = text;
						} else {
							this.messages.push({ role: 'ai', content: text });
						}
						this.pendingMessage = '';
						this.loading = false;
						this.refreshChatAssets();
						this.scrollToBottom();
					});
				};
				console.info('[chat] sendMessage stream start', { streamTraceId, userId, historySize: history.length });
				api.chatAskStream(userId, message, history, {
					onDelta: (delta, fullText) => {
						if (typeof fullText !== 'string') return;
						hasDelta = true;
						this.loading = false;
						if (this.messages[aiIndex]) {
							this.messages[aiIndex].content = fullText;
						}
						this.scrollToBottom();
					},
					onDone: (fullText) => {
						if (this.messages[aiIndex]) {
							this.messages[aiIndex].content = String(fullText || this.messages[aiIndex].content || '贫道正在思量此事。');
						}
					}
				}).then(() => {
					console.info('[chat] stream resolved', { streamTraceId, hasDelta });
					this.pendingMessage = '';
					this.loading = false;
					this.refreshChatAssets();
					this.scrollToBottom();
				}).catch(err => {
					this.loading = false;
					console.warn('[chat] stream rejected', { streamTraceId, err, hasDelta });
					const aiMsgAtIndex = this.messages[aiIndex];
					const hasRenderedAiText = Boolean(aiMsgAtIndex && aiMsgAtIndex.role === 'ai' && String(aiMsgAtIndex.content || '').trim());
					if (!hasDelta) {
						const streamFailed = String(err && err.code ? err.code : '').includes('STREAM') || String(err && err.message ? err.message : '').toLowerCase().includes('stream');
						if (streamFailed) {
							fallbackToNormalChat().catch(() => {
								recoverFromLatestHistory().then((recovered) => {
									if (recovered) return;
									const aiMsg = this.messages[this.messages.length - 1];
									if (aiMsg && aiMsg.role === 'ai' && !aiMsg.content) {
										this.messages.pop();
									}
									this.messages.push({ role: 'ai', content: '大师正在打坐，请稍后再试。' });
									this.scrollToBottom();
								});
							});
							return;
						}
					}
					// 次数不足：使用福缘珠购买问道次数
					if (err.code === 'CHAT_TOKEN_REQUIRED') {
						this.pendingMessage = message;
						const aiMsg = this.messages[this.messages.length - 1];
						if (aiMsg && aiMsg.role === 'ai' && !aiMsg.content) {
							this.messages.pop();
						}
						const userMsg = this.messages[this.messages.length - 1];
						if (userMsg && userMsg.role === 'user' && userMsg.content === message) {
							this.messages.pop();
						}
						this.inputMessage = message;
						this.openPurchasePanel();
					} else {
						if (hasDelta || hasRenderedAiText) {
							this.pendingMessage = '';
							this.refreshChatAssets();
							this.scrollToBottom();
							return;
						}
						if (!hasDelta) {
							const aiMsg = this.messages[this.messages.length - 1];
							if (aiMsg && aiMsg.role === 'ai' && !aiMsg.content) {
								this.messages.pop();
							}
						}
						const fallbackText = String(err && err.message ? err.message : '').trim() || '大师正在打坐，请稍后再试。';
						this.messages.push({
							role: 'ai',
							content: fallbackText
						});
						this.scrollToBottom();
					}
				});
			},
			buyExtraChance(amount) {
				const userId = this.userInfo ? this.userInfo.id : '';
				if (!userId) return;
				const safeAmount = Number(amount);
				if (![10, 50, 100].includes(safeAmount)) return;
				
				this.showDyLoading('购买中...');
				api.buyChatChance(userId, safeAmount).then(res => {
					this.hideDyLoading();
					this.purchaseVisible = false;
					const cost = Number(res.cost) || this.chatTokenCost;
					const tokenName = String(res.tokenName || this.tokenName);
					this.showDyToast(`已消耗${cost}${tokenName}`);
					this.refreshChatAssets();
					if (this.pendingMessage) {
						const retryMessage = this.pendingMessage;
						this.pendingMessage = '';
						this.inputMessage = retryMessage;
						this.sendMessage();
						return;
					}
					this.messages.push({
						role: 'ai',
						content: '次数已续，可继续问道。'
					});
					this.scrollToBottom();
				}).catch(err => {
					this.hideDyLoading();
					if (String(err.code || '') === 'TOKEN_INSUFFICIENT') {
						const cost = Number(err.cost) || this.chatTokenCost;
						const tokenName = String(err.tokenName || this.tokenName);
						this.showDyToast(`${tokenName}不足，需${cost}${tokenName}`);
						this.refreshChatAssets();
						return;
					}
					this.showDyToast('购买失败，请稍后重试');
				});
			},
			scrollToBottom() {
				this.$nextTick(() => {
					this.scrollTop = 999999;
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		height: 100vh;
		background-color: #FAF0E6;
		display: flex;
		flex-direction: column;
		/* 确保背景色能够铺满整个页面，防止回弹时漏出白色 */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
	}

	.chat-list {
		flex: 1;
		padding: 20px 15px;
		box-sizing: border-box;
		// 确保内容过多时可以滚动，且背景色一致
		overflow-y: auto;
		height: 100%;
		/* 增加顶部内边距，避开导航栏或刘海屏遮挡 */
		padding-top: 50px; 
	}

	.chat-item {
		display: flex;
		margin-bottom: 20px;
		
		&.ai {
			flex-direction: row;
			
			.message-content {
				margin-left: 10px;
				
				.bubble {
					background-color: #fff;
					color: #333;
					border-top-left-radius: 0;
				}
			}
		}
		
		&.user {
			flex-direction: row-reverse;
			
			.message-content {
				margin-right: 10px;
				
				.bubble {
					background-color: #8A2BE2;
					color: #fff;
					border-top-right-radius: 0;
				}
			}
		}
	}

	.avatar-container {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background-color: #fff;
		border: 1px solid #ddd;
	}

	.avatar {
		width: 100%;
		height: 100%;
	}

	.message-content {
		max-width: 70%;
	}

	.bubble {
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 15px;
		line-height: 1.6;
		box-shadow: 0 2px 6px rgba(0,0,0,0.05);
		word-break: break-all;
		
		&.loading {
			display: flex;
			align-items: center;
			height: 24px;
			padding: 12px 20px;
		}
	}
	
	.dot {
		width: 6px;
		height: 6px;
		background-color: #999;
		border-radius: 50%;
		margin: 0 3px;
		animation: bounce 1.4s infinite ease-in-out both;
		
		&:nth-child(1) { animation-delay: -0.32s; }
		&:nth-child(2) { animation-delay: -0.16s; }
	}
	
	@keyframes bounce {
		0%, 80%, 100% { transform: scale(0); }
		40% { transform: scale(1); }
	}

	.padding-bottom {
		height: 140px;
	}

	.input-area {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		padding: 10px 15px;
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
		z-index: 100;
	}

	.chat-quota-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.quota-pill {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		border-radius: 999px;
		background: linear-gradient(90deg, #fff1db, #ffe8bf);
		border: 1px solid #f2c98c;

		text {
			font-size: 12px;
			color: #8B4513;
		}
	}

	.quota-buy {
		font-size: 12px;
		color: #fff;
		background: linear-gradient(135deg, #DC143C, #B80F2D);
		padding: 5px 12px;
		border-radius: 999px;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background-color: #F5F5F5;
		border-radius: 24px;
		padding: 8px 12px;
	}

	.input-box {
		flex: 1;
		height: 36px;
		font-size: 14px;
		padding: 0 10px;
	}
	
	.input-placeholder {
		color: #999;
	}

	.send-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #8A2BE2, #4B0082);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin-left: 10px;
		
		&[disabled] {
			background: #ccc;
			opacity: 0.6;
		}
	}

	/* 自定义弹窗样式 */
	.custom-modal-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}

	.purchase-panel {
		width: 84%;
		background-color: #fff;
		border-radius: 14px;
		overflow: hidden;
		animation: fadeIn 0.3s ease;
		padding-bottom: 10px;
	}

	.purchase-title {
		padding: 16px 16px 6px;
		text-align: center;
		font-size: 17px;
		font-weight: bold;
		color: #2f2f2f;
	}

	.purchase-balance {
		padding: 0 16px 12px;
		text-align: center;
		font-size: 13px;
		color: #8B4513;
	}

	.purchase-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		margin: 0 12px 8px;
		border-radius: 10px;
		background: #faf7f1;
		border: 1px solid #efe2ca;
	}

	.item-left {
		display: flex;
		flex-direction: column;
	}

	.item-count {
		font-size: 15px;
		color: #222;
		font-weight: bold;
	}

	.item-cost {
		font-size: 12px;
		color: #7a7a7a;
		margin-top: 2px;
	}

	.item-right {
		font-size: 13px;
		color: #fff;
		background: linear-gradient(135deg, #DC143C, #B80F2D);
		padding: 6px 14px;
		border-radius: 16px;
	}

	.purchase-cancel {
		margin: 2px 12px 0;
		height: 40px;
		line-height: 40px;
		text-align: center;
		font-size: 14px;
		color: #666;
		background: #f2f2f2;
		border-radius: 10px;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
