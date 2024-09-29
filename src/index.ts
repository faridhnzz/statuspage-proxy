import { AttributeRewriter, AttributeRemover } from './utils';
import { apiStatus } from './types';

const routes: Record<string, string> = {
	'status.tunadev.com': 'https://tunadev.statuspage.io',
	'status.fontlay.com': 'https://fontlay.statuspage.io',
};

async function handleRequest(request: Request) {
	const url = new URL(request.url);
	const upstream = routeByHosts(url.hostname);
	if (!upstream) return new Response('Routes not found :(', { status: 404 });

	const newUrl = new URL(upstream + url.pathname);
	const newReq = new Request(newUrl.toString(), {
		method: request.method,
		body: request.body,
		redirect: 'manual',
		cf: { minify: { html: true } },
	});
	newReq.headers.set('Host', newUrl.host);
	newReq.headers.set('Referer', newUrl.origin);

	// HTML Rewriter for remove footer :hehe:
	const rewriter = new HTMLRewriter()
		.on('a', new AttributeRewriter('href', upstream))
		.on('div.page-footer.border-color.font-small > span > a', new AttributeRewriter('href', upstream))
		.on('link[rel="alternate"]', new AttributeRewriter('href', upstream))
		.on('div.incidents-list.format-expanded', new AttributeRemover());

	let res = await fetch(newReq);
	const filteredHeaders = new Headers(res.headers);

	// Clean up unnecessary headers from the response
	const headersToDelete = [
		'Via',
		'Report-to',
		'Nel',
		'Atl-Traceid',
		'x-statuspage-version',
		'x-statuspage-skip-logging',
		'x-pollinator-metadata-service',
		'x-permitted-cross-domain-policies',
	];
	headersToDelete.forEach((header) => filteredHeaders.delete(header));
	res = new Response(res.body, { ...res, headers: filteredHeaders });

	const contentType = res.headers.get('Content-Type');

	if (contentType?.startsWith('text/html')) {
		return rewriter.transform(res);
	}

	if (contentType?.startsWith('application/atom+xml') || contentType?.startsWith('application/rss+xml')) {
		let txt = await res.text();
		const regex = new RegExp(`${newUrl.hostname.split('.')[0]}\\.statuspage\\.io`, 'g');
		txt = txt.replace(regex, url.host);
		return new Response(txt, res);
	}

	if (url.pathname.startsWith('/api/v2/status.json')) {
		let json: apiStatus = await res.json();
		json.page.url = url.origin;
		return new Response(JSON.stringify(json), res);
	}

	return res;
}

function routeByHosts(host: string): string | null {
	return routes[host] || null;
}

// Let's go!
export default {
	async fetch(request: Request): Promise<Response> {
		try {
			return await handleRequest(request);
		} catch (err) {
			console.error(err);
			return new Response('500 | Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler;
