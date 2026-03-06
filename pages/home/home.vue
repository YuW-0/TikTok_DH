<template>
	<view class="container">
		<!-- 历史签文入口 -->
		<view class="history-entry" @click="goToHistory">
			<uni-icons type="list" size="20" color="#8B4513"></uni-icons>
			<text>历史签文</text>
		</view>

		<!-- 顶部背景装饰 -->
		<view class="header-bg"></view>
		
		<!-- 主题选择区 -->
		<view class="theme-section">
			<text class="section-title">今日求签主题</text>
			<scroll-view class="theme-scroll" scroll-x="true" show-scrollbar="false">
				<view class="theme-list">
					<view 
						class="theme-item" 
						v-for="(item, index) in themes" 
						:key="index"
						:class="{ active: currentTheme === index }"
						@click="selectTheme(index)"
					>
						<view class="theme-icon">{{ item.icon }}</view>
						<text class="theme-name">{{ item.name }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 求签入口 -->
		<view class="draw-section">
			<view class="draw-container" @click="goToDraw">
				<view class="draw-cylinder">
					<view class="cylinder-body">
						<text class="cylinder-text">求签</text>
					</view>
					<view class="sticks">
						<view class="stick" v-for="n in 5" :key="n"></view>
					</view>
				</view>
				<text class="draw-hint">点击摇签筒开始求签</text>
			</view>
		</view>

		<!-- 寻师问道按钮 -->
		<view class="chat-section">
			<view class="chat-btn" @click="goToChat">
				<view class="btn-left">
					<view class="chat-icon">
						<uni-icons type="chatbubble-filled" size="24" color="#fff"></uni-icons>
					</view>
					<view class="chat-text">
						<text class="chat-title">寻师问道</text>
						<text class="chat-subtitle">古籍大师在线解惑</text>
					</view>
				</view>
				<uni-icons type="arrowright" size="18" color="#fff" style="opacity: 0.8;"></uni-icons>
			</view>
		</view>

		<!-- 今日运势概览 -->
		<view class="fortune-summary">
			<view class="summary-card">
				<view class="summary-header">
					<view>
						<text class="summary-title">今日运势概览</text>
						<text class="lunar-date">{{ dailyFortune.lunarStr }}</text>
					</view>
					<text class="summary-date">{{ currentDate }}</text>
				</view>
				<view class="summary-content">
					<view class="star-rating">
						<text>综合运势：</text>
						<uni-rate :value="dailyFortune.stars" readonly size="18" active-color="#FFD700" />
					</view>
					<text class="summary-desc">{{ dailyFortune.text }}</text>
					
					<!-- 宜忌建议 -->
					<view class="fortune-advice">
						<view class="advice-item yi">
							<text class="advice-label">宜</text>
							<text class="advice-text">{{ dailyFortune.yi }}</text>
						</view>
						<view class="advice-divider"></view>
						<view class="advice-item ji">
							<text class="advice-label">忌</text>
							<text class="advice-text">{{ dailyFortune.ji }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { Solar } from 'lunar-javascript';

	export default {
		data() {
			return {
				currentTheme: 0,
				themes: [
					{ name: '财运', icon: '💰', type: 'wealth' },
					{ name: '事业', icon: '💼', type: 'career' },
					{ name: '爱情', icon: '❤️', type: 'love' },
					{ name: '学业', icon: '🎓', type: 'study' },
					{ name: '健康', icon: '💊', type: 'health' }
				],
				currentDate: ''
			}
		},
		computed: {
			dailyFortune() {
				// 获取今日农历信息
				const solar = Solar.fromDate(new Date());
				const lunar = solar.getLunar();
				
				// 获取真实的黄历宜忌
				// 筛选一些常见的、易懂的术语，避免过于生僻
				const filterTerms = (terms) => {
					// 如果没有数据，返回默认
					if (!terms || terms.length === 0) return ['诸事不宜'];
					// 只取前 3 个，避免太长
					return terms.slice(0, 3).join('、');
				};
				
				const yiStr = filterTerms(lunar.getDayYi());
				const jiStr = filterTerms(lunar.getDayJi());
				
				let lunarStr = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
				const jieQi = lunar.getJieQi();
				if (jieQi) lunarStr += ` · ${jieQi}`;
				
				// 运势文案依然使用随机生成，因为黄历不包含这种“心理按摩”文案
				const date = new Date();
				const day = date.getDate();
				const month = date.getMonth() + 1;
				const seed = day * month + date.getFullYear();
				
				const random = (seed) => {
					let x = Math.sin(seed) * 10000;
					return x - Math.floor(x);
				};
				
				const stars = Math.floor(random(seed) * 3) + 3; // 3-5星
				
				const fortunes = [
					"今日运势平稳上升，适合规划未来，与人沟通顺畅。财运方面有小惊喜。",
					"贵人运旺盛，工作上易得助力。保持谦逊，今日会有意外收获。",
					"宜静不宜动，适合修身养性。处理财务需谨慎，避免冲动消费。",
					"桃花运不错，单身者可多参加聚会。事业上灵感迸发，抓住机会。",
					"虽然有些许波折，但只要坚持即可化解。注意休息，劳逸结合。",
					"大吉大利，诸事顺遂。今日适合开展新计划，容易获得成功。",
					"心情愉悦，好运连连。与家人朋友相聚会有温馨时刻。"
				];
				
				const index = Math.floor(random(seed + 1) * fortunes.length);
				
				return {
					stars: stars,
					text: fortunes[index],
					yi: yiStr,
					ji: jiStr,
					lunarStr: lunarStr
				};
			}
		},
		onLoad() {
			this.setCurrentDate();
		},
		methods: {
			selectTheme(index) {
				this.currentTheme = index;
			},
			goToDraw() {
				const theme = this.themes[this.currentTheme];
				uni.navigateTo({
					url: `/pages/draw/draw?type=${theme.type}&name=${theme.name}`
				});
			},
			goToHistory() {
				uni.navigateTo({
					url: '/pages/mine/history'
				});
			},
			goToChat() {
				uni.navigateTo({
					url: '/pages/chat/chat'
				});
			},
			setCurrentDate() {
				const date = new Date();
				const month = date.getMonth() + 1;
				const day = date.getDate();
				this.currentDate = `${month}月${day}日`;
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		width: 100%;
		background-color: #FAF0E6;
		padding-bottom: 20px;
		position: relative;
		overflow-x: hidden;
	}

	.header-bg {
		height: 150px;
		background: linear-gradient(to bottom, #DC143C, #FAF0E6);
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 0;
		border-bottom-left-radius: 30px;
		border-bottom-right-radius: 30px;
	}

	.history-entry {
		position: absolute;
		top: 20px; /* 状态栏下方 */
		right: 20px;
		z-index: 10;
		background-color: rgba(255, 255, 255, 0.9);
		padding: 6px 12px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		box-shadow: 0 2px 6px rgba(0,0,0,0.1);
		
		text {
			font-size: 14px;
			color: #8B4513;
			margin-left: 4px;
			font-weight: bold;
		}
	}

	.section-title {
		font-size: 18px;
		font-weight: bold;
		color: #fff; // 在红色背景上显示为白色
		margin-bottom: 10px;
		display: block;
		padding-left: 20px;
		position: relative;
		z-index: 1;
	}

	.theme-section {
		padding-top: 20px;
		position: relative;
		z-index: 1;
	}

	.theme-scroll {
		width: 100%;
		white-space: nowrap;
		padding-left: 20px;
		margin-top: 30px; // 增加按钮与标题的距离
	}

	.theme-list {
		display: flex;
		padding-right: 20px;
		padding-bottom: 20px; // 留出阴影空间
		padding-top: 20px; // 留出顶部空间
	}

	.theme-item {
		width: 80px;
		height: 100px;
		background-color: #fff;
		border-radius: 12px;
		margin-right: 15px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
		transition: all 0.3s;
		border: 2px solid transparent;

		&.active {
			border-color: #FFD700;
			transform: scale(1.05);
			background-color: #FFF8E1;
			
			.theme-name {
				color: #DC143C;
				font-weight: bold;
			}
		}

		.theme-icon {
			font-size: 32px;
			margin-bottom: 8px;
		}

		.theme-name {
			font-size: 14px;
			color: #333;
		}
	}

	.draw-section {
		margin: 40px 20px 20px;
		display: flex;
		justify-content: center;
		position: relative;
		z-index: 1;
	}

	.chat-section {
		margin: 0 20px 20px;
		
		.chat-btn {
			background: linear-gradient(135deg, #8A2BE2, #4B0082);
			border-radius: 16px;
			padding: 15px 20px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			box-shadow: 0 4px 10px rgba(75, 0, 130, 0.2);
			
			.btn-left {
				display: flex;
				align-items: center;
			}
			
			.chat-icon {
				width: 40px;
				height: 40px;
				background-color: rgba(255, 255, 255, 0.2);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 15px;
			}
			
			.chat-text {
				display: flex;
				flex-direction: column;
				
				.chat-title {
					font-size: 16px;
					font-weight: bold;
					color: #fff;
					margin-bottom: 4px;
				}
				
				.chat-subtitle {
					font-size: 12px;
					color: rgba(255, 255, 255, 0.8);
				}
			}
		}
	}

	.draw-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.draw-cylinder {
		width: 120px;
		height: 180px;
		position: relative;
		margin-bottom: 20px;
		
		.cylinder-body {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #8B4513, #A0522D);
			border-radius: 10px 10px 40px 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 10px 20px rgba(0,0,0,0.3);
			border: 4px solid #FFD700;
			position: relative;
			z-index: 2;
			
			.cylinder-text {
				font-size: 36px;
				color: #FFD700;
				font-weight: bold;
				writing-mode: vertical-rl;
				letter-spacing: 10px;
				font-family: "SimSun", serif; // 宋体或其他衬线体
			}
		}

		.sticks {
			position: absolute;
			top: -20px;
			left: 20px;
			right: 20px;
			height: 40px;
			z-index: 1;
			display: flex;
			justify-content: space-around;
			
			.stick {
				width: 6px;
				height: 50px;
				background-color: #DEB887;
				border-radius: 3px;
				transform-origin: bottom center;
				
				&:nth-child(1) { transform: rotate(-15deg); }
				&:nth-child(2) { transform: rotate(-5deg); height: 55px; }
				&:nth-child(3) { transform: rotate(5deg); }
				&:nth-child(4) { transform: rotate(15deg); height: 45px; }
				&:nth-child(5) { transform: rotate(0deg); height: 52px; }
			}
		}
	}

	.draw-hint {
		font-size: 16px;
		color: #8B4513;
		font-weight: bold;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.05); opacity: 0.8; }
		100% { transform: scale(1); opacity: 1; }
	}

	.fortune-summary {
		padding: 0 20px;
	}

	.summary-card {
		background-color: #fff;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
		border-bottom: 1px solid #eee;
		padding-bottom: 10px;
	}

	.summary-title {
		font-size: 16px;
		font-weight: bold;
		color: #333;
		border-left: 4px solid #DC143C;
		padding-left: 10px;
		display: block;
	}
	
	.lunar-date {
		font-size: 12px;
		color: #999;
		margin-left: 14px;
		margin-top: 4px;
		display: block;
	}

	.summary-date {
		font-size: 14px;
		color: #999;
	}

	.summary-content {
		.star-rating {
			display: flex;
			align-items: center;
			margin-bottom: 10px;
			
			text {
				font-size: 14px;
				color: #666;
				margin-right: 10px;
			}
		}
		
		.summary-desc {
			font-size: 14px;
			color: #666;
			line-height: 1.6;
		}
		
		.fortune-advice {
			display: flex;
			align-items: center;
			margin-top: 15px;
			padding-top: 15px;
			border-top: 1px dashed #eee;
			
			.advice-divider {
				width: 1px;
				height: 20px;
				background-color: #ddd;
				margin: 0 20px;
			}
			
			.advice-item {
				display: flex;
				align-items: center;
				
				.advice-label {
					width: 24px;
					height: 24px;
					line-height: 24px;
					text-align: center;
					border-radius: 50%;
					font-size: 12px;
					color: #fff;
					margin-right: 8px;
					font-weight: bold;
				}
				
				.advice-text {
					font-size: 14px;
					color: #333;
					font-weight: bold;
				}
				
				&.yi .advice-label {
					background-color: #32CD32; // 绿色
				}
				
				&.ji .advice-label {
					background-color: #DC143C; // 红色
				}
			}
		}
	}
</style>