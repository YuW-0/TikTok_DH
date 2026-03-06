<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="result-modal">
			<view class="modal-content">
				<view class="scroll-bg">
					<view class="scroll-top"></view>
					<view class="scroll-body">
						<view class="result-header">
							<text class="sign-level">{{ sign.sign_level }}</text>
							<text class="sign-title">{{ sign.sign_title }}</text>
						</view>
						
						<view class="sign-text-vertical">
							<text v-for="(char, index) in sign.sign_text" :key="index">{{ char }}</text>
						</view>

						<view class="divider"></view>

						<view class="interpretation">
							<text class="inter-title">【解曰】</text>
							<text class="inter-content">{{ sign.basic_interpretation }}</text>
						</view>
						
						<!-- 完整解签区域 -->
						<view class="full-interpretation" v-if="isVip || isAdWatched">
							<text class="inter-title">【深度解读】</text>
							<text class="inter-content">{{ sign.full_interpretation }}</text>
						</view>
						
						<view class="lock-area" v-else>
							<text class="lock-hint">观看广告解锁深度解读</text>
							<button class="ad-btn" @click="watchAd">
								<text>📺 观看广告解锁</text>
							</button>
							<view class="vip-link" @click="goToVip">
								<text>成为VIP免广告 ></text>
							</view>
						</view>
						
						<!-- 古籍解签入口 -->
						<view class="ai-section" v-if="!hasAiResult">
							<view class="ai-divider">
								<text>✨ 大师亲批 · 古籍精解 ✨</text>
							</view>
							<button class="ai-btn" @click="goToAiInterpret">
								<text>获取大师一对一深度解读 (¥5.00)</text>
							</button>
							<text class="ai-desc">结合《周易》、《渊海子平》等古籍，大师为您量身批注</text>
						</view>
						
						<!-- 大师解读结果展示 -->
						<view class="ai-result-section" v-else>
							<view class="ai-divider">
								<text>✨ 大师亲批结果 ✨</text>
							</view>
							<text class="ai-result-text">{{ aiResultText }}</text>
						</view>

					</view>
					<view class="scroll-bottom"></view>
				</view>
				
				<view class="modal-actions">
					<button class="action-btn close-btn" @click="close">关闭</button>
					<button class="action-btn share-btn" open-type="share">分享</button>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
	export default {
		name: 'sign-result',
		props: {
			sign: {
				type: Object,
				default: () => ({})
			},
			isVip: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isAdWatched: false
			}
		},
		computed: {
			hasAiResult() {
				const ai = this.sign.ai_interpretations;
				if (!ai) return false;
				if (Array.isArray(ai)) {
					return ai.length > 0 && ai[0].ai_response;
				}
				return !!ai.ai_response;
			},
			aiResultText() {
				const ai = this.sign.ai_interpretations;
				if (!ai) return '';
				if (Array.isArray(ai)) {
					return ai.length > 0 ? ai[0].ai_response : '';
				}
				return ai.ai_response || '';
			}
		},
		methods: {
			open() {
				this.isAdWatched = false;
				this.$refs.popup.open();
			},
			close() {
				this.$refs.popup.close();
			},
			watchAd() {
				uni.showLoading({ title: '加载广告中...' });
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({ title: '解锁成功', icon: 'success' });
					this.isAdWatched = true;
				}, 1500);
			},
			goToVip() {
				this.close();
				uni.navigateTo({ url: '/pages/pay/pay' });
			},
			goToAiInterpret() {
				const params = {
					signTitle: this.sign.sign_title,
					signLevel: this.sign.sign_level,
					signText: this.sign.sign_text,
					theme: this.sign.theme || '综合',
					recordId: this.sign.recordId || this.sign.id // 传递求签记录ID
				};
				const query = Object.keys(params)
					.map(key => `${key}=${encodeURIComponent(params[key])}`)
					.join('&');
					
				this.close();
				uni.navigateTo({
					url: `/pages/draw/ai-interpret?${query}`
				});
			}
		}
	}
</script>

<style lang="scss">
	// 弹窗样式
	.result-modal {
		width: 300px;
		height: 600px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modal-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.scroll-bg {
		width: 100%;
		flex: 1;
		background-color: #FFF8E1;
		border-radius: 8px;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 0 20px rgba(0,0,0,0.5);
		border: 1px solid #D2B48C;
	}

	.scroll-top, .scroll-bottom {
		height: 20px;
		background-color: #8B4513;
		width: 100%;
	}

	.scroll-body {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.result-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20px;
	}

	.sign-level {
		font-size: 28px;
		font-weight: bold;
		color: #DC143C;
		margin-bottom: 5px;
	}

	.sign-title {
		font-size: 16px;
		color: #666;
	}

	.sign-text-vertical {
		width: 40px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20px;
		
		text {
			font-size: 20px;
			line-height: 1.5;
			color: #333;
			font-weight: bold;
			font-family: "SimSun", serif;
		}
	}

	.divider {
		width: 100%;
		height: 1px;
		background-color: #D2B48C;
		margin: 10px 0;
	}

	.interpretation, .full-interpretation {
		width: 100%;
		margin-bottom: 15px;
	}

	.inter-title {
		font-weight: bold;
		color: #8B4513;
		font-size: 14px;
		display: block;
		margin-bottom: 5px;
	}

	.inter-content {
		font-size: 14px;
		color: #555;
		line-height: 1.5;
	}

	.lock-area {
		width: 100%;
		background-color: rgba(0,0,0,0.05);
		padding: 15px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 10px;
	}

	.lock-hint {
		font-size: 12px;
		color: #666;
		margin-bottom: 10px;
	}

	.ad-btn {
		background-color: #DC143C;
		color: #fff;
		font-size: 14px;
		padding: 5px 20px;
		border-radius: 20px;
		margin-bottom: 10px;
		line-height: 2;
	}

	.vip-link {
		font-size: 12px;
		color: #8B4513;
		text-decoration: underline;
	}

	.ai-section {
		width: 100%;
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 15px;
		border-top: 1px dashed #D2B48C;
	}

	.ai-divider {
		margin-bottom: 10px;
		text {
			font-size: 14px;
			color: #8B4513;
			font-weight: bold;
		}
	}

	.ai-btn {
		background: linear-gradient(to right, #8A2BE2, #4B0082);
		color: #fff;
		font-size: 13px;
		padding: 0 15px;
		border-radius: 20px;
		margin-bottom: 8px;
		line-height: 2.4;
		box-shadow: 0 4px 10px rgba(138, 43, 226, 0.3);
		width: 100%;
	}

	.ai-desc {
		font-size: 10px;
		color: #999;
		text-align: center;
	}

	.modal-actions {
		width: 100%;
		display: flex;
		justify-content: space-between;
		margin-top: 20px;
	}

	.action-btn {
		width: 45%;
		font-size: 14px;
		border-radius: 20px;
	}

	.close-btn {
		background-color: #eee;
		color: #333;
	}

	.share-btn {
		background-color: #FFD700;
		color: #8B4513;
		font-weight: bold;
	}

	.ai-result-section {
		width: 100%;
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 15px;
		border-top: 1px dashed #D2B48C;
		background-color: #F8F0FF;
		padding: 15px;
		border-radius: 8px;
	}

	.ai-result-text {
		font-size: 14px;
		color: #333;
		line-height: 1.6;
		white-space: pre-wrap;
	}
</style>