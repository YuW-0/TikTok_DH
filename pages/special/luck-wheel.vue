<template>
	<view class="container">
		<view class="bg-orb orb-left"></view>
		<view class="bg-orb orb-right"></view>

		<view class="header">
			<text class="title">福分罗盘</text>
			<text class="subtitle">今日剩余抽取：{{ chances }}</text>
			<text class="subtitle">今日福分：{{ merit }}</text>
		</view>

		<view class="wheel-wrap" :class="{ spinning: spinning }">
			<view class="aura-ring"></view>
			<view class="pointer">
				<view class="pointer-dot"></view>
			</view>
			<view class="wheel" :style="wheelStyle">
				<view class="wheel-inner-ring"></view>
				<view
					class="sector"
					:class="{ 'active-sector': highlightedIndex === index }"
					v-for="(item, index) in sectors"
					:key="index"
					:style="sectorStyle(index)"
				>
					<text class="sector-label">{{ item.label }}</text>
				</view>
				<view class="center-core">
					<text>福</text>
				</view>
			</view>
		</view>

		<button class="action-btn" @click="spin" :disabled="spinning || chances <= 0">
			{{ spinning ? '转动中...' : '开始转动' }}
		</button>
		<text class="result-hint" v-if="lastGain">本次命中：+{{ lastGain }} 福分</text>
		<text class="tip">每日可转 5 次，福分自动累计。</text>
		<text class="game-disclaimer">温馨提示：此为游戏，仅供娱乐。</text>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				sectors: [
					{ label: '+2', value: 2 },
					{ label: '+4', value: 4 },
					{ label: '+6', value: 6 },
					{ label: '+8', value: 8 },
					{ label: '+10', value: 10 },
					{ label: '+12', value: 12 },
					{ label: '+15', value: 15 },
					{ label: '+20', value: 20 }
				],
				rotation: 0,
				spinning: false,
				highlightedIndex: null,
				lastGain: 0,
				chances: 5,
				merit: 0
			};
		},
		computed: {
			wheelStyle() {
				return {
					transform: `rotate(${this.rotation}deg)`
				};
			}
		},
		onLoad() {
			this.ensureDailyState();
		},
		methods: {
			ensureDailyState() {
				const today = new Date().toDateString();
				const dateKey = uni.getStorageSync('luck_wheel_date');
				if (dateKey !== today) {
					uni.setStorageSync('luck_wheel_date', today);
					uni.setStorageSync('luck_wheel_chances', 5);
				}
				this.chances = Number(uni.getStorageSync('luck_wheel_chances') || 5);
				this.merit = Number(uni.getStorageSync('daily_merit') || 0);
			},
			sectorStyle(index) {
				const step = 360 / this.sectors.length;
				const rotate = index * step;
				return {
					transform: `rotate(${rotate}deg) translateY(-102px) rotate(${-rotate}deg)`
				};
			},
			spin() {
				if (this.spinning || this.chances <= 0) return;
				this.spinning = true;
				this.highlightedIndex = null;
				const index = Math.floor(Math.random() * this.sectors.length);
				const step = 360 / this.sectors.length;
				const target = 360 - index * step;
				this.rotation += 5 * 360 + target;
				const gain = this.sectors[index].value;

				setTimeout(() => {
					this.addMerit(gain);
					this.lastGain = gain;
					this.highlightedIndex = index;
					this.chances -= 1;
					uni.setStorageSync('luck_wheel_chances', this.chances);
					this.spinning = false;
					uni.showToast({ title: `转动成功 +${gain}`, icon: 'none' });

					setTimeout(() => {
						if (!this.spinning) {
							this.highlightedIndex = null;
						}
					}, 1200);
				}, 1600);
			},
			addMerit(value) {
				const today = new Date().toDateString();
				const lastDate = uni.getStorageSync('merit_date');
				const current = lastDate === today ? Number(uni.getStorageSync('daily_merit') || 0) : 0;
				const next = current + Number(value || 0);
				uni.setStorageSync('daily_merit', next);
				uni.setStorageSync('merit_date', today);
				this.merit = next;
			}
		}
	};
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #fbf1e2 0%, #f6e1be 100%);
		padding: 16px;
		padding-bottom: 72px;
		position: relative;
		overflow: hidden;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(1px);
		opacity: 0.35;
	}

	.orb-left {
		width: 180px;
		height: 180px;
		left: -60px;
		top: 80px;
		background: radial-gradient(circle at center, #ffdfa0, transparent 72%);
	}

	.orb-right {
		width: 210px;
		height: 210px;
		right: -80px;
		bottom: 140px;
		background: radial-gradient(circle at center, #f8c37b, transparent 72%);
	}
	.header {
		background: rgba(255, 255, 255, 0.84);
		backdrop-filter: blur(2px);
		border-radius: 14px;
		padding: 16px;
		margin-bottom: 18px;
		border: 1px solid #f2deb9;
		box-shadow: 0 8px 20px rgba(150, 80, 20, 0.12);
		position: relative;
		z-index: 2;
	}
	.title {
		display: block;
		font-size: 22px;
		font-weight: bold;
		color: #7a3e0e;
		margin-bottom: 8px;
		letter-spacing: 1px;
	}
	.subtitle {
		display: block;
		font-size: 13px;
		color: #6d5c45;
		line-height: 1.7;
	}
	.wheel-wrap {
		position: relative;
		height: 350px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
	}

	.aura-ring {
		position: absolute;
		width: 300px;
		height: 300px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 232, 187, 0.7) 0%, rgba(255, 232, 187, 0) 72%);
		animation: auraPulse 2.4s ease-in-out infinite;
	}
	.pointer {
		position: absolute;
		top: 26px;
		width: 0;
		height: 0;
		border-left: 14px solid transparent;
		border-right: 14px solid transparent;
		border-top: 28px solid #c31830;
		z-index: 5;
		filter: drop-shadow(0 2px 3px rgba(130, 30, 20, 0.35));
	}

	.pointer-dot {
		position: absolute;
		top: -34px;
		left: -7px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ffe8b1;
		border: 2px solid #a14d16;
	}
	.wheel {
		width: 270px;
		height: 270px;
		border-radius: 50%;
		background: conic-gradient(#ffe9ba 0deg 45deg, #ffcf7c 45deg 90deg, #ffe9ba 90deg 135deg, #ffcf7c 135deg 180deg, #ffe9ba 180deg 225deg, #ffcf7c 225deg 270deg, #ffe9ba 270deg 315deg, #ffcf7c 315deg 360deg);
		border: 6px solid #e0ac4e;
		position: relative;
		transition: transform 1.6s cubic-bezier(0.2, 0.9, 0.2, 1);
		box-shadow: 0 10px 30px rgba(133, 78, 21, 0.28), inset 0 0 0 4px rgba(255, 239, 212, 0.7);
	}

	.wheel-inner-ring {
		position: absolute;
		top: 18px;
		left: 18px;
		right: 18px;
		bottom: 18px;
		border-radius: 50%;
		border: 2px dashed rgba(139, 69, 19, 0.4);
	}
	.sector {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
		width: 44px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.sector-label {
		font-size: 15px;
		font-weight: bold;
		color: #7f3608;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.active-sector .sector-label {
		color: #b4101f;
		text-shadow: 0 0 8px rgba(255, 251, 204, 0.95), 0 0 14px rgba(214, 56, 34, 0.6);
		animation: sectorFlash 0.35s ease-in-out 3;
	}

	.center-core {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 68px;
		height: 68px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #fff2cf, #e4ab4f);
		border: 3px solid #b86f25;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 10px rgba(146, 82, 18, 0.2);
		text {
			font-size: 30px;
			font-weight: bold;
			color: #9e2f1d;
			line-height: 1;
		}
	}
	.action-btn {
		margin-top: 10px;
		background: linear-gradient(90deg, #d1361d, #b81733);
		color: #fff;
		border-radius: 26px;
		font-size: 16px;
		box-shadow: 0 8px 16px rgba(173, 35, 30, 0.28);
		border: 1px solid rgba(255, 255, 255, 0.35);
	}
	.tip {
		display: block;
		font-size: 12px;
		color: #806a56;
		text-align: center;
		margin-top: 12px;
	}

	.result-hint {
		display: block;
		font-size: 13px;
		color: #ad1e24;
		font-weight: bold;
		text-align: center;
		margin-top: 10px;
	}

	.game-disclaimer {
		position: fixed;
		left: 20px;
		right: 20px;
		bottom: 20px;
		font-size: 11px;
		line-height: 1.5;
		color: #8f7e6c;
		text-align: center;
		z-index: 6;
	}

	@keyframes auraPulse {
		0% { transform: scale(0.96); opacity: 0.35; }
		50% { transform: scale(1.02); opacity: 0.52; }
		100% { transform: scale(0.96); opacity: 0.35; }
	}

	@keyframes sectorFlash {
		0% { transform: scale(1); }
		50% { transform: scale(1.18); }
		100% { transform: scale(1); }
	}
</style>
