<template>
	<view class="container">
		<view class="menu-list">
			<uni-list>
				<uni-list-item
					title="隐私政策"
					show-extra-icon
					:extra-icon="{ color: '#DC143C', size: '22', type: 'info' }"
					link
					clickable
					@click="goToPrivacy"
				/>
				<uni-list-item
					title="用户协议"
					show-extra-icon
					:extra-icon="{ color: '#DC143C', size: '22', type: 'compose' }"
					link
					clickable
					@click="goToTerms"
				/>
				<uni-list-item
					title="退出登录"
					show-extra-icon
					:extra-icon="{ color: '#DC143C', size: '22', type: 'closeempty' }"
					link
					clickable
					@click="logout"
				/>
			</uni-list>
		</view>
	</view>
</template>

<script>
	export default {
		methods: {
			goToPrivacy() {
				uni.navigateTo({
					url: '/pages/legal/privacy'
				});
			},
			goToTerms() {
				uni.navigateTo({
					url: '/pages/legal/terms'
				});
			},
			logout() {
				uni.showModal({
					title: '退出登录',
					content: '确定退出当前账号吗？',
					confirmText: '退出',
					cancelText: '取消',
					success: (res) => {
						if (!res.confirm) return;
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('isVip');
						uni.showToast({ title: '已退出登录', icon: 'none' });
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/home/home'
							});
						}, 120);
					}
				});
			}
		}
	};
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		padding-top: 16px;
	}

	.menu-list {
		padding: 0 20px;

		::v-deep .uni-list {
			border-radius: 12px;
			overflow: hidden;
		}
	}
</style>
