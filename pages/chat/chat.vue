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
						<text selectable>{{ msg.content }}</text>
					</view>
				</view>
			</view>
			
			<!-- Loading 状态 -->
			<view class="chat-item ai" v-if="loading">
				<view class="avatar-container">
					<image class="avatar" src="/static/master_avatar.png" mode="aspectFill"></image>
				</view>
				<view class="message-content">
					<view class="bubble loading">
						<view class="dot"></view>
						<view class="dot"></view>
						<view class="dot"></view>
					</view>
				</view>
			</view>
			
			<!-- 底部占位，防止被输入框遮挡 -->
			<view class="padding-bottom"></view>
		</scroll-view>

		<!-- 底部输入框 -->
		<view class="input-area">
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
			<!-- 自定义弹窗 -->
			<view class="custom-modal-mask" v-if="modalVisible">
				<view class="custom-modal">
					<view class="modal-title">无量天尊</view>
					<view class="modal-content">{{ modalContent }}</view>
					<view class="modal-footer">
						<view class="modal-btn cancel" @click="closeModal">暂且作罢</view>
						<view class="modal-btn confirm" @click="confirmModal">{{ modalConfirmText }}</view>
					</view>
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
				modalVisible: false,
				modalContent: '',
				modalConfirmText: '',
				modalType: '',
				chatTokenCost: 8,
				tokenName: '福缘珠',
				pendingMessage: ''
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
			} else {
				this.messages.push(welcomeMsg);
			}
		},
		methods: {
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
				
				this.inputMessage = '';
				this.loading = true;
				this.scrollToBottom();
				
				// 3. 调用 API
				const userId = this.userInfo ? this.userInfo.id : 'guest';
				api.chatAsk(userId, message, history).then(res => {
					this.messages.push({
						role: 'ai',
						content: res.response
					});
					this.pendingMessage = '';
					this.loading = false;
					this.scrollToBottom();
				}).catch(err => {
					this.loading = false;
					// 次数不足：使用福缘珠购买问道次数
					if (err.code === 'CHAT_TOKEN_REQUIRED') {
						this.pendingMessage = message;
						const last = this.messages[this.messages.length - 1];
						if (last && last.role === 'user' && last.content === message) {
							this.messages.pop();
						}
						this.inputMessage = message;
						this.showQuotaModal(err);
					} else {
						this.messages.push({
							role: 'ai',
							content: '贫道正在闭关，暂无法回复。请善信稍后再试。'
						});
						this.scrollToBottom();
					}
				});
			},
			showQuotaModal(err = {}) {
				const cost = Number(err.cost) || this.chatTokenCost;
				const tokenName = String(err.tokenName || this.tokenName);
				this.chatTokenCost = cost;
				this.tokenName = tokenName;

				this.modalType = 'token';
				this.modalContent = `今日问道次数已用完，是否消耗${cost}${tokenName}购买1次问道机会？`;
				this.modalConfirmText = '购买1次';
				this.modalVisible = true;
			},
			closeModal() {
				this.modalVisible = false;
			},
			confirmModal() {
				this.modalVisible = false;
				if (this.modalType === 'token') {
					this.buyExtraChance();
				}
			},
			buyExtraChance() {
				const userId = this.userInfo ? this.userInfo.id : '';
				if (!userId) return;
				
				this.showDyLoading('购买中...');
				api.buyChatChance(userId).then(res => {
					this.hideDyLoading();
					const cost = Number(res.cost) || this.chatTokenCost;
					const tokenName = String(res.tokenName || this.tokenName);
					this.showDyToast(`已消耗${cost}${tokenName}`);
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
		height: 80px;
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

	.custom-modal {
		width: 80%;
		background-color: #fff;
		border-radius: 12px;
		overflow: hidden;
		animation: fadeIn 0.3s ease;
	}

	.modal-title {
		padding: 20px 20px 10px;
		text-align: center;
		font-size: 18px;
		font-weight: bold;
		color: #333;
	}

	.modal-content {
		padding: 0 20px 20px;
		text-align: center;
		font-size: 16px;
		color: #666;
		line-height: 1.5;
	}

	.modal-footer {
		display: flex;
		border-top: 1px solid #eee;
	}

	.modal-btn {
		flex: 1;
		height: 50px;
		line-height: 50px;
		text-align: center;
		font-size: 16px;
		
		&.cancel {
			color: #666;
			border-right: 1px solid #eee;
		}
		
		&.confirm {
			color: #8A2BE2;
			font-weight: bold;
		}
		
		&:active {
			background-color: #f9f9f9;
		}
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.9); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
