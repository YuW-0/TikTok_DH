<template>
	<view class="container">
		<view class="header-section">
			<text class="page-title">古籍大师深度解签</text>
			<text class="page-subtitle">承袭千年易学智慧，古籍大师为您排忧解难</text>
		</view>

		<!-- 签文信息 -->
		<view class="sign-card">
			<view class="sign-header">
				<text class="sign-level">{{ signInfo.signLevel }}</text>
				<text class="sign-title">{{ signInfo.signTitle }}</text>
			</view>
			<text class="sign-text">{{ signInfo.signText }}</text>
		</view>

		<!-- 个人信息表单 -->
		<view class="form-section">
			<view class="form-title">完善个人信息</view>
			<view class="form-desc">信息越详细，解读越精准（已加密保护）</view>
			
			<uni-forms ref="form" :modelValue="formData" :rules="rules">
				<uni-forms-item label="姓名" name="name" required>
					<uni-easyinput v-model="formData.name" placeholder="请输入您的姓名" />
				</uni-forms-item>
				
				<uni-forms-item label="性别" name="gender" required>
					<uni-data-checkbox v-model="formData.gender" :localdata="sexRanges" />
				</uni-forms-item>
				
				<uni-forms-item label="出生日期" name="birthday" required>
					<picker mode="date" :value="formData.birthday" start="1900-01-01" :end="today" @change="onBirthdayChange">
						<view class="uni-input">{{ formData.birthday || '1990-01-01' }}</view>
					</picker>
				</uni-forms-item>
				
				<uni-forms-item label="出生时辰" name="birthTime" required>
					<uni-data-select v-model="formData.birthTime" :localdata="timeRanges" placeholder="请选择出生时辰" />
				</uni-forms-item>

				<uni-forms-item label="职业/身份" name="occupation">
					<uni-easyinput v-model="formData.occupation" placeholder="例如：学生、程序员、创业者" />
				</uni-forms-item>

				<uni-forms-item label="所属公司" name="company" v-if="signInfo.theme === '事业' || signInfo.theme === '财运'">
					<uni-easyinput v-model="formData.company" placeholder="输入公司名称可分析事业运(选填)" />
				</uni-forms-item>
				
				<uni-forms-item label="困惑/问题" name="question">
					<uni-easyinput type="textarea" v-model="formData.question" placeholder="您具体想问什么？例如：最近有个跳槽机会该不该去？" />
				</uni-forms-item>
			</uni-forms>
		</view>

		<!-- 解读结果展示区 -->
		<view class="result-section" v-if="showResult" id="result">
			<view class="result-title">
				<uni-icons type="chat-filled" size="24" color="#8A2BE2"></uni-icons>
				<text>大师亲批</text>
			</view>
			<view class="result-content">
				<text>{{ aiResult }}</text>
			</view>
			<text class="result-bridge-text">天机未尽，若心中仍有疑惑，可再叩仙门请大师续断。</text>
			<button class="ask-more-btn" @click="goToMasterConsultation">再叩仙门·续问天机</button>
		</view>

		<!-- 底部操作栏 -->
		<view class="footer-bar" v-if="!showResult">
			<view class="price-info">
				<text class="label">解锁方式：</text>
				<text class="price">观看广告</text>
			</view>
			<button class="submit-btn" @click="submitForm" :loading="loading" :disabled="loading">
				{{ loading ? '大师正在翻阅古籍...' : '观看广告并解锁' }}
			</button>
		</view>
	</view>
</template>

<script>
	import api from '@/utils/api.js';
	import { showRewardedVideoAd } from '@/utils/ad.js';

	export default {
		data() {
			return {
				signInfo: {
					signTitle: '',
					signLevel: '',
					signText: '',
					theme: ''
				},
				formData: {
					name: '',
					gender: 1,
					birthday: '1990-01-01',
					birthTime: '',
					occupation: '',
					company: '',
					question: ''
				},
				sexRanges: [
					{ text: '男', value: 1 },
					{ text: '女', value: 2 }
				],
				timeRanges: [
					{ value: 'zi', text: '子时 (23:00-01:00)' },
					{ value: 'chou', text: '丑时 (01:00-03:00)' },
					{ value: 'yin', text: '寅时 (03:00-05:00)' },
					{ value: 'mao', text: '卯时 (05:00-07:00)' },
					{ value: 'chen', text: '辰时 (07:00-09:00)' },
					{ value: 'si', text: '巳时 (09:00-11:00)' },
					{ value: 'wu', text: '午时 (11:00-13:00)' },
					{ value: 'wei', text: '未时 (13:00-15:00)' },
					{ value: 'shen', text: '申时 (15:00-17:00)' },
					{ value: 'you', text: '酉时 (17:00-19:00)' },
					{ value: 'xu', text: '戌时 (19:00-21:00)' },
					{ value: 'hai', text: '亥时 (21:00-23:00)' }
				],
				rules: {
					name: { rules: [{ required: true, errorMessage: '请输入姓名' }] },
					birthday: { rules: [{ required: true, errorMessage: '请选择出生日期' }] },
					birthTime: { rules: [{ required: true, errorMessage: '请选择出生时辰' }] }
				},
				loading: false,
				showResult: false,
				aiResult: '',
				pollTimer: null,
				today: new Date().toISOString().split('T')[0]
			}
		},
		onLoad(options) {
			if (options.signTitle) this.signInfo.signTitle = decodeURIComponent(options.signTitle);
			if (options.signLevel) this.signInfo.signLevel = decodeURIComponent(options.signLevel);
			if (options.signText) this.signInfo.signText = decodeURIComponent(options.signText);
			if (options.theme) this.signInfo.theme = decodeURIComponent(options.theme);
			if (options.recordId) this.signInfo.recordId = options.recordId; // 确保接收 recordId
			this.tryRestoreInterpretation();
		},
		onUnload() {
			this.stopPolling();
		},
		methods: {
			getPendingKey() {
				const userInfo = uni.getStorageSync('userInfo') || {};
				const userId = userInfo.id || 'guest';
				const recordId = this.signInfo.recordId || 'unknown_record';
				return `ai_interpret_pending:${userId}:${recordId}`;
			},
			setPending(flag) {
				const key = this.getPendingKey();
				if (flag) {
					uni.setStorageSync(key, true);
				} else {
					uni.removeStorageSync(key);
				}
			},
			isPending() {
				return Boolean(uni.getStorageSync(this.getPendingKey()));
			},
			stopPolling() {
				if (this.pollTimer) {
					clearInterval(this.pollTimer);
					this.pollTimer = null;
				}
			},
			startPollingResult() {
				this.stopPolling();
				this.pollTimer = setInterval(() => {
					this.fetchInterpretationResult(true);
				}, 5000);
			},
			tryRestoreInterpretation() {
				if (!this.signInfo.recordId) return;
				this.fetchInterpretationResult(true);
				if (this.isPending()) {
					this.startPollingResult();
				}
			},
			fetchInterpretationResult(silent = false) {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo || !this.signInfo.recordId) return;

				api.getAiInterpretResult(userInfo.id, this.signInfo.recordId).then((res) => {
					if (res.status === 'done' && res.data && res.data.ai_response) {
						this.showResult = true;
						this.loading = false;
						this.aiResult = res.data.ai_response;
						this.setPending(false);
						this.stopPolling();
						if (!silent) {
							uni.showToast({ title: '已恢复解读结果', icon: 'none' });
						}
					}
				}).catch((err) => {
					if (!silent) {
						console.error('fetchInterpretationResult failed:', err);
					}
				});
			},
			onBirthdayChange(e) {
				this.formData.birthday = e.detail.value
			},
			submitForm() {
				this.$refs.form.validate().then(res => {
					this.unlockByAdThenAnalyze();
				}).catch(err => {
					console.log('表单校验失败', err);
				})
			},
			async unlockByAdThenAnalyze() {
				try {
					uni.showLoading({ title: '加载广告中...' });
					const isCompleted = await showRewardedVideoAd();
					uni.hideLoading();

					if (!isCompleted) {
						uni.showToast({ title: '请完整观看广告', icon: 'none' });
						return;
					}

					this.startAiAnalysis();
				} catch (error) {
					uni.hideLoading();
					console.error('广告调用失败:', error);

					let errorMsg = '广告加载失败，请稍后重试';
					if (error && error.message === 'AD_API_UNAVAILABLE') {
						errorMsg = '当前环境不支持广告播放';
					} else if (error && String(error.errMsg || '').toLowerCase().includes('network')) {
						errorMsg = '网络未连接，请检查网络设置';
					}

					uni.showToast({ title: errorMsg, icon: 'none' });
				}
			},
			startAiAnalysis() {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				this.loading = true;
				this.showResult = false;
				this.setPending(true);
				this.startPollingResult();
				
				// 调用后端 AI 解读接口
				api.aiInterpret(userInfo.id, this.signInfo, this.formData).then(res => {
					this.loading = false;
					this.showResult = true;
					this.aiResult = res.data.ai_response;
					this.setPending(false);
					this.stopPolling();
					
					this.$nextTick(() => {
						uni.pageScrollTo({
							selector: '#result',
							duration: 300
						});
					});
				}).catch(err => {
					this.loading = false;
					const errMsg = String(err?.errMsg || '').toLowerCase();
					if (errMsg.includes('timeout') || err.errorCode === 100020 || err.errNo === 21103) {
						uni.showToast({ title: '解读较慢，已在后台继续，稍后可返回查看', icon: 'none' });
						return;
					}
					this.setPending(false);
					this.stopPolling();
					uni.showToast({ title: '解读失败，请重试', icon: 'none' });
				});
			},
			goToMasterConsultation() {
				uni.navigateTo({
					url: '/pages/chat/chat'
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

	.header-section {
		background: linear-gradient(135deg, #4B0082, #8A2BE2);
		padding: 30px 20px;
		color: #fff;
	}

	.page-title {
		font-size: 24px;
		font-weight: bold;
		display: block;
		margin-bottom: 5px;
	}

	.page-subtitle {
		font-size: 12px;
		opacity: 0.8;
	}

	.sign-card {
		margin: -20px 20px 20px;
		background-color: #fff;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		position: relative;
		z-index: 1;
		border-top: 4px solid #FFD700;
	}

	.sign-header {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}

	.sign-level {
		font-size: 18px;
		font-weight: bold;
		color: #DC143C;
		margin-right: 10px;
	}

	.sign-title {
		font-size: 16px;
		color: #333;
	}

	.sign-text {
		font-size: 16px;
		color: #555;
		line-height: 1.6;
		font-family: "SimSun", serif;
		font-weight: bold;
	}

	.form-section {
		background-color: #fff;
		margin: 0 20px 20px;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	.form-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		margin-bottom: 5px;
		border-left: 4px solid #8A2BE2;
		padding-left: 10px;
	}

	.form-desc {
		font-size: 12px;
		color: #999;
		margin-bottom: 20px;
		padding-left: 14px;
	}

	.result-section {
		background-color: #fff;
		margin: 0 20px 20px;
		border-radius: 12px;
		padding: 20px;
		border: 1px solid #8A2BE2;
		background-color: #F8F0FF;
	}

	.result-title {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
		
		text {
			font-size: 16px;
			font-weight: bold;
			color: #4B0082;
			margin-left: 8px;
		}
	}

	.result-content {
		text {
			font-size: 14px;
			color: #333;
			line-height: 1.8;
			white-space: pre-wrap; // 保留换行符
		}
	}

	.result-bridge-text {
		display: block;
		margin-top: 12px;
		font-size: 13px;
		line-height: 1.7;
		color: #5f4b8b;
	}

	.ask-more-btn {
		margin-top: 18px;
		background: linear-gradient(to right, #6a0dad, #4b0082);
		color: #fff;
		font-size: 14px;
		border-radius: 22px;
		height: 44px;
		line-height: 44px;
		width: 100%;
	}

	.footer-bar {
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
		z-index: 100;
	}

	.price-info {
		.label {
			font-size: 14px;
			color: #333;
		}
		.price {
			font-size: 20px;
			font-weight: bold;
			color: #DC143C;
		}
	}

	.submit-btn {
		background: linear-gradient(to right, #8A2BE2, #4B0082);
		color: #fff;
		font-size: 14px;
		border-radius: 20px;
		padding: 0 30px;
		height: 40px;
		line-height: 40px;
		margin: 0;
		
		&[disabled] {
			color: #fff !important;
			background: linear-gradient(to right, #8A2BE2, #4B0082);
			opacity: 0.8;
		}
	}
	.uni-input {
		height: 36px;
		line-height: 36px;
		padding: 0 10px;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		color: #333;
		font-size: 14px;
	}
</style>