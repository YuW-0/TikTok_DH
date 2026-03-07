const REWARDED_AD_UNIT_ID = 'u3qf30vvzm08e9fp1e';

let rewardedAd = null;
let adEventsBound = false;
let closeHandler = null;
let errorHandler = null;

const getRewardedAd = () => {
	if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
		throw new Error('AD_API_UNAVAILABLE');
	}
	if (rewardedAd) return rewardedAd;
	rewardedAd = tt.createRewardedVideoAd({
		adUnitId: REWARDED_AD_UNIT_ID
	});
	return rewardedAd;
};

export const showRewardedVideoAd = () => {
	return new Promise((resolve, reject) => {
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
			// Only grant reward when platform explicitly confirms full watch.
			resolve(Boolean(res && res.isEnded === true));
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
	});
};

export const getRewardedAdUnitId = () => REWARDED_AD_UNIT_ID;
