<template>
	<view class="container">
		<view class="form-card">
			<view class="field">
				<text class="label">姓名</text>
				<input
					class="input"
					v-model="form.name"
					maxlength="20"
					placeholder="请输入姓名"
					placeholder-class="input-placeholder"
				/>
			</view>

			<picker class="field-picker" mode="selector" :range="genderOptions" @change="onGenderChange">
				<view class="field">
					<text class="label">性别</text>
					<view class="picker-value">
						<text :class="{ 'value-empty': !form.gender }">{{ form.gender || '请选择性别' }}</text>
						<uni-icons type="right" size="16" color="#aaa"></uni-icons>
					</view>
				</view>
			</picker>

			<picker
				class="field-picker"
				mode="date"
				:start="dateStart"
				:end="dateEnd"
				:value="form.birthDate || dateEnd"
				@change="onDateChange"
			>
				<view class="field">
					<text class="label">出生日期</text>
					<view class="picker-value">
						<text :class="{ 'value-empty': !form.birthDate }">{{ form.birthDate || '请选择出生日期' }}</text>
						<uni-icons type="right" size="16" color="#aaa"></uni-icons>
					</view>
				</view>
			</picker>

			<picker class="field-picker" mode="selector" :range="hourOptions" @change="onHourChange">
				<view class="field">
					<text class="label">出生时辰</text>
					<view class="picker-value">
						<text :class="{ 'value-empty': !form.birthHour }">{{ form.birthHour || '请选择出生时辰' }}</text>
						<uni-icons type="right" size="16" color="#aaa"></uni-icons>
					</view>
				</view>
			</picker>
		</view>

		<button class="save-btn" @click="saveProfile">保存个人信息</button>
		<text class="tip">以上信息仅用于测算服务展示与个性化分析。</text>

	</view>
</template>

<script>
	export default {
		data() {
			return {
				form: {
					name: '',
					gender: '',
					birthDate: '',
					birthHour: ''
				},
				genderOptions: ['男', '女'],
				hourOptions: [
					'子时(23:00-00:59)',
					'丑时(01:00-02:59)',
					'寅时(03:00-04:59)',
					'卯时(05:00-06:59)',
					'辰时(07:00-08:59)',
					'巳时(09:00-10:59)',
					'午时(11:00-12:59)',
					'未时(13:00-14:59)',
					'申时(15:00-16:59)',
					'酉时(17:00-18:59)',
					'戌时(19:00-20:59)',
					'亥时(21:00-22:59)'
				]
			};
		},
		computed: {
			dateStart() {
				return '1950-01-01';
			},
			dateEnd() {
				const now = new Date();
				const y = now.getFullYear();
				const m = String(now.getMonth() + 1).padStart(2, '0');
				const d = String(now.getDate()).padStart(2, '0');
				return `${y}-${m}-${d}`;
			}
		},
		onLoad() {
			this.loadProfile();
		},
		methods: {
			loadProfile() {
				const saved = uni.getStorageSync('user_profile');
				if (saved && typeof saved === 'object') {
					this.form = {
						name: saved.name || '',
						gender: saved.gender || '',
						birthDate: saved.birthDate || '',
						birthHour: saved.birthHour || ''
					};
				}
			},
			onGenderChange(e) {
				const index = Number(e.detail.value);
				this.form.gender = this.genderOptions[index] || '';
			},
			onDateChange(e) {
				this.form.birthDate = e.detail.value || '';
			},
			onHourChange(e) {
				const index = Number(e.detail.value);
				this.form.birthHour = this.hourOptions[index] || '';
			},
			saveProfile() {
				const name = String(this.form.name || '').trim();
				if (!name) {
					uni.showToast({ title: '请填写姓名', icon: 'none' });
					return;
				}
				if (!this.form.gender) {
					uni.showToast({ title: '请选择性别', icon: 'none' });
					return;
				}
				if (!this.form.birthDate) {
					uni.showToast({ title: '请选择出生日期', icon: 'none' });
					return;
				}
				if (!this.form.birthHour) {
					uni.showToast({ title: '请选择出生时辰', icon: 'none' });
					return;
				}

				const profile = {
					name,
					gender: this.form.gender,
					birthDate: this.form.birthDate,
					birthHour: this.form.birthHour
				};
				uni.setStorageSync('user_profile', profile);
				uni.showToast({ title: '保存成功', icon: 'success' });
			}
		}
	};
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #faf0e6;
		padding: 16px;
		box-sizing: border-box;
	}

	.form-card {
		background: #fff;
		border-radius: 12px;
		padding: 12px 14px;
		border: 1px solid #f1e2c8;
	}

	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 48px;
		border-bottom: 1px solid #f5f5f5;
	}

	.field-picker {
		display: block;
	}

	.field:last-child {
		border-bottom: none;
	}

	.label {
		font-size: 14px;
		color: #333;
	}

	.input {
		width: 68%;
		height: 36px;
		text-align: right;
		font-size: 14px;
		color: #333;
	}

	.input-placeholder {
		color: #bbb;
	}

	.picker-value {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		color: #333;
	}

	.value-empty {
		color: #bbb;
	}

	.save-btn {
		margin-top: 20px;
		background-color: #dc143c;
		color: #fff;
		border-radius: 24px;
		font-size: 15px;
	}

	.tip {
		display: block;
		margin-top: 10px;
		font-size: 12px;
		color: #999;
		text-align: center;
	}
</style>
