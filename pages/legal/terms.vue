<template>
	<view class="container">
		<view class="card">
			<text class="title">用户协议</text>
			<text class="update">更新日期：2026-03-07</text>
			<text class="p">欢迎使用本小程序。您使用本服务即表示已阅读并同意本协议。</text>
			<text class="p">1. 服务性质：本服务为传统文化解读与交流内容，仅供娱乐与参考，不构成医疗、法律、投资等专业建议。</text>
			<text class="p">2. 使用规范：请勿发布违法、侵权、侮辱、暴力、色情等不当内容。</text>
			<text class="p">3. 广告与权益：部分功能通过广告解锁，是否观看由您自主决定；观看规则以页面提示为准。</text>
			<text class="p">4. 付费与开通：付费功能以页面展示和实际开通状态为准，权益说明以系统记录为准。</text>
			<text class="p">5. 账号管理：请妥善保管账号信息。您可通过“我的-账号注销”发起注销申请。</text>
			<text class="p">6. 免责声明：因网络、系统维护、第三方服务故障导致的暂时不可用，我们将尽力恢复，但不承担超出法律规定的责任。</text>
			<text class="p">7. 协议更新：协议更新后将于页面公示，继续使用视为接受更新内容。</text>
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
