(() => {
	const tryParse = str => {
		try {
			return typeof str === "string" ? JSON.parse(str) : undefined;
		} catch {
			return;
		}
	};

	const tryArr = arr => Array.isArray(arr) ? arr : [];

	const originalOpen = XMLHttpRequest.prototype.open;
	const originalSend = XMLHttpRequest.prototype.send;
	XMLHttpRequest.prototype.open = function (...args) {
		this._chUrl = args[1];
		originalOpen.apply(this, args);
	};
	XMLHttpRequest.prototype.send = function (...args) {
		this.addEventListener("readystatechange", () => {
			if (this.readyState !== 4) return;
			if (!/^.*:\/\/api.chzzk.naver.com\/service\/.*\/live-detail/.test(this._chUrl)) return;
			let str = this.response;

			const data = tryParse(str);
			const lpj = tryParse(data?.content?.livePlaybackJson);
			if (!lpj) return;
			delete lpj?.meta?.p2p;
			for (const m of tryArr(lpj?.media)) {
				for (const e of tryArr(m?.encodingTrack)) {
					delete e?.p2pPath;
					delete e?.p2pPathUrlEncoding;
				}
			}
			data.content.livePlaybackJson = JSON.stringify(lpj);
			str = JSON.stringify(data);

			Object.defineProperty(this, "responseText", { value: str });
			Object.defineProperty(this, "response", { value: str });
		});
		originalSend.apply(this, args);
	};
})();
