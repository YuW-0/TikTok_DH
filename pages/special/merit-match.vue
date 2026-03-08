<template>
	<view class="container">
		<view class="header">
			<text class="title">功德连连看</text>
			<text class="subtitle">已配对：{{ matchedCount }}/6</text>
			<text class="subtitle">今日福分：{{ merit }}</text>
		</view>

		<view class="board">
			<view
				class="cell"
				:class="{ open: card.open || card.matched }"
				v-for="(card, index) in cards"
				:key="index"
				@click="flipCard(index)"
			>
				<text v-if="card.open || card.matched">{{ card.symbol }}</text>
				<text v-else>?</text>
			</view>
		</view>

		<button class="action-btn" @click="resetBoard">重开一局</button>
		<text class="tip">每配对成功一次 +3 福分，全部完成额外 +12。</text>
		<text class="game-disclaimer">温馨提示：此为游戏，仅供娱乐。</text>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				cards: [],
				openedIndexes: [],
				lock: false,
				merit: 0,
				matchedCount: 0,
				rewardedFinish: false
			};
		},
		onLoad() {
			this.merit = Number(uni.getStorageSync('daily_merit') || 0);
			this.resetBoard();
		},
		methods: {
			resetBoard() {
				const symbols = ['福', '禄', '寿', '喜', '财', '吉'];
				const merged = symbols.concat(symbols)
					.map((symbol) => ({ symbol, open: false, matched: false }))
					.sort(() => Math.random() - 0.5);
				this.cards = merged;
				this.openedIndexes = [];
				this.lock = false;
				this.matchedCount = 0;
				this.rewardedFinish = false;
			},
			flipCard(index) {
				if (this.lock) return;
				const card = this.cards[index];
				if (!card || card.open || card.matched) return;

				card.open = true;
				this.openedIndexes.push(index);

				if (this.openedIndexes.length < 2) return;

				this.lock = true;
				const [firstIndex, secondIndex] = this.openedIndexes;
				const first = this.cards[firstIndex];
				const second = this.cards[secondIndex];

				if (first.symbol === second.symbol) {
					first.matched = true;
					second.matched = true;
					this.matchedCount += 1;
					this.addMerit(3);
					this.openedIndexes = [];
					this.lock = false;
					if (this.matchedCount === 6 && !this.rewardedFinish) {
						this.rewardedFinish = true;
						this.addMerit(12);
						uni.showToast({ title: '全消成功，额外+12福分', icon: 'none' });
					}
					return;
				}

				setTimeout(() => {
					first.open = false;
					second.open = false;
					this.openedIndexes = [];
					this.lock = false;
				}, 550);
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
		padding-bottom: 72px;
		position: relative;
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
	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-gap: 10px;
	}
	.cell {
		height: 92px;
		border-radius: 10px;
		background: #d2b48c;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30px;
		font-weight: bold;
		color: #fff;
	}
	.cell.open {
		background: #fff;
		color: #8b4513;
		border: 1px solid #e8d7b6;
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

	.game-disclaimer {
		position: fixed;
		left: 20px;
		right: 20px;
		bottom: 20px;
		font-size: 11px;
		line-height: 1.5;
		color: #8f7e6c;
		text-align: center;
	}
</style>
