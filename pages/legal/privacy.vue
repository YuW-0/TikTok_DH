<template>
	<view class="container">
		<view class="card">
			<text class="title">隐私政策</text>
			<text class="update">更新日期：2026-03-07</text>
			<text class="p">本小程序为传统文化解读服务。我们仅在必要范围内收集信息，用于登录、求签记录、解读服务与基础功能保障。</text>
			<text class="p">1. 收集信息：账号标识、昵称头像、您主动填写的解读信息（如姓名、性别、生日、时辰、问题描述）。</text>
			<text class="p">2. 使用目的：提供求签、解读、历史记录恢复、风控与运营统计，不用于与本服务无关用途。</text>
			<text class="p">3. 存储与保护：数据存储在受保护的服务环境中，采取合理安全措施。</text>
			<text class="p">4. 对外共享：除法律法规要求或为实现核心功能的必要服务商外，不会向无关第三方出售个人信息。</text>
			<text class="p">5. 您的权利：您可通过“我的-账号注销”发起注销申请，注销后将按规则清理账号相关信息。</text>
			<text class="p">6. 未成年人：请在监护人指导下使用本服务。</text>
			<text class="p">7. 联系方式：如有隐私问题，请通过“我的-联系客服”与我们联系。</text>
		</view>
	</view>
</template>

<script>
	export default {};
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #FAF0E6;
		padding: 16px;
		box-sizing: border-box;
	}

	.card {
		background: #fff;
		border-radius: 12px;
		padding: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.title {
		display: block;
		font-size: 20px;
		font-weight: bold;
		color: #333;
		margin-bottom: 6px;
	}

	.update {
		display: block;
		font-size: 12px;
		color: #999;
		margin-bottom: 12px;
	}

	.p {
		display: block;
		font-size: 14px;
		line-height: 1.8;
		color: #444;
		margin-bottom: 8px;
	}
</style>
