<template>
	<view class="container">
		<view class="pk-header">
			<text class="header-title">善信福运榜</text>
			<text class="header-subtitle">今日谁是天选之人</text>
		</view>

		<!-- 我的排名 -->
		<view class="my-rank-card" v-if="myRank">
			<view class="rank-info">
				<text class="rank-num">{{ myRank.rank }}</text>
				<image class="avatar" :src="myRank.avatar || '/static/male_Taoist.png'" mode="aspectFill"></image>
				<view class="user-info">
					<text class="nickname">{{ myRank.nickname || '贫道' }}</text>
					<text class="fortune-desc">{{ myRank.bestSign }}</text>
				</view>
			</view>
			<view class="score-info">
				<text class="score">{{ myRank.merit }}福分</text>
			</view>
		</view>

		<!-- 排行榜列表 -->
		<view class="rank-list">
			<view class="rank-item" v-for="(item, index) in rankList" :key="index">
				<view class="rank-left">
					<view class="rank-badge" v-if="index < 3">
						<text :class="'top-' + (index + 1)">{{ index + 1 }}</text>
					</view>
					<text class="rank-num-normal" v-else>{{ index + 1 }}</text>
					
					<image class="avatar" :src="item.avatar || '/static/male_Taoist.png'" mode="aspectFill"></image>
					<view class="user-info">
						<text class="nickname">{{ item.nickname }}</text>
						<text class="fortune-desc">{{ item.bestSign }}</text>
					</view>
				</view>
				<view class="rank-right">
					<text class="score" :class="{ 'top-score': index < 3 }">{{ item.merit }}福分</text>
				</view>
			</view>
		</view>

		<!-- 底部操作 -->
		<view class="footer-actions">
			<button class="invite-btn" open-type="share">广邀善信比拼福运</button>
		</view>
		
		<!-- 悬浮木鱼 -->
		<view class="floating-muyu" @click="goToMuyu">
			<view class="muyu-icon-wrapper">
				<view class="muyu-icon-body"></view>
				<view class="muyu-icon-stick"></view>
			</view>
			<text class="muyu-text">积福分</text>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';

	export default {
		data() {
			return {
				myRank: null,
				rankList: []
			}
		},
		onShow() {
			this.loadRanking();
		},
		onPullDownRefresh() {
			this.loadRanking();
		},
		methods: {
			formatNicknameById(id) {
				const str = id ? String(id) : '';
				if (!str) return '善信';
				const suffix = str.length <= 5 ? str : str.slice(-5);
				return `用户${suffix}`;
			},
			goToMuyu() {
				uni.navigateTo({
					url: '/pages/muyu/muyu'
				});
			},
			loadRanking() {
				const userInfo = uni.getStorageSync('userInfo');
				const dailyMerit = uni.getStorageSync('daily_merit') || 0;
				
				let syncPromise = Promise.resolve(userInfo);
				if (userInfo && userInfo.id) {
					syncPromise = api.updateMerit(userInfo.id, dailyMerit).then(res => {
						const updatedUserInfo = { ...userInfo, merit: res.merit };
						uni.setStorageSync('userInfo', updatedUserInfo);
						return updatedUserInfo;
					}).catch(() => userInfo);
				}

				syncPromise.then((latestUserInfo) => api.getRanking().then(res => {
					const rawList = Array.isArray(res.ranking) ? res.ranking : [];
					this.rankList = rawList.map(item => {
						const userId = item && (item.userId || item.id) ? (item.userId || item.id) : '';
						return {
							...item,
							userId,
							nickname: this.formatNicknameById(userId)
						};
					});
					
					// 如果已登录，计算我的排名
					if (latestUserInfo && latestUserInfo.id) {
						// 查找自己在榜单中的位置
						let myIndex = this.rankList.findIndex(item => item.userId === latestUserInfo.id);
						
						// 估算排名：如果不在前10，就显示 10+
						let rank = '10+';
						if (myIndex !== -1) {
							rank = myIndex + 1;
						}
						
						// 查找今日最佳签
						let bestSign = '暂未求签';
						if (myIndex !== -1) {
							bestSign = this.rankList[myIndex].bestSign;
						} else {
                            // 如果不在榜单中，尝试从 rankList 中找或者显示默认
                            // 这里不做额外请求了，保持简单
                        }

						const myMerit = myIndex !== -1 ? (this.rankList[myIndex].merit || 0) : (latestUserInfo.merit || dailyMerit || 0);

						this.myRank = {
							rank: rank,
							nickname: this.formatNicknameById(latestUserInfo.id),
							avatar: latestUserInfo.avatar || '/static/male_Taoist.png',
							bestSign: bestSign,
							merit: myMerit
						};
					}
					
					uni.stopPullDownRefresh();
				})).catch(err => {
					console.error('加载排行榜失败', err);
					uni.stopPullDownRefresh();
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		padding-bottom: 80px;
	}

	.pk-header {
		background-color: #DC143C;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 40px;
		border-bottom-left-radius: 30px;
		border-bottom-right-radius: 30px;
	}

	.header-title {
		font-size: 20px;
		font-weight: bold;
		color: #fff;
		margin-bottom: 5px;
	}

	.header-subtitle {
		font-size: 14px;
		color: rgba(255,255,255,0.8);
	}

	.my-rank-card {
		margin: -25px 20px 20px;
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		position: relative;
		z-index: 1;
		border: 1px solid #FFD700;
	}

	.rank-info {
		display: flex;
		align-items: center;
	}

	.rank-num {
		font-size: 18px;
		font-weight: bold;
		color: #999;
		width: 30px;
		text-align: center;
		margin-right: 10px;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 20px;
		margin-right: 10px;
		border: 1px solid #eee;
	}

	.user-info {
		display: flex;
		flex-direction: column;
	}

	.nickname {
		font-size: 14px;
		color: #333;
		font-weight: bold;
	}

	.fortune-desc {
		font-size: 12px;
		color: #666;
	}

	.score-info {
		.score {
			font-size: 18px;
			font-weight: bold;
			color: #DC143C;
		}
	}

	.rank-list {
		padding: 0 20px;
	}

	.rank-item {
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.rank-left {
		display: flex;
		align-items: center;
	}

	.rank-badge {
		width: 30px;
		text-align: center;
		margin-right: 10px;
		
		text {
			font-size: 20px;
			font-weight: bold;
			
			&.top-1 { color: #FFD700; text-shadow: 0 1px 2px rgba(0,0,0,0.2); } // 金
			&.top-2 { color: #C0C0C0; text-shadow: 0 1px 2px rgba(0,0,0,0.2); } // 银
			&.top-3 { color: #B87333; text-shadow: 0 1px 2px rgba(0,0,0,0.2); } // 铜
		}
	}

	.rank-num-normal {
		font-size: 16px;
		color: #999;
		width: 30px;
		text-align: center;
		margin-right: 10px;
	}

	.rank-right {
		.score {
			font-size: 16px;
			color: #666;
			font-weight: bold;
			
			&.top-score {
				color: #FF8C00;
			}
		}
	}

	.footer-actions {
		position: fixed;
		bottom: 20px;
		left: 0;
		right: 0;
		padding: 0 40px;
		z-index: 10;
	}

	.invite-btn {
		background-color: #DC143C;
		color: #fff;
		border-radius: 25px;
		font-size: 16px;
		box-shadow: 0 4px 12px rgba(220, 20, 60, 0.4);
	}
	
	.floating-muyu {
		position: fixed;
		right: 20px;
		bottom: 100px;
		z-index: 99;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: float 3s ease-in-out infinite;
	}
	
	@keyframes float {
		0% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
		100% { transform: translateY(0); }
	}
	
	.muyu-icon-wrapper {
		width: 50px;
		height: 45px;
		position: relative;
		margin-bottom: 5px;
	}
	
	.muyu-icon-body {
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at 30% 30%, #A0522D, #5D4037);
		border-radius: 50% 50% 45% 45%;
		border-bottom: 3px solid #3E2723;
		box-shadow: 0 4px 8px rgba(0,0,0,0.3);
		position: relative;
	}

	.muyu-icon-body::before {
		content: '';
		position: absolute;
		top: 5px;
		left: 20%;
		width: 60%;
		height: 8px;
		background: radial-gradient(ellipse at center, rgba(255,255,255,0.1), transparent);
		border-radius: 50%;
	}

	.muyu-icon-body::after {
		content: '';
		position: absolute;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 30px;
		height: 3px;
		background: #2D1B16;
		border-radius: 2px;
		box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
	}
	
	.muyu-icon-stick {
		position: absolute;
		top: -10px;
		right: -10px;
		width: 6px;
		height: 40px;
		background: #8D6E63;
		border-radius: 3px;
		transform: rotate(-30deg);
		
		&::after {
			content: '';
			position: absolute;
			top: -4px;
			left: -4px;
			width: 14px;
			height: 14px;
			background: #D7CCC8;
			border-radius: 50%;
		}
	}
	
	.muyu-text {
		font-size: 12px;
		color: #8B4513;
		font-weight: bold;
		text-shadow: 0 1px 2px rgba(255,255,255,0.8);
		background-color: rgba(255,255,255,0.8);
		padding: 2px 6px;
		border-radius: 10px;
	}
</style>
