const logger = require('@dotcom-reliability-kit/logger');
const nodeFetch = require('node-fetch');
const httpError = require('http-errors');

module.exports = (input, init) => {
	return (global.fetch || nodeFetch)(input, init)
		.then(response => {
			const contentType = response.headers.get('content-type');

			if (response.ok) {
				if (contentType && contentType.includes('application/json')) {
					return response.json();
				} else {
					return response.text();
				}
			} else {
				logger.warn({
					event: 'N_FETCH_ERROR',
					input: typeof input === 'string' ? input.replace(/\?.*$/, '') : `${typeof input} type`, // the URL without query string
					statusCode: response.status,
					statusText: response.statusText,
				});
				return response.text()
					.then((text) => {
						throw httpError(response.status, text);
					});
			}
		});
};
