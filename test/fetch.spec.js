const proxyquire = require('proxyquire');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const stub = { logger: {} };
const fetch = proxyquire('../fetch', {
	'@financial-times/n-logger': { default: stub.logger },
	'node-fetch': (url) => stub.fetch(url)
});

describe('fetch', () => {
	beforeEach(() => {
		stub.fetch = sinon.stub();
		stub.logger.warn = sinon.stub();
	});
	it('fetches', () => {
		stub.fetch.withArgs('https://www.teddy.com/status').returns(Promise.resolve({ ok: true, json: () => Promise.resolve({ foo: 'bar' }) }));
		return fetch('https://www.teddy.com/status').then(data => {
			expect(data).to.deep.equal({ foo: 'bar' });
		});
	});
	it('fetches with an error', () => {
		stub.fetch.withArgs('https://www.teddy.com/status').returns(Promise.resolve({ ok: false, status: 500, statusText: 'internal error', text: () => Promise.resolve('bad response') }));
		return fetch('https://www.teddy.com/status')
			.then(() => { throw new Error('it should throw an error') })
			.catch(error => {
				expect(stub.logger.warn).calledWith({ event: 'N_FETCH_ERROR', input: 'https://www.teddy.com/status', statusCode: 500, statusText: 'internal error' });
				expect(error).to.exist
					.and.be.instanceof(Error)
					.and.have.property('message', 'bad response');
			});
	});
	it('error', () => {
		stub.fetch.withArgs('https://www.teddy.com/status').returns(Promise.reject(new Error('bad code?')));
		return fetch('https://www.teddy.com/status')
			.then(() => { throw new Error('it should throw an error') })
			.catch(error => {
				expect(stub.logger.warn).not.called;
				expect(error).to.exist
					.and.be.instanceof(Error)
					.and.have.property('message', 'bad code?');
			});
	});
	it('strips out query in logging', () => {
		stub.fetch.withArgs('https://www.teddy.com/status?id=1234&key=abc').returns(Promise.resolve({ ok: false, status: 500, statusText: 'internal error', text: () => Promise.resolve('bad response') }));
		return fetch('https://www.teddy.com/status?id=1234&key=abc')
			.then(() => { throw new Error('it should throw an error') })
			.catch(error => {
				expect(stub.logger.warn).calledWith({ event: 'N_FETCH_ERROR', input: 'https://www.teddy.com/status', statusCode: 500, statusText: 'internal error' });
				expect(error).to.exist
					.and.be.instanceof(Error)
					.and.have.property('message', 'bad response');
			});
	});
});
