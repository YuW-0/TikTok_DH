<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<view class="result-modal">
			<view class="modal-content">
				<view class="scroll-bg">
					<view class="scroll-top"></view>
					<view class="scroll-body">
						<view class="result-header">
							<text class="sign-level">{{ normalizedSign.sign_level }}</text>
							<text class="sign-title">{{ normalizedSign.sign_title }}</text>
						</view>

						<view class="sign-text-vertical" v-if="signTextChars.length">
							<text class="sign-text-lines">{{ verticalSignText }}</text>
						</view>
						<view class="sign-text-fallback" v-else>
							<text>{{ normalizedSign.sign_text || '签文暂缺' }}</text>
						</view>

						<view class="divider"></view>

						<view class="interpretation">
							<text class="inter-title">【解曰】</text>
							<text class="inter-content">{{ normalizedSign.basic_interpretation }}</text>
						</view>

						<view class="full-interpretation">
							<text class="inter-title">【深度解读】</text>
							<text class="inter-content">{{ normalizedSign.full_interpretation }}</text>
						</view>

						<view class="lucky-section" v-if="normalizedSign.lucky_number || normalizedSign.lucky_color">
							<text class="inter-title">【吉运指引】</text>
							<view class="lucky-row" v-if="normalizedSign.lucky_number">
								<text class="lucky-label">幸运数字：</text>
								<text class="lucky-value">{{ normalizedSign.lucky_number }}</text>
							</view>
							<view class="lucky-row" v-if="normalizedSign.lucky_color">
								<text class="lucky-label">幸运颜色：</text>
								<text class="lucky-value">{{ normalizedSign.lucky_color }}</text>
							</view>
						</view>

						<view class="ai-section" v-if="!hasAiResult">
							<view class="ai-divider">
								<text>✨ 大师亲批 · 古籍精解 ✨</text>
							</view>
							<button class="ai-btn" @click="goToAiInterpret">
								<text>获取大师一对一深度解读</text>
							</button>
							<text class="ai-desc">填写信息后，观看广告即可解锁大师一对一深度解读</text>
						</view>

						<view class="ai-result-section" v-else>
							<view class="ai-divider">
								<text>✨ 大师亲批结果 ✨</text>
							</view>
							<text class="ai-result-text">{{ aiResultText }}</text>
							<text class="result-bridge-text">天机未尽，若心中仍有疑惑，可再叩仙门请大师续断。</text>
							<button class="ask-more-btn" @click="goToMasterConsultation">再叩仙门·续问天机</button>
						</view>
					</view>
					<view class="scroll-guide">
						<text>往下滑动查看更多</text>
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
		computed: {
			normalizedSign() {
				const source = this.sign || {};
				const nested = Array.isArray(source.fortune_signs)
					? (source.fortune_signs[0] || {})
					: (source.fortune_signs || {});
				const pickFirst = (...values) => {
					for (let i = 0; i < values.length; i++) {
						const val = values[i];
						if (val !== undefined && val !== null && String(val).trim() !== '') {
							return val;
						}
					}
					return '';
				};
				return {
					sign_title: pickFirst(source.sign_title, source.signTitle, source.title, nested.sign_title, nested.signTitle, nested.title),
					sign_level: pickFirst(source.sign_level, source.signLevel, source.level, nested.sign_level, nested.signLevel, nested.level),
					sign_text: pickFirst(source.sign_text, source.signText, source.text, nested.sign_text, nested.signText, nested.text),
					basic_interpretation: pickFirst(source.basic_interpretation, source.basicInterpretation, source.interpretation, nested.basic_interpretation, nested.basicInterpretation, nested.interpretation),
					full_interpretation: pickFirst(source.full_interpretation, source.fullInterpretation, nested.full_interpretation, nested.fullInterpretation),
					lucky_number: pickFirst(source.lucky_number, source.luckyNumber, nested.lucky_number, nested.luckyNumber),
					lucky_color: pickFirst(source.lucky_color, source.luckyColor, nested.lucky_color, nested.luckyColor),
					theme: pickFirst(source.theme, nested.theme, '综合'),
					recordId: pickFirst(source.recordId, source.id, nested.recordId, nested.id)
				};
			},
			signTextChars() {
				const raw = this.normalizedSign.sign_text;
				const text = Array.isArray(raw)
					? raw.join('')
					: String(raw || '').trim();
				if (!text) return [];
				return Array.from(text.replace(/\s+/g, ''));
			},
			verticalSignText() {
				return this.signTextChars.join('\n');
			},
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
				console.log('[sign-result] open sign payload:', this.sign);
				console.log('[sign-result] normalized sign:', this.normalizedSign);
				this.$refs.popup.open();
			},
			close() {
				this.$refs.popup.close();
			},
			goToAiInterpret() {
				const params = {
					signTitle: this.normalizedSign.sign_title,
					signLevel: this.normalizedSign.sign_level,
					signText: this.normalizedSign.sign_text,
					theme: this.normalizedSign.theme,
					recordId: this.normalizedSign.recordId
				};
				const query = Object.keys(params)
					.map((key) => `${key}=${encodeURIComponent(params[key])}`)
					.join('&');

				this.close();
				uni.navigateTo({
					url: `/pages/draw/ai-interpret?${query}`
				});
			},
			goToMasterConsultation() {
				this.close();
				uni.navigateTo({
					url: '/pages/chat/chat'
				});
			}
		}
	};
</script>

<style lang="scss">
	// 弹窗样式
	.result-modal {
		width: 92vw;
		max-width: 360px;
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

	.scroll-guide {
		position: absolute;
		left: 50%;
		bottom: 30px;
		transform: translateX(-50%);
		background-color: rgba(255, 255, 255, 0.92);
		border: 1px solid #e8d7b6;
		border-radius: 12px;
		padding: 4px 10px;
		pointer-events: none;
		z-index: 3;
		animation: guideFloat 1.6s ease-in-out infinite;

		text {
			font-size: 11px;
			color: #8B4513;
		}
	}

	@keyframes guideFloat {
		0% { transform: translateX(-50%) translateY(0); opacity: 0.85; }
		50% { transform: translateX(-50%) translateY(4px); opacity: 1; }
		100% { transform: translateX(-50%) translateY(0); opacity: 0.85; }
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
		overflow-x: hidden;
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

		.sign-text-lines {
			font-size: 20px;
			line-height: 1.5;
			color: #333;
			font-weight: bold;
			font-family: "SimSun", serif;
			white-space: pre-line;
			text-align: center;
		}
	}

	.sign-text-fallback {
		width: 100%;
		margin-bottom: 20px;

		text {
			font-size: 16px;
			line-height: 1.7;
			color: #333;
			font-family: "SimSun", serif;
		}
	}

	.result-bridge-text {
		display: block;
		font-size: 13px;
		line-height: 1.7;
		color: #5f4b8b;
		margin-bottom: 12px;
	}

	.ask-more-btn {
		background: linear-gradient(to right, #6a0dad, #4b0082);
		color: #fff;
		font-size: 14px;
		border-radius: 22px;
		height: 44px;
		line-height: 44px;
		width: 100%;
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

	.lucky-section {
		width: 100%;
		margin-bottom: 15px;
		padding: 10px;
		background-color: #fffaf0;
		border: 1px solid #f1e0ba;
		border-radius: 8px;
	}

	.lucky-row {
		display: flex;
		align-items: center;
		margin-top: 4px;
	}

	.lucky-label {
		font-size: 13px;
		color: #8B4513;
		margin-right: 6px;
	}

	.lucky-value {
		font-size: 13px;
		color: #333;
		font-weight: bold;
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
		word-break: break-all;
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