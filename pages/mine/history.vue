<template>
	<view class="container">
		<text class="swipe-tip" v-if="records.length > 0">温馨提示：左滑历史记录可显示删除按钮。</text>
		<view class="history-list" v-if="records.length > 0">
			<uni-swipe-action>
				<uni-swipe-action-item
					v-for="(item, index) in records"
					:key="item.id || index"
					:right-options="swipeOptions"
					@click="onSwipeActionClick($event, item, index)"
				>
					<view
						class="history-item"
						@click="handleItemTap(item)"
						@touchstart="onItemTouchStart"
						@touchmove="onItemTouchMove"
						@touchend="onItemTouchEnd"
						:class="{ 'has-interpretation': item.ai_interpretations }"
					>
						<view class="item-header">
							<text class="item-date">{{ formatDate(item.created_at) }}</text>
							<view class="header-right">
								<view class="interpret-tag" v-if="item.ai_interpretations">
									<uni-icons type="vip-filled" size="12" color="#fff"></uni-icons>
									<text>大师亲批</text>
								</view>
								<text class="item-theme">{{ item.theme }}</text>
							</view>
						</view>
						<view class="item-content">
							<view class="sign-info">
								<text class="sign-level">{{ getFortuneSign(item).sign_level || getFortuneSign(item).signLevel }}</text>
								<text class="sign-title">{{ getFortuneSign(item).sign_title || getFortuneSign(item).signTitle }}</text>
							</view>
							<text class="sign-text">{{ getFortuneSign(item).sign_text || getFortuneSign(item).signText }}</text>
						</view>
					</view>
				</uni-swipe-action-item>
			</uni-swipe-action>
		</view>
		<view class="empty-state" v-else>
			<uni-icons type="calendar" size="60" color="#D2B48C"></uni-icons>
			<text class="empty-text">暂无测算记录</text>
		</view>

		<!-- 签文详情弹窗 -->
		<sign-result ref="signResult" :sign="currentSign" :isVip="isVip"></sign-result>
	</view>
</template>

<script>
	import api from '@/utils/api.js';
	import SignResult from '@/components/sign-result/sign-result.vue';

	export default {
		components: {
			SignResult
		},
		data() {
			return {
				records: [],
				currentSign: {},
				isVip: false,
				deletingRecordId: '',
				isSwipingItem: false,
				swipeOptions: [
					{
						text: '删除',
						style: {
							backgroundColor: '#DC143C',
							color: '#fff'
						}
					}
				]
			}
		},
		onShow() {
			this.loadHistory();
			const vipStatus = uni.getStorageSync('isVip');
			if (vipStatus) this.isVip = true;
		},
		onPullDownRefresh() {
			this.loadHistory();
		},
		methods: {
			onItemTouchStart() {
				this.isSwipingItem = false;
			},
			onItemTouchMove() {
				this.isSwipingItem = true;
			},
			onItemTouchEnd() {
				setTimeout(() => {
					this.isSwipingItem = false;
				}, 80);
			},
			handleItemTap(item) {
				if (this.isSwipingItem) return;
				this.showDetail(item);
			},
			getFortuneSign(item = {}) {
				const raw = item.fortune_signs;
				if (Array.isArray(raw)) return raw[0] || {};
				return raw || {};
			},
			normalizeHistorySign(item = {}) {
				const sign = this.getFortuneSign(item);
				return {
					sign_title: sign.sign_title || sign.signTitle || sign.title || '',
					sign_level: sign.sign_level || sign.signLevel || sign.level || '',
					sign_text: sign.sign_text || sign.signText || sign.text || '',
					basic_interpretation: sign.basic_interpretation || sign.basicInterpretation || sign.interpretation || '',
					full_interpretation: sign.full_interpretation || sign.fullInterpretation || '',
					theme: item.theme || sign.theme || '综合',
					ai_interpretations: item.ai_interpretations || sign.ai_interpretations || null,
					recordId: item.id || sign.id
				};
			},
			loadHistory() {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) return;

				api.getFortuneHistory(userInfo.id).then(res => {
					this.records = res.records;
					uni.stopPullDownRefresh();
				}).catch(err => {
					console.error('加载历史失败', err);
					uni.stopPullDownRefresh();
					// 如果是 404 或数据为空，不弹窗报错
					if (err && err.records === undefined) {
						uni.showToast({
							title: '加载失败',
							icon: 'none'
						});
					}
				});
			},
			showDetail(item) {
				this.currentSign = this.normalizeHistorySign(item);
				this.$nextTick(() => {
					this.$refs.signResult && this.$refs.signResult.open();
				});
			},
			onSwipeActionClick(e, item, index) {
				const actionIndex = e && e.index !== undefined ? Number(e.index) : 0;
				if (actionIndex !== 0) return;
				this.confirmDeleteRecord(item, index);
			},
			confirmDeleteRecord(item, index) {
				if (!item || !item.id) return;
				if (this.deletingRecordId) return;

				uni.showModal({
					title: '删除记录',
					content: '确认删除这条历史签文吗？删除后不可恢复。',
					confirmText: '删除',
					cancelText: '取消',
					success: (res) => {
						if (!res.confirm) return;
						this.deleteRecord(item.id, index);
					}
				});
			},
			deleteRecord(recordId, index) {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo || !userInfo.id) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}
				this.deletingRecordId = recordId;
				api.deleteFortuneHistory(userInfo.id, recordId).then(() => {
					this.records.splice(index, 1);
					uni.showToast({ title: '已删除', icon: 'success' });
				}).catch(() => {
					uni.showToast({ title: '删除失败，请重试', icon: 'none' });
				}).finally(() => {
					this.deletingRecordId = '';
				});
			},
			formatDate(dateStr) {
				const date = new Date(dateStr);
				return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		padding: 20px;
		box-sizing: border-box;
	}

	.history-list {
		width: 100%;
	}

	.swipe-tip {
		display: block;
		font-size: 12px;
		line-height: 1.6;
		color: #9c8a7a;
		margin: 2px 2px 10px;
	}

	::v-deep .uni-swipe {
		width: 100%;
		margin-bottom: 12px;
	}

	::v-deep .uni-swipe_box {
		width: 100%;
	}

	::v-deep .button-group--right {
		right: -2px;
	}

	::v-deep .uni-swipe_text--wrapper {
		display: flex;
		align-items: stretch;
	}

	::v-deep .uni-swipe_button {
		height: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 72px;
	}

	.history-item {
		width: 100%;
		box-sizing: border-box;
		background-color: #fff;
		border-radius: 12px;
		padding: 15px;
		margin-bottom: 0;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
		border-left: 4px solid #D2B48C; // 默认普通签文颜色
		position: relative;
		overflow: hidden;
		transition: all 0.3s;
		
		&.has-interpretation {
			background: linear-gradient(135deg, #FFFBF0 0%, #F3E5F5 100%);
			border-left: 4px solid #8A2BE2; // 大师解读紫色
			box-shadow: 0 4px 15px rgba(138, 43, 226, 0.15);
			
			// 添加装饰性水印或纹理
			&::before {
				content: '大师亲批';
				position: absolute;
				right: -10px;
				bottom: -10px;
				font-size: 60px;
				color: rgba(138, 43, 226, 0.05);
				font-family: "LiSu", "SimSun", serif;
				pointer-events: none;
				transform: rotate(-15deg);
				z-index: 0;
			}
		}
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		padding-bottom: 10px;
		border-bottom: 1px dashed #eee;
	}
	
	.header-right {
		display: flex;
		align-items: center;
	}
	
	.interpret-tag {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #8A2BE2, #4B0082);
		padding: 2px 8px;
		border-radius: 10px;
		margin-right: 8px;
		
		text {
			font-size: 10px;
			color: #fff;
			margin-left: 2px;
		}
	}

	.item-date {
		font-size: 12px;
		color: #999;
	}

	.item-theme {
		font-size: 12px;
		color: #8B4513;
		font-weight: bold;
		background-color: #FFF8E1;
		padding: 2px 8px;
		border-radius: 10px;
	}

	.item-content {
		display: flex;
		flex-direction: column;
	}

	.sign-info {
		display: flex;
		align-items: center;
		margin-bottom: 5px;
	}

	.sign-level {
		font-size: 16px;
		font-weight: bold;
		color: #DC143C;
		margin-right: 10px;
	}

	.sign-title {
		font-size: 14px;
		color: #666;
	}

	.sign-text {
		font-size: 14px;
		color: #333;
		line-height: 1.5;
		font-family: "SimSun", serif;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-top: 100px;
	}

	.empty-text {
		font-size: 14px;
		color: #999;
		margin-top: 10px;
	}
</style>