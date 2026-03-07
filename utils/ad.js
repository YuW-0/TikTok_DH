const REWARDED_AD_UNIT_ID = 'u3qf30vvzm08e9fp1e';
const INTERSTITIAL_AD_UNIT_ID = 'r4y57a3qlquw0mckgi';

let rewardedAd = null;
let adEventsBound = false;
let closeHandler = null;
let errorHandler = null;
let currentRewardedAdUnitId = REWARDED_AD_UNIT_ID;

const isInvalidAdUnitError = (err = {}) => {
	const msg = String(err.errMsg || err.message || '').toLowerCase();
	return msg.includes('adunitid is invalid') || msg.includes('ad unit is invalid') || msg.includes('adunitid invalid');
};

const normalizeAdUnitId = (adUnitId) => String(adUnitId || '').trim();

const isLikelyAdUnitId = (adUnitId) => /^[a-z0-9]{16,32}$/i.test(adUnitId);

const normalizeAdError = (err = {}) => {
	if (isInvalidAdUnitError(err)) {
		const wrapped = new Error('AD_UNIT_INVALID');
		wrapped.code = 'AD_UNIT_INVALID';
		wrapped.raw = err;
		return wrapped;
	}
	return err || new Error('AD_PLAY_FAILED');
};

const getRewardedAd = (adUnitId = REWARDED_AD_UNIT_ID) => {
	if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
		throw new Error('AD_API_UNAVAILABLE');
	}
	const normalizedAdUnitId = normalizeAdUnitId(adUnitId);
	if (!isLikelyAdUnitId(normalizedAdUnitId)) {
		const wrapped = new Error('AD_UNIT_INVALID');
		wrapped.code = 'AD_UNIT_INVALID';
		wrapped.adUnitId = normalizedAdUnitId;
		throw wrapped;
	}
	if (rewardedAd && currentRewardedAdUnitId !== normalizedAdUnitId) {
		rewardedAd = null;
		adEventsBound = false;
	}
	if (rewardedAd) return rewardedAd;
	try {
		rewardedAd = tt.createRewardedVideoAd({
			adUnitId: normalizedAdUnitId
		});
		currentRewardedAdUnitId = normalizedAdUnitId;
	} catch (err) {
		throw normalizeAdError(err);
	}
	return rewardedAd;
};

export const showRewardedVideoAd = (adUnitId = REWARDED_AD_UNIT_ID) => {
	return new Promise((resolve, reject) => {
		if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
			reject(new Error('AD_API_UNAVAILABLE'));
			return;
		}

		let ad = null;
		try {
			ad = getRewardedAd(adUnitId);
		} catch (err) {
			reject(normalizeAdError(err));
			return;
		}
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
			if (isInvalidAdUnitError(err)) {
				rewardedAd = null;
				adEventsBound = false;
			}
			reject(normalizeAdError(err));
		};

		ad.show().catch(() => {
			ad.load()
				.then(() => ad.show())
				.catch((err) => {
					closeHandler = null;
					errorHandler = null;
					if (isInvalidAdUnitError(err)) {
						rewardedAd = null;
						adEventsBound = false;
					}
					reject(normalizeAdError(err));
				});
		});
	});
};

export const getRewardedAdUnitId = () => REWARDED_AD_UNIT_ID;
export const isAdUnitInvalidError = isInvalidAdUnitError;

export const showInterstitialAd = () => {
	return new Promise((resolve, reject) => {
		if (typeof tt === 'undefined' || !tt.createInterstitialAd) {
			reject(new Error('AD_API_UNAVAILABLE'));
			return;
		}

		let ad = null;
		let settled = false;

		try {
			ad = tt.createInterstitialAd({
				adUnitId: INTERSTITIAL_AD_UNIT_ID
			});
		} catch (err) {
			reject(err || new Error('AD_INSTANCE_FAILED'));
			return;
		}

		if (!ad) {
			reject(new Error('AD_INSTANCE_FAILED'));
			return;
		}

		ad.onClose(() => {
			if (settled) return;
			settled = true;
			resolve(true);
		});

		ad.onError((err) => {
			if (settled) return;
			settled = true;
			reject(err || new Error('AD_PLAY_FAILED'));
		});

		ad.show().catch(() => {
			ad.load()
				.then(() => ad.show())
				.catch((err) => {
					if (settled) return;
					settled = true;
					reject(err || new Error('AD_LOAD_FAILED'));
				});
		});
	});
};

export const getInterstitialAdUnitId = () => INTERSTITIAL_AD_UNIT_ID;
