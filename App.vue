<script>
	import api from '@/utils/api.js';

	export default {
		onLaunch: function() {
			console.log('App Launch');
			this.checkLogin();
		},
		methods: {
			loginAndSyncUser() {
				uni.login({
					success: (loginRes) => {
						if (!loginRes.code) {
							console.error('登录失败: 未获取到code', loginRes);
							return;
						}

						api.login(loginRes.code).then(res => {
							console.log('登录成功', res);
							uni.setStorageSync('userInfo', res.user);
							uni.setStorageSync('isVip', res.user.vip_level > 0);
						}).catch(err => {
							console.error('登录失败', err);
						});
					},
					fail: (err) => {
						console.error('uni.login 调用失败', err);
					}
				});
			},
			checkLogin() {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					this.loginAndSyncUser();
				} else {
					// 更新用户信息
					api.getUserInfo(userInfo.id).then(res => {
						uni.setStorageSync('userInfo', res.user);
						uni.setStorageSync('isVip', res.user.vip_level > 0);
					}).catch((err) => {
						const errMsg = String((err && err.errMsg) || '').toLowerCase();
						const apiMsg = String((err && err.message) || '').toLowerCase();
						const errCode = String((err && err.code) || '').toUpperCase();
						const isAbort = errMsg.includes('abort') || err.errNo === 21101 || err.errorCode === 100022;
						const isUserMissing = errCode === 'USER_NOT_FOUND' || apiMsg.includes('user not found') || apiMsg.includes('fetch user failed');

						if (isUserMissing) {
							uni.removeStorageSync('userInfo');
							uni.removeStorageSync('isVip');
							uni.removeStorageSync('daily_merit');
							this.loginAndSyncUser();
							return;
						}

						if (!isAbort) {
							console.error('更新用户信息失败', err);
						}
					});
				}
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	
	/* 去除抖音小程序button默认边框 */
	button::after {
		border: none;
	}
</style>