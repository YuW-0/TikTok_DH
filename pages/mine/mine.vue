<template>
	<view class="container">
		<!-- 顶部用户信息 -->
		<view class="user-header">
			<view class="user-info">
				<image class="avatar" :src="displayAvatar" mode="aspectFill"></image>
				<view class="info-right">
					<view class="name-row">
						<text class="nickname">{{ displayName }}</text>
						<view class="edit-name-btn" @click="openEditNickname">
							<uni-icons type="compose" size="16" color="#fff"></uni-icons>
						</view>
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
					title="隐私政策" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'info'}" 
					link
					clickable
					@click="goToPrivacy"
				/>
				<uni-list-item 
					title="用户协议" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'compose'}" 
					link
					clickable
					@click="goToTerms"
				/>
				<uni-list-item 
					title="账号注销" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'trash'}" 
					link
					clickable
					@click="applyDeleteAccount"
				/>
				<uni-list-item 
					title="联系客服" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'headphones'}" 
					link
					clickable
					@click="contactService"
				/>
			</uni-list>
		</view>
		
		<view class="version-info">
			<text>当前版本 1.0.0</text>
		</view>

		<view class="edit-modal-mask" v-if="editModalVisible">
			<view class="edit-modal">
				<view class="edit-title">编辑昵称</view>
				<input
					class="edit-input"
					v-model="editName"
					maxlength="20"
					placeholder="支持中英文/数字/下划线，最多20字"
					placeholder-class="edit-placeholder"
				/>
				<view class="edit-actions">
					<view class="edit-btn cancel" @click="closeEditModal">取消</view>
					<view class="edit-btn confirm" @click="saveNickname">保存</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';

	export default {
		data() {
			return {
				isVip: false,
				userInfo: null,
				editModalVisible: false,
				editName: '',
				savingNickname: false
			}
		},
		computed: {
			displayAvatar() {
				return (this.userInfo && this.userInfo.avatar) ? this.userInfo.avatar : '/static/male_Taoist.png';
			},
			displayName() {
				const nickname = this.userInfo && this.userInfo.nickname ? String(this.userInfo.nickname).trim() : '';
				if (nickname) return nickname;
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
			openEditNickname() {
				if (!this.userInfo || !this.userInfo.id) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}
				this.editName = this.userInfo.nickname ? String(this.userInfo.nickname) : '';
				this.editModalVisible = true;
			},
			closeEditModal() {
				if (this.savingNickname) return;
				this.editModalVisible = false;
			},
			saveNickname() {
				if (this.savingNickname) return;

				const name = String(this.editName || '').trim();
				const nicknamePattern = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
				if (!name) {
					uni.showToast({ title: '昵称不能为空', icon: 'none' });
					return;
				}
				if (name.length > 20) {
					uni.showToast({ title: '昵称最多20字', icon: 'none' });
					return;
				}
				if (!nicknamePattern.test(name)) {
					uni.showToast({ title: '仅支持中英文、数字、下划线', icon: 'none' });
					return;
				}

				this.savingNickname = true;
				api.updateNickname(this.userInfo.id, name).then((res) => {
					const updatedUser = { ...(this.userInfo || {}), ...(res.user || {}), nickname: name };
					this.userInfo = updatedUser;
					uni.setStorageSync('userInfo', updatedUser);
					this.editModalVisible = false;
					uni.showToast({ title: '昵称已更新', icon: 'success' });
				}).catch(() => {
					uni.showToast({ title: '更新失败，请重试', icon: 'none' });
				}).finally(() => {
					this.savingNickname = false;
				});
			},
			goToPay() {
				uni.showToast({
					title: '供奉香火入口暂未开放',
					icon: 'none'
				});
			},
			goToHistory() {
				uni.navigateTo({
					url: '/pages/mine/history'
				});
			},
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
			applyDeleteAccount() {
				uni.showModal({
					title: '账号注销申请',
					content: '为保障您的权益，请联系客服提交注销申请。申请通过后将清除账号及相关数据。',
					confirmText: '联系客服',
					cancelText: '暂不处理',
					success: (res) => {
						if (res.confirm) {
							this.contactService();
						}
					}
				});
			},
			contactService() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
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
		padding: 20px 20px 60px;
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
		margin-right: 6px;
	}

	.edit-name-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background-color: rgba(255, 255, 255, 0.2);
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

	.edit-modal-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.edit-modal {
		width: 300px;
		background-color: #fff;
		border-radius: 12px;
		padding: 18px 16px;
	}

	.edit-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 12px;
		text-align: center;
	}

	.edit-input {
		height: 40px;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 0 10px;
		font-size: 14px;
		margin-bottom: 14px;
	}

	.edit-placeholder {
		font-size: 13px;
		color: #bbb;
	}

	.edit-actions {
		display: flex;
		justify-content: space-between;
	}

	.edit-btn {
		width: 48%;
		height: 36px;
		line-height: 36px;
		text-align: center;
		font-size: 14px;
		border-radius: 8px;
	}

	.edit-btn.cancel {
		background-color: #f2f2f2;
		color: #666;
	}

	.edit-btn.confirm {
		background-color: #DC143C;
		color: #fff;
	}
</style>
