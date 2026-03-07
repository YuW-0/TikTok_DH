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

		<view class="token-panel">
			<view class="token-header">
				<text class="token-title">我的{{ tokenName }}</text>
				<text class="token-balance">{{ tokenBalance }}</text>
			</view>
			<view class="invite-row">
				<text class="invite-label">我的邀请码：{{ inviteCode || '生成中' }}</text>
				<view class="invite-copy" @click="copyInviteCode">复制</view>
			</view>
			<view class="token-actions">
				<view class="token-action" @click="doDailyCheckin">
					<uni-icons type="calendar-filled" size="18" color="#8B4513"></uni-icons>
					<text>{{ canCheckin ? '每日签到' : '今日已签' }}</text>
				</view>
				<view class="token-action" @click="openInviteModal">
					<uni-icons type="paperplane-filled" size="18" color="#8B4513"></uni-icons>
					<text>{{ invitedBy ? '已绑定上级' : '绑定邀请码' }}</text>
				</view>
				<view class="token-action" @click="watchAdForToken">
					<uni-icons type="gift-filled" size="18" color="#8B4513"></uni-icons>
					<text>看广告得{{ tokenName }}</text>
				</view>
			</view>
			<text class="token-tip">邀请好友并绑定关系后，好友签到/广告奖励将为您带来少量{{ tokenName }}提成；今日广告奖励剩余 {{ adRewardRemain }} 次。</text>
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
					title="设置" 
					show-extra-icon 
					:extra-icon="{color: '#DC143C', size: '22', type: 'gear-filled'}" 
					link
					clickable
					@click="goToSettings"
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

		<view class="edit-modal-mask" v-if="inviteModalVisible">
			<view class="edit-modal">
				<view class="edit-title">绑定邀请码</view>
				<input
					class="edit-input"
					v-model="inviteCodeInput"
					maxlength="12"
					placeholder="请输入好友邀请码"
					placeholder-class="edit-placeholder"
				/>
				<view class="edit-actions">
					<view class="edit-btn cancel" @click="closeInviteModal">取消</view>
					<view class="edit-btn confirm" @click="bindInviteCodeAction">绑定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';
	import { showRewardedVideoAd, getRewardedAdUnitId } from '@/utils/ad.js';

	export default {
		data() {
			return {
				isVip: false,
				userInfo: null,
				editModalVisible: false,
				editName: '',
				savingNickname: false,
				tokenName: '福缘珠',
				tokenBalance: 0,
				inviteCode: '',
				invitedBy: null,
				canCheckin: false,
				adRewardRemain: 0,
				inviteModalVisible: false,
				inviteCodeInput: '',
				tokenLoading: false
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
			this.loadTokenStatus();
		},
		methods: {
			loadTokenStatus() {
				if (!this.userInfo || !this.userInfo.id) return;
				api.getTokenStatus(this.userInfo.id).then((res) => {
					this.tokenName = res.tokenName || '福缘珠';
					this.tokenBalance = Number(res.balance) || 0;
					this.inviteCode = res.inviteCode || '';
					this.invitedBy = res.invitedBy || null;
					this.canCheckin = Boolean(res.canCheckin);
					this.adRewardRemain = Number(res.adRewardRemain) || 0;
				}).catch(() => {});
			},
			doDailyCheckin() {
				if (!this.userInfo || !this.userInfo.id || this.tokenLoading) return;
				this.tokenLoading = true;
				api.checkinToken(this.userInfo.id).then((res) => {
					const reward = Number(res.reward) || 0;
					uni.showToast({ title: `签到成功 +${reward}${this.tokenName}`, icon: 'none' });
					this.loadTokenStatus();
				}).catch((err) => {
					if (String(err.code || '') === 'ALREADY_CHECKED_IN') {
						uni.showToast({ title: '今日已签到', icon: 'none' });
						return;
					}
					uni.showToast({ title: '签到失败，请稍后重试', icon: 'none' });
				}).finally(() => {
					this.tokenLoading = false;
				});
			},
			copyInviteCode() {
				if (!this.inviteCode) {
					uni.showToast({ title: '邀请码生成中', icon: 'none' });
					return;
				}
				uni.setClipboardData({
					data: this.inviteCode,
					success: () => {
						uni.showToast({ title: '邀请码已复制', icon: 'none' });
					}
				});
			},
			openInviteModal() {
				this.inviteCodeInput = '';
				this.inviteModalVisible = true;
			},
			closeInviteModal() {
				if (this.tokenLoading) return;
				this.inviteModalVisible = false;
			},
			bindInviteCodeAction() {
				if (!this.userInfo || !this.userInfo.id || this.tokenLoading) return;
				const code = String(this.inviteCodeInput || '').trim().toUpperCase();
				if (!code) {
					uni.showToast({ title: '请输入邀请码', icon: 'none' });
					return;
				}
				this.tokenLoading = true;
				api.bindInviteCode(this.userInfo.id, code).then((res) => {
					uni.showToast({ title: `绑定成功 +${res.rewardInvitee || 0}${this.tokenName}`, icon: 'none' });
					this.inviteModalVisible = false;
					this.loadTokenStatus();
				}).catch((err) => {
					const codeName = String(err.code || '');
					if (codeName === 'INVITE_ALREADY_BOUND') {
						uni.showToast({ title: '您已绑定过邀请码', icon: 'none' });
					} else if (codeName === 'INVITE_CODE_INVALID') {
						uni.showToast({ title: '邀请码无效', icon: 'none' });
					} else if (codeName === 'INVITE_SELF_BIND') {
						uni.showToast({ title: '不能绑定自己的邀请码', icon: 'none' });
					} else {
						uni.showToast({ title: '绑定失败，请稍后重试', icon: 'none' });
					}
				}).finally(() => {
					this.tokenLoading = false;
				});
			},
			watchAdForToken() {
				if (!this.userInfo || !this.userInfo.id || this.tokenLoading) return;
				if (this.adRewardRemain <= 0) {
					uni.showToast({ title: '今日广告奖励已达上限', icon: 'none' });
					return;
				}

				this.tokenLoading = true;
				uni.showLoading({ title: '加载广告中...' });
				showRewardedVideoAd().then((completed) => {
					uni.hideLoading();
					if (!completed) {
						uni.showToast({ title: '请完整观看广告', icon: 'none' });
						return;
					}
					return api.rewardTokenByAd(this.userInfo.id, getRewardedAdUnitId());
				}).then((res) => {
					if (!res) return;
					const reward = Number(res.reward) || 0;
					uni.showToast({ title: `获得 +${reward}${this.tokenName}`, icon: 'none' });
					this.loadTokenStatus();
				}).catch(() => {
					uni.hideLoading();
					uni.showToast({ title: '领取失败，请稍后再试', icon: 'none' });
				}).finally(() => {
					this.tokenLoading = false;
				});
			},
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
			goToSettings() {
				uni.navigateTo({
					url: '/pages/mine/settings'
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

	.token-panel {
		margin: 0 20px 18px;
		background: linear-gradient(135deg, #fff9ef, #fff4dd);
		border: 1px solid #efd8aa;
		border-radius: 12px;
		padding: 14px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.token-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.token-title {
		font-size: 15px;
		font-weight: bold;
		color: #8B4513;
	}

	.token-balance {
		font-size: 24px;
		font-weight: bold;
		color: #DC143C;
	}

	.invite-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.invite-label {
		font-size: 12px;
		color: #666;
	}

	.invite-copy {
		font-size: 12px;
		color: #8B4513;
		padding: 3px 8px;
		border: 1px solid #d8ba84;
		border-radius: 10px;
	}

	.token-actions {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}

	.token-action {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 10px;
		padding: 8px 4px;
		border: 1px solid #f0ddbc;

		text {
			margin-top: 4px;
			font-size: 11px;
			color: #8B4513;
			text-align: center;
		}
	}

	.token-tip {
		display: block;
		font-size: 11px;
		line-height: 1.5;
		color: #7f7f7f;
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
