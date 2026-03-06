<template>
	<view class="container">
		<view class="pay-header">
			<text class="header-title">香油供奉</text>
			<text class="header-desc">广结善缘，功德无量</text>
		</view>

		<!-- 功德箱 -->
		<view class="section-title">功德箱（会员套餐）</view>
		<view class="product-list">
			<view 
				class="product-item" 
				v-for="(item, index) in vipProducts" 
				:key="index"
				:class="{ active: currentVip === index }"
				@click="selectVip(index)"
			>
				<view class="tag" v-if="item.tag">{{ item.tag }}</view>
				<text class="product-name">{{ item.name }}</text>
				<view class="price-row">
					<text class="currency">¥</text>
					<text class="price">{{ item.price }}</text>
				</view>
				<text class="original-price">¥{{ item.originalPrice }}</text>
			</view>
		</view>

		<view class="privilege-list">
			<view class="privilege-item" v-for="(item, index) in privileges" :key="index">
				<uni-icons :type="item.icon" size="24" color="#8B4513"></uni-icons>
				<text class="priv-text">{{ item.text }}</text>
			</view>
		</view>

		<!-- 付费签 -->
		<view class="section-title" style="margin-top: 30px;">深度运势解读</view>
		<view class="fortune-products">
			<view class="fortune-item" v-for="(item, index) in fortuneProducts" :key="index">
				<view class="fortune-left">
					<text class="fortune-name">{{ item.name }}</text>
					<text class="fortune-desc">{{ item.desc }}</text>
				</view>
				<button class="buy-btn" @click="buyFortune(item)">¥{{ item.price }} 结缘</button>
			</view>
		</view>

		<!-- 底部支付栏 -->
		<view class="footer-pay">
			<view class="price-info">
				<text class="total-text">功德金：</text>
				<text class="total-price">¥{{ vipProducts[currentVip].price }}</text>
			</view>
			<button class="pay-btn" @click="handlePay">随喜支付</button>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';

	export default {
		data() {
			return {
				currentVip: 1,
				vipProducts: [
					{ name: '月度香火', price: '9.9', originalPrice: '19.9', tag: '', type: 'vip_monthly' },
					{ name: '年度供奉', price: '99.0', originalPrice: '199.0', tag: '功德无量', type: 'vip_yearly' },
					{ name: '终身善缘', price: '199.0', originalPrice: '399.0', tag: '福泽延绵', type: 'vip_lifetime' }
				],
				privileges: [
					{ icon: 'star-filled', text: '无限求签' },
					{ icon: 'eye-filled', text: '免除广告' },
					{ icon: 'vip-filled', text: '增量对话' },
					{ icon: 'gift-filled', text: '专属装扮' }
				],
				fortuneProducts: [
					{ name: '财运亨通签', desc: '全方位分析您的财运走势，提供投资建议', price: '3.00', type: 'fortune_wealth' },
					{ name: '事业腾飞签', desc: '针对创业者、生意人的专属运势指导', price: '5.00', type: 'fortune_business' },
					{ name: '流年运势书', desc: '万字长文深度解析全年运势', price: '12.00', type: 'fortune_yearly' }
				]
			}
		},
		methods: {
			selectVip(index) {
				this.currentVip = index;
			},
			handlePay() {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				const product = this.vipProducts[this.currentVip];
				
				uni.showLoading({ title: '随喜中...' });
				
				// 调用后端支付接口
				api.createPayment(userInfo.id, product.type, product.price).then(res => {
					uni.hideLoading();
					
					// 更新本地 VIP 状态
					uni.setStorageSync('isVip', true);
					
					// 更新本地 userInfo 对象中的 vip_level (为了保持一致性)
					const updatedUserInfo = { ...userInfo, vip_level: 1 };
					uni.setStorageSync('userInfo', updatedUserInfo);
					
					uni.showToast({ title: '结缘成功', icon: 'success' });
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({ title: '支付失败', icon: 'none' });
				});
			},
			buyFortune(item) {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				uni.showModal({
					title: '确认结缘',
					content: `确定布施 ¥${item.price} 获取 ${item.name} 吗？`,
					success: (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '祈福中...' });
							
							api.createPayment(userInfo.id, item.type, item.price).then(res => {
								uni.hideLoading();
								uni.showToast({ title: '祈福成功', icon: 'success' });
							}).catch(err => {
								uni.hideLoading();
								uni.showToast({ title: '支付失败', icon: 'none' });
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
		padding-bottom: 100px;
	}

	.pay-header {
		background-color: #333;
		padding: 30px 20px;
		color: #FFD700;
	}

	.header-title {
		font-size: 24px;
		font-weight: bold;
		display: block;
		margin-bottom: 5px;
	}

	.header-desc {
		font-size: 14px;
		color: rgba(255,215,0,0.7);
	}

	.section-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin: 20px 20px 10px;
		padding-left: 10px;
		border-left: 4px solid #DC143C;
	}

	.product-list {
		display: flex;
		justify-content: space-between;
		padding: 0 20px;
	}

	.product-item {
		width: 30%;
		background-color: #fff;
		border-radius: 8px;
		padding: 15px 5px;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		border: 2px solid transparent;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);

		&.active {
			background-color: #FFF8E1;
			border-color: #FFD700;
			
			.product-name { color: #8B4513; }
			.price { color: #DC143C; }
		}
	}

	.tag {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background-color: #DC143C;
		color: #fff;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap; // 防止文字换行
	}

	.product-name {
		font-size: 14px;
		color: #333;
		margin-bottom: 10px;
	}

	.price-row {
		display: flex;
		align-items: baseline;
		color: #333;
		margin-bottom: 5px;
	}

	.currency {
		font-size: 12px;
	}

	.price {
		font-size: 24px;
		font-weight: bold;
	}

	.original-price {
		font-size: 12px;
		color: #999;
		text-decoration: line-through;
	}

	.privilege-list {
		display: flex;
		justify-content: space-around;
		margin: 20px 20px;
		background-color: #fff;
		padding: 15px;
		border-radius: 8px;
	}

	.privilege-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.priv-text {
		font-size: 12px;
		color: #666;
		margin-top: 5px;
	}

	.fortune-products {
		padding: 0 20px;
	}

	.fortune-item {
		background-color: #fff;
		border-radius: 8px;
		padding: 15px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	.fortune-left {
		display: flex;
		flex-direction: column;
		flex: 1;
		margin-right: 10px;
	}

	.fortune-name {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 5px;
	}

	.fortune-desc {
		font-size: 12px;
		color: #999;
	}

	.buy-btn {
		background-color: #fff;
		color: #DC143C;
		border: 1px solid #DC143C;
		font-size: 12px;
		padding: 0 15px;
		height: 28px;
		line-height: 26px;
		border-radius: 14px;
		margin: 0;
	}

	.footer-pay {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
	}

	.price-info {
		display: flex;
		align-items: center;
	}

	.total-text {
		font-size: 14px;
		color: #333;
	}

	.total-price {
		font-size: 20px;
		font-weight: bold;
		color: #DC143C;
	}

	.pay-btn {
		background: linear-gradient(to right, #FFD700, #FFA500);
		color: #8B4513;
		font-size: 16px;
		font-weight: bold;
		border-radius: 20px;
		padding: 0 30px;
		height: 40px;
		line-height: 40px;
		margin: 0;
	}
</style>