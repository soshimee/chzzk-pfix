const tryParse = str => {
	try {
		return typeof str === "string" ? JSON.parse(str) : undefined;
	} catch {
		return;
	}
};

const tryArr = arr => Array.isArray(arr) ? arr : [];

browser.webRequest.onBeforeRequest.addListener((details) => {
	const filter = browser.webRequest.filterResponseData(details.requestId);
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	filter.ondata = (event) => {
		let str = decoder.decode(event.data, { stream: true });
		
		const data = tryParse(str);
		const lpj = tryParse(data?.content?.livePlaybackJson);
		if (!lpj) return filter.write(event.data);
		delete lpj?.meta?.p2p;
		for (const m of tryArr(lpj?.media)) {
			for (const e of tryArr(m?.encodingTrack)) {
				delete e?.p2pPath;
				delete e?.p2pPathUrlEncoding;
			}
		}
		data.content.livePlaybackJson = JSON.stringify(lpj);
		str = JSON.stringify(data);
		
		filter.write(encoder.encode(str));
	};

	filter.onstop = (event) => {
		filter.disconnect();
	};

	return {};
}, { urls: ["*://api.chzzk.naver.com/service/*/live-detail*"], types: ["xmlhttprequest"] }, ["blocking"]);
