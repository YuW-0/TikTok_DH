<template>
	<view class="container" @click="knock">
		<!-- 背景氛围 -->
		<view class="bg-decoration top"></view>
		<view class="bg-decoration bottom"></view>
		
		<view class="muyu-header">
			<text class="merit-count">今日福分：{{ merit }}</text>
			<text class="merit-subtitle">轻触屏幕敲击木鱼，积攒福分</text>
		</view>

		<view class="muyu-area">
			<!-- 木鱼图片，使用 CSS 绘制一个简单的木鱼形状代替图片，或者您后续替换真实图片 -->
			<view class="muyu-shape" :class="{ 'knocking': isKnocking }">
				<view class="muyu-body">
					<view class="muyu-eye left"></view>
					<view class="muyu-eye right"></view>
					<view class="muyu-mouth"></view>
				</view>
				<view class="muyu-stick" :class="{ 'stick-knocking': isKnocking }"></view>
			</view>
			
			<view 
				v-for="(item, index) in popups" 
				:key="item.id" 
				class="merit-popup"
				:style="{ top: item.top + 'px', left: item.left + 'px', opacity: item.opacity }"
			>
				福分 +1
			</view>
		</view>
		
		<!-- 禅意文字 -->
		<view class="zen-text">
			<text>心无杂念</text>
			<text>万物皆空</text>
		</view>

		<view class="audio-control" @click.stop="toggleAudio">
			<uni-icons :type="audioEnabled ? 'sound-filled' : 'sound'" size="24" color="#8B4513"></uni-icons>
			<text>{{ audioEnabled ? '静心音效' : '静音模式' }}</text>
		</view>

		<text class="game-disclaimer">温馨提示：此为游戏，仅供娱乐。</text>
	</view>
</template>

<script>
	import api from '@/utils/api.js';

	export default {
		data() {
			return {
				merit: 0,
				isKnocking: false,
				audioEnabled: true,
				popups: [],
				audioContext: null,
				timer: null
			}
		},
		onLoad() {
			// 初始化音频
			this.audioContext = uni.createInnerAudioContext();
			this.audioContext.src = '/static/tap.mp3'; 
			
			// 读取本地存储的功德数
			const savedMerit = uni.getStorageSync('daily_merit');
			if (savedMerit) {
				const today = new Date().toDateString();
				const lastDate = uni.getStorageSync('merit_date');
				if (lastDate === today) {
					this.merit = savedMerit;
				} else {
					this.merit = 0;
					uni.setStorageSync('merit_date', today);
				}
			}
		},
		onUnload() {
			if (this.timer) clearTimeout(this.timer);
		},
		methods: {
			safeVibrateShort() {
				// ByteDance mini program may deny vibration capability by platform policy.
				// #ifdef MP-TOUTIAO
				return;
				// #endif

				try {
					const maybePromise = uni.vibrateShort ? uni.vibrateShort() : null;
					if (maybePromise && typeof maybePromise.catch === 'function') {
						maybePromise.catch((err) => {
							console.warn('vibrateShort denied/failed:', err);
						});
					}
				} catch (err) {
					console.warn('vibrateShort denied/failed:', err);
				}
			},
			knock(e) {
				// 1. 增加功德
				if (this.merit < 999) {
					this.merit++;
					this.saveMerit();
					
					// 防抖上传功德
					if (this.timer) clearTimeout(this.timer);
					this.timer = setTimeout(() => {
						this.uploadMerit();
					}, 2000);
				}

				// 2. 动画效果
				this.isKnocking = true;
				setTimeout(() => {
					this.isKnocking = false;
				}, 100);

				// 3. 播放音效
				if (this.audioEnabled) {
					this.audioContext.stop();
					this.audioContext.play();
				}

				// 4. 浮动文字效果
				this.showPopup(e.detail.x, e.detail.y);
				
				// 5. 震动反馈
				this.safeVibrateShort();
			},
			uploadMerit() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					api.updateMerit(userInfo.id, this.merit).then(res => {
						console.log('功德已同步');
					}).catch(err => {
						console.error('功德同步失败', err);
					});
				}
			},
			showPopup(x, y) {
				const id = Date.now();
				const top = y ? y - 100 : 300;
				const left = x ? x - 20 : 150;
				
				this.popups.push({ id, top, left, opacity: 1 });

				setTimeout(() => {
					const index = this.popups.findIndex(p => p.id === id);
					if (index > -1) {
						this.popups.splice(index, 1);
					}
				}, 800);
			},
			toggleAudio() {
				this.audioEnabled = !this.audioEnabled;
			},
			saveMerit() {
				uni.setStorageSync('daily_merit', this.merit);
				uni.setStorageSync('merit_date', new Date().toDateString());
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}
	
	.bg-decoration {
		position: absolute;
		width: 100%;
		height: 20px;
		background-image: radial-gradient(#D2B48C 2px, transparent 2px);
		background-size: 10px 10px;
		opacity: 0.3;
		
		&.top { top: 0; }
		&.bottom { bottom: 0; }
	}

	.muyu-header {
		position: absolute;
		top: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.merit-count {
		font-size: 36px;
		font-weight: bold;
		color: #8B4513;
		margin-bottom: 10px;
		font-family: "SimSun", serif;
	}

	.merit-subtitle {
		font-size: 14px;
		color: #999;
		letter-spacing: 2px;
	}

	.muyu-area {
		position: relative;
		width: 260px;
		height: 260px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: -50px;
	}
	
	// CSS 绘制木鱼 - 纯粹法器风
	.muyu-shape {
		position: relative;
		width: 200px;
		height: 180px;
		
		&.knocking {
			.muyu-body { transform: scale(0.95); }
			.muyu-stick { transform: rotate(-45deg) translate(-10px, 10px); }
		}
	}
	
	.muyu-body {
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at 30% 30%, #A0522D, #5D4037);
		border-radius: 50% 50% 45% 45%;
		position: relative;
		box-shadow: 0 15px 30px rgba(0,0,0,0.4), inset 0 -10px 20px rgba(0,0,0,0.5);
		transition: transform 0.1s;
		z-index: 2;
		
		// 顶部高光
		&::before {
			content: '';
			position: absolute;
			top: 20px;
			left: 20%;
			width: 60%;
			height: 30px;
			background: radial-gradient(ellipse at center, rgba(255,255,255,0.1), transparent);
			border-radius: 50%;
		}
	}
	
	.muyu-eye {
		position: absolute;
		width: 60px;
		height: 60px;
		background: transparent;
		border-radius: 50%;
		border: 6px solid #3E2723; // 纯刻纹
		top: 50px;
		opacity: 0.4;
		box-shadow: 0 1px 1px rgba(255,255,255,0.1); // 刻痕高光
		
		// 移除眼珠，纯抽象纹理
		&::after { display: none; }
		
		&.left { 
			left: 30px; 
			border-right-color: transparent; // 开口圆环，形成抽象鱼鳞纹
			border-bottom-color: transparent;
			transform: rotate(-45deg);
		}
		&.right { 
			right: 30px; 
			border-left-color: transparent;
			border-bottom-color: transparent;
			transform: rotate(45deg);
		}
	}
	
	.muyu-mouth {
		position: absolute;
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 10px;
		background: #2D1B16;
		border-radius: 5px;
		box-shadow: inset 0 2px 5px rgba(0,0,0,0.8); // 极深的空腔感
	}
	
	.muyu-stick {
		position: absolute;
		top: -30px;
		right: -50px;
		width: 20px;
		height: 140px;
		background: #8D6E63;
		border-radius: 10px;
		transform: rotate(-30deg);
		transform-origin: bottom left;
		z-index: 3;
		box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
		transition: transform 0.1s;
		
		&::after {
			content: '';
			position: absolute;
			top: -15px;
			left: -12px;
			width: 44px;
			height: 44px;
			background: #D7CCC8;
			border-radius: 50%;
			box-shadow: inset -2px -2px 5px rgba(0,0,0,0.2);
		}
	}

	.merit-popup {
		position: fixed;
		font-size: 24px;
		color: #DC143C;
		font-weight: bold;
		pointer-events: none;
		animation: floatUp 0.8s ease-out forwards;
		z-index: 10;
		text-shadow: 0 2px 4px rgba(255,255,255,0.8);
		font-family: "SimSun", serif;
	}

	@keyframes floatUp {
		0% { transform: translateY(0) scale(1); opacity: 1; }
		100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
	}
	
	.zen-text {
		position: absolute;
		bottom: 150px;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0.6;
		
		text {
			font-size: 16px;
			color: #8B4513;
			margin: 5px 0;
			letter-spacing: 4px;
			font-family: "SimSun", serif;
		}
	}

	.audio-control {
		position: absolute;
		bottom: 74px;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: #8B4513;
		font-size: 12px;
		opacity: 0.8;
		
		uni-icons {
			margin-bottom: 5px;
		}
	}

	.game-disclaimer {
		position: absolute;
		left: 20px;
		right: 20px;
		bottom: 24px;
		font-size: 11px;
		line-height: 1.5;
		color: #8f7e6c;
		text-align: center;
	}
</style>