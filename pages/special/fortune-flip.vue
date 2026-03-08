<template>
	<view class="container">
		<view class="header">
			<text class="title">福袋翻翻乐</text>
			<text class="subtitle">今日剩余次数：{{ chances }}</text>
			<text class="subtitle">今日福分：{{ merit }}</text>
		</view>

		<view class="grid">
			<view
				class="card"
				:class="{ opened: openedIndex === index, disabled: openedIndex !== null || chances <= 0 }"
				v-for="(item, index) in cards"
				:key="index"
				@click="openBag(index)"
			>
				<text v-if="openedIndex === index" class="reward">+{{ rewardList[index] }}</text>
				<view v-else class="bag-icon" aria-label="福袋">
					<view class="bag-knot"></view>
					<view class="bag-mouth"></view>
					<view class="bag-body">
						<text class="bag-fu">福</text>
					</view>
				</view>
			</view>
		</view>

		<button class="action-btn" @click="nextRound" :disabled="openedIndex === null || chances <= 0">下一轮</button>
		<text class="tip">每天可翻 3 次，每次翻中即刻计入福分。</text>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				cards: Array.from({ length: 9 }),
				rewardList: [],
				openedIndex: null,
				chances: 3,
				merit: 0
			};
		},
		onLoad() {
			this.ensureDailyState();
			this.createRoundRewards();
		},
		methods: {
			ensureDailyState() {
				const today = new Date().toDateString();
				const dateKey = uni.getStorageSync('fortune_flip_date');
				if (dateKey !== today) {
					uni.setStorageSync('fortune_flip_date', today);
					uni.setStorageSync('fortune_flip_chances', 3);
				}
				this.chances = Number(uni.getStorageSync('fortune_flip_chances') || 3);
				this.merit = Number(uni.getStorageSync('daily_merit') || 0);
			},
			createRoundRewards() {
				const pool = [6, 8, 10, 12, 15, 18];
				this.rewardList = this.cards.map(() => pool[Math.floor(Math.random() * pool.length)]);
				this.openedIndex = null;
			},
			openBag(index) {
				if (this.openedIndex !== null || this.chances <= 0) return;
				this.openedIndex = index;
				const gain = this.rewardList[index] || 0;
				this.addMerit(gain);
				this.chances -= 1;
				uni.setStorageSync('fortune_flip_chances', this.chances);
				uni.showToast({ title: `福分 +${gain}`, icon: 'none' });
			},
			nextRound() {
				if (this.chances <= 0) {
					uni.showToast({ title: '今日次数已用完', icon: 'none' });
					return;
				}
				this.createRoundRewards();
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
		background: #faf0e6;
		padding: 16px;
	}
	.header {
		background: #fff;
		border-radius: 12px;
		padding: 14px;
		margin-bottom: 14px;
	}
	.title {
		display: block;
		font-size: 20px;
		font-weight: bold;
		color: #8b4513;
		margin-bottom: 6px;
	}
	.subtitle {
		display: block;
		font-size: 13px;
		color: #666;
		line-height: 1.7;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 10px;
	}
	.card {
		height: 96px;
		border-radius: 10px;
		background: linear-gradient(135deg, #ffe6ad, #ffd26f);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #e7bb61;
	}
	.card.opened {
		background: linear-gradient(135deg, #fff9ef, #fff);
	}
	.card.disabled {
		opacity: 0.9;
	}
	.bag-icon {
		position: relative;
		width: 54px;
		height: 60px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		animation: bagSway 2.2s ease-in-out infinite;
	}

	.bag-knot {
		width: 20px;
		height: 10px;
		border-radius: 8px;
		background: #a94413;
		margin-bottom: 2px;
	}

	.bag-mouth {
		width: 38px;
		height: 8px;
		border-radius: 10px;
		background: linear-gradient(180deg, #f9d483, #eebf60);
		border: 1px solid #d69d43;
		margin-bottom: -2px;
		z-index: 2;
	}

	.bag-body {
		width: 52px;
		height: 42px;
		background: radial-gradient(circle at 30% 25%, #ffd98f, #efbb58 70%);
		border: 1px solid #d79d3c;
		border-radius: 38% 38% 46% 46%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 -4px 8px rgba(128, 72, 12, 0.2);
		position: relative;
		overflow: hidden;
	}

	.bag-body::after {
		content: '';
		position: absolute;
		top: -8px;
		left: -24px;
		width: 16px;
		height: 58px;
		background: rgba(255, 255, 255, 0.45);
		transform: rotate(20deg);
		animation: bagShimmer 2.6s ease-in-out infinite;
	}

	.bag-fu {
		font-size: 18px;
		font-weight: bold;
		color: #b12318;
		transform: rotate(-8deg);
		z-index: 1;
	}

	@keyframes bagSway {
		0% { transform: rotate(0deg); }
		25% { transform: rotate(-4deg); }
		50% { transform: rotate(0deg); }
		75% { transform: rotate(4deg); }
		100% { transform: rotate(0deg); }
	}

	@keyframes bagShimmer {
		0% { left: -24px; opacity: 0; }
		20% { opacity: 0.7; }
		55% { left: 58px; opacity: 0; }
		100% { left: 58px; opacity: 0; }
	}
	.reward {
		font-size: 22px;
		font-weight: bold;
		color: #dc143c;
	}
	.action-btn {
		margin-top: 16px;
		background: #dc143c;
		color: #fff;
		border-radius: 24px;
	}
	.tip {
		display: block;
		font-size: 12px;
		color: #888;
		text-align: center;
		margin-top: 10px;
	}
</style>
