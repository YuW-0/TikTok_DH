const REWARDED_AD_UNIT_ID = 'u3qf30vvzm08e9fp1e';

let rewardedAd = null;
let adEventsBound = false;
let closeHandler = null;
let errorHandler = null;

const getRewardedAd = () => {
	if (rewardedAd) return rewardedAd;
	// #ifdef MP-TOUTIAO
	rewardedAd = tt.createRewardedVideoAd({
		adUnitId: REWARDED_AD_UNIT_ID
	});
	// #endif
	return rewardedAd;
};

export const showRewardedVideoAd = () => {
	return new Promise((resolve, reject) => {
		// #ifdef MP-TOUTIAO
		if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
			reject(new Error('AD_API_UNAVAILABLE'));
			return;
		}

		const ad = getRewardedAd();
		if (!ad) {
			reject(new Error('AD_INSTANCE_FAILED'));
			return;
		}

		if (!adEventsBound) {
			ad.onClose((res) => {
				if (closeHandler) closeHandler(res);
			});
			ad.onError((err) => {
				if (errorHandler) errorHandler(err);
			});
			adEventsBound = true;
		}

		closeHandler = (res) => {
			closeHandler = null;
			errorHandler = null;
			resolve(Boolean(res && (res.isEnded || typeof res.isEnded === 'undefined')));
		};

		errorHandler = (err) => {
			closeHandler = null;
			errorHandler = null;
			reject(err || new Error('AD_PLAY_FAILED'));
		};

		ad.show().catch(() => {
			ad.load()
				.then(() => ad.show())
				.catch((err) => {
					closeHandler = null;
					errorHandler = null;
					reject(err || new Error('AD_LOAD_FAILED'));
				});
		});
		// #endif

		// #ifndef MP-TOUTIAO
		reject(new Error('NOT_MP_TOUTIAO'));
		// #endif
	});
};

export const getRewardedAdUnitId = () => REWARDED_AD_UNIT_ID;
