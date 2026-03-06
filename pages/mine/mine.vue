<template>
	<view class="container">
		<!-- 顶部用户信息 -->
		<view class="user-header">
			<view class="user-info">
				<image class="avatar" :src="displayAvatar" mode="aspectFill"></image>
				<view class="info-right">
					<view class="name-row">
						<text class="nickname">{{ displayName }}</text>
						<view class="vip-tag" v-if="isVip">
							<text class="vip-text">功德主</text>
						</view>
					</view>
				</view>
			</view>
			<view class="vip-card" @click="goToPay">
				<view class="vip-left">
					<text class="vip-title">{{ isVip ? '尊贵功德主' : '供奉香火' }}</text>
					<text class="vip-desc">{{ isVip ? '福泽延绵，功德无量' : '广结善缘，解锁更多特权' }}</text>
				</view>
				<button class="vip-btn">{{ isVip ? '续缘' : '立即供奉' }}</button>
			</view>
		</view>

		<!-- 功能列表 -->
		<view class="menu-list">
			<uni-list>
				<uni-list-item 
					title="我的求签历史" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'list'}" 
					link
					clickable
					@click="goToHistory"
				/>
				<uni-list-item 
					title="我的运势报告" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'calendar-filled'}" 
					link
				/>
				<uni-list-item 
					title="联系客服" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'headphones'}" 
					link
					clickable
					@click="contactService"
				/>
				<uni-list-item 
					title="设置" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'gear'}" 
					link
					clickable
					@click="clearData"
				/>
			</uni-list>
		</view>
		
		<view class="version-info">
			<text>当前版本 1.0.0</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isVip: false,
				userInfo: null
			}
		},
		computed: {
			displayAvatar() {
				return (this.userInfo && this.userInfo.avatar) ? this.userInfo.avatar : '/static/male_Taoist.png';
			},
			displayName() {
				const id = this.userInfo && this.userInfo.id ? String(this.userInfo.id) : '';
				if (!id) return '善信';
				const suffix = id.length <= 5 ? id : id.slice(-5);
				return `用户${suffix}`;
			}
		},
		onShow() {
			this.userInfo = uni.getStorageSync('userInfo') || null;
			// 每次显示页面时检查VIP状态
			const vipStatus = uni.getStorageSync('isVip');
			if (vipStatus) {
				this.isVip = true;
			}
		},
		methods: {
			goToPay() {
				uni.navigateTo({
					url: '/pages/pay/pay'
				});
			},
			goToHistory() {
				uni.navigateTo({
					url: '/pages/mine/history'
				});
			},
			contactService() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},
			clearData() {
				uni.showModal({
					title: '清除数据',
					content: '确定要清除所有本地数据（包括VIP状态）并重新演示吗？',
					success: (res) => {
						if (res.confirm) {
							uni.clearStorageSync();
							this.isVip = false;
							uni.showToast({
								title: '数据已清除',
								icon: 'success'
							});
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
	}

	.user-header {
		background-color: #DC143C;
		padding: 20px 20px 60px; // 底部留出空间给VIP卡片
		position: relative;
		margin-bottom: 40px;
	}

	.user-info {
		display: flex;
		align-items: center;
		margin-bottom: 20px;
	}

	.avatar {
		width: 60px;
		height: 60px;
		border-radius: 30px;
		border: 2px solid #fff;
		margin-right: 15px;
	}

	.info-right {
		display: flex;
		flex-direction: column;
	}

	.name-row {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
	}

	.nickname {
		font-size: 18px;
		font-weight: bold;
		color: #fff;
		margin-right: 10px;
	}

	.vip-tag {
		background-color: #FFD700;
		padding: 2px 8px;
		border-radius: 10px;
		
		.vip-text {
			font-size: 10px;
			color: #8B4513;
			font-weight: bold;
		}
	}

	.user-id {
		font-size: 12px;
		color: rgba(255,255,255,0.8);
	}

	.vip-card {
		position: absolute;
		bottom: -30px;
		left: 20px;
		right: 20px;
		height: 70px;
		background: linear-gradient(to right, #333, #555);
		border-radius: 12px;
		padding: 0 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 4px 12px rgba(0,0,0,0.2);
		color: #FFD700;
	}

	.vip-left {
		display: flex;
		flex-direction: column;
	}

	.vip-title {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 4px;
	}

	.vip-desc {
		font-size: 12px;
		color: rgba(255,215,0,0.7);
	}

	.vip-btn {
		background: linear-gradient(to right, #FFD700, #FFA500);
		color: #8B4513;
		font-size: 12px;
		font-weight: bold;
		border-radius: 15px;
		padding: 0 15px;
		line-height: 28px;
		height: 28px;
		margin: 0;
	}

	.menu-list {
		padding: 0 20px;
		
		// 覆盖uni-list样式以适配圆角
		::v-deep .uni-list {
			border-radius: 12px;
			overflow: hidden;
		}
	}

	.version-info {
		margin-top: 30px;
		text-align: center;
		
		text {
			font-size: 12px;
			color: #999;
		}
	}
</style>
