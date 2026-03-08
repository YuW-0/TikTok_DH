<template>
	<view class="container">
		<view class="draw-header">
			<text class="draw-title">正在求：{{ themeName }}签</text>
		</view>

		<!-- 摇签区域 -->
		<view class="shake-area" @click="startShake">
			<view class="cylinder-wrapper" :class="{ shaking: isShaking }">
				<view class="cylinder-body">
					<text class="cylinder-text">测算</text>
				</view>
				<view class="sticks">
					<view class="stick" v-for="n in 8" :key="n"></view>
				</view>
			</view>
			<text class="shake-hint" v-if="!isShaking">点击屏幕或摇动手机</text>
			<text class="shake-hint" v-else>正在测算中...</text>
		</view>

		<!-- 签文弹窗 -->
		<sign-result ref="signResult" :sign="result" :isVip="isVip"></sign-result>
	</view>
</template>

<script>
	import api from '@/utils/api.js';
	import { showInterstitialAd, getInterstitialAdUnitId, showRewardedVideoAd, getRewardedAdUnitId } from '@/utils/ad.js';
	import SignResult from '@/components/sign-result/sign-result.vue';

	export default {
		components: {
			SignResult
		},
		data() {
			return {
				themeType: 'wealth',
				themeName: '财运',
				isShaking: false,
				isVip: false,
				result: {}
			}
		},
		onLoad(options) {
			if (options.type) this.themeType = options.type;
			if (options.name) this.themeName = options.name;
			
			const vipStatus = uni.getStorageSync('isVip');
			if (vipStatus) this.isVip = true;
		},
		methods: {
			getLocalSignLevel() {
				const levels = ['上上签', '上吉签', '中吉签', '中平签'];
				return levels[Math.floor(Math.random() * levels.length)];
			},
			getUserProfile() {
				const profile = uni.getStorageSync('user_profile');
				if (!profile || typeof profile !== 'object') {
					return null;
				}
				return {
					name: String(profile.name || '').trim(),
					gender: String(profile.gender || '').trim(),
					birthDate: String(profile.birthDate || '').trim(),
					birthHour: String(profile.birthHour || '').trim()
				};
			},
			hasCompleteProfile(profile) {
				if (!profile) return false;
				return Boolean(profile.name && profile.gender && profile.birthDate && profile.birthHour);
			},
			handleDrawSuccess(res) {
				setTimeout(() => {
					this.isShaking = false;
					this.result = { ...res.sign, recordId: res.recordId };
					this.$refs.signResult.open();
				}, 500);
			},
			requestDraw(userId, userProfile, signLevel) {
				api.drawFortune(userId, this.themeName, userProfile, signLevel).then((res) => {
					this.handleDrawSuccess(res);
				}).catch((err) => {
					this.isShaking = false;
					const errCode = err && err.code ? String(err.code) : '';
					const errMsg = err && err.message ? String(err.message).toLowerCase() : '';
					const isLimitReached = errCode === 'LIMIT_REACHED' || errMsg.includes('daily limit reached') || errMsg.includes('limit reached');

					if (isLimitReached) {
						uni.showModal({
							title: '次数已用完',
							content: '今日免费测算次数已用完，完整观看广告可额外测算1次。',
							confirmText: '看广告',
							cancelText: '稍后再来',
							success: (modalRes) => {
								if (modalRes.confirm) {
									this.watchAdForExtraDraw(userId);
								}
							}
						});
					} else {
						uni.showToast({ title: '测算失败，请重试', icon: 'none' });
					}
				});
			},
			async watchAdForExtraDraw(userId) {
				try {
					let adUnitId = getInterstitialAdUnitId();
					uni.showLoading({ title: '加载广告中...' });
					let isCompleted = false;

					try {
						isCompleted = await showInterstitialAd();
					} catch (err) {
						const errMsg = String((err && err.errMsg) || '').toLowerCase();
						const isInvalidInterstitial = errMsg.includes('adunitid is invalid') || err.errCode === 1002 || err.errorCode === 140502;
						if (!isInvalidInterstitial) throw err;

						// Fallback to rewarded video if interstitial ad unit is invalid.
						adUnitId = getRewardedAdUnitId();
						isCompleted = await showRewardedVideoAd();
					}
					uni.hideLoading();

					if (!isCompleted) {
						uni.showToast({ title: '请完整观看广告', icon: 'none' });
						return;
					}

					await api.rewardDrawChanceByAd(userId, adUnitId);
					uni.showToast({ title: '机缘已续，可再求一签', icon: 'success' });

					this.isShaking = true;
					this.requestDraw(userId);
				} catch (err) {
					uni.hideLoading();
					console.error('watchAdForExtraDraw failed:', err);
					uni.showToast({ title: '续签失败，请稍后重试', icon: 'none' });
				}
			},
			safeVibrateLong() {
				// ByteDance mini program may deny vibration capability by platform policy.
				// Skip direct vibration call to avoid noisy APIScopeError logs.
				// #ifdef MP-TOUTIAO
				return;
				// #endif

				try {
					const maybePromise = uni.vibrateLong ? uni.vibrateLong() : null;
					if (maybePromise && typeof maybePromise.catch === 'function') {
						maybePromise.catch((err) => {
							console.warn('vibrateLong denied/failed:', err);
						});
					}
				} catch (err) {
					console.warn('vibrateLong denied/failed:', err);
				}
			},
			startShake() {
				if (this.isShaking) return;
				
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				this.isShaking = true;
				this.safeVibrateLong();
				const userProfile = this.getUserProfile();
				const signLevel = this.getLocalSignLevel();

				if (!this.hasCompleteProfile(userProfile)) {
					uni.showModal({
						title: '温馨提示',
						content: '完善个人信息后再测算会更精准，是否前往填写？',
						confirmText: '去填写',
						cancelText: '继续',
						success: (modalRes) => {
							if (modalRes.confirm) {
								this.isShaking = false;
								uni.navigateTo({ url: '/pages/mine/profile' });
								return;
							}
							this.requestDraw(userInfo.id, userProfile, signLevel);
						}
					});
					return;
				}

				this.requestDraw(userInfo.id, userProfile, signLevel);
			},
			goToVip() {
				uni.navigateTo({ url: '/pages/pay/pay' });
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.draw-header {
		margin-top: 40px;
		margin-bottom: 60px;
	}

	.draw-title {
		font-size: 24px;
		font-weight: bold;
		color: #8B4513;
		letter-spacing: 2px;
	}

	.shake-area {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cylinder-wrapper {
		width: 160px;
		height: 240px;
		position: relative;
		margin-bottom: 40px;
		transition: transform 0.1s;
		
		&.shaking {
			animation: shake 0.5s infinite;
		}

		.cylinder-body {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #8B4513, #A0522D);
			border-radius: 15px 15px 60px 60px;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 15px 30px rgba(0,0,0,0.4);
			border: 6px solid #FFD700;
			position: relative;
			z-index: 2;
			
			.cylinder-text {
				font-size: 48px;
				color: #FFD700;
				font-weight: bold;
				writing-mode: vertical-rl;
				letter-spacing: 12px;
				font-family: "SimSun", serif;
			}
		}

		.sticks {
			position: absolute;
			top: -30px;
			left: 30px;
			right: 30px;
			height: 60px;
			z-index: 1;
			display: flex;
			justify-content: space-around;
			
			.stick {
				width: 8px;
				height: 70px;
				background-color: #DEB887;
				border-radius: 4px;
				transform-origin: bottom center;
				
				&:nth-child(odd) { transform: rotate(-10deg); height: 60px; }
				&:nth-child(even) { transform: rotate(10deg); }
			}
		}
	}

	@keyframes shake {
		0% { transform: rotate(0deg) translate(0, 0); }
		25% { transform: rotate(-10deg) translate(-5px, 5px); }
		50% { transform: rotate(0deg) translate(0, -5px); }
		75% { transform: rotate(10deg) translate(5px, 5px); }
		100% { transform: rotate(0deg) translate(0, 0); }
	}

	.shake-hint {
		font-size: 18px;
		color: #666;
	}
</style>