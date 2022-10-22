import fetch from 'cross-fetch';
import makeFetchCookie from 'fetch-cookie';
import { api_request } from './methods';
import { URL_BASE, USER_AGENT, SESSION_COOKIES, ERROR_CODES } from './shared';

// Workaround because tough-cookie doesn't have types
interface Cookie {
    key: string;
    value: string;
}

/**
 * Generates and returns session cookies for Blackboard.
 *
 * @param username CUNYfirst username
 * @param password CUNYfirst password
 * @returns Resolves a `Map` if successful, returns `null` if credentials are invalid.
 */
export async function generate_session_cookies(
    username: string,
    password: string
): Promise<Map<string, string> | null> {
    // Create a fetch instance with cookie support
    const jar = new makeFetchCookie.toughCookie.CookieJar();
    const fetch_with_cookies = makeFetchCookie(fetch, jar);

    // Make a GET request to the base URL to retrieve the login page and associated cookies
    const login_page = await fetch_with_cookies(URL_BASE, {
        maxRedirect: 5,
        headers: {
            'user-agent': USER_AGENT,
        },
    });

    // Make a POST request to the login endpoint to authenticate
    const response = await fetch_with_cookies(`${new URL(login_page.url).origin}/oam/server/auth_cred_submit`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': USER_AGENT,
        },
        body: `usernameH=${encodeURIComponent(username)}&username=${encodeURIComponent(
            username.split('@')[0].toLowerCase()
        )}&password=${password}&submit=`,
        maxRedirect: 5,
    });

    // If the response arrives on a URL that starts with the base URL, authentication was successful
    if (response.url.startsWith(URL_BASE)) {
        // Retrieve the cookies from the cookie jar
        const cookies: Cookie[] = await jar.getCookies(URL_BASE, {
            allPaths: true,
            hostOnly: false,
        });

        // Convert the cookies into a map store
        const store = new Map<string, string>();
        for (const cookie of cookies) store.set(cookie.key, cookie.value);
        return store;
    }

    // Otherwise, authentication failed
    return null;
}

export async function refresh_session_cookies(cookies: string) {
    // Break the cookies string into a store
    // Retrieve the xsrf token from the BbRouter cookie
    let xsrf;
    const store = new Map<string, string>();
    cookies.split(';').forEach((cookie) => {
        // Split the cookie into a key and value pair
        const [key, value] = cookie.split('=');
        store.set(key.trim(), value);

        // If the cookie is the BbRouter cookie, extract the xsrf token
        if (key.trim().toLowerCase() === 'bbrouter')
            value.split(',').forEach((pair) => {
                const [key, value] = pair.split(':');
                const name = key.trim();
                if (name === 'xsrf') xsrf = value.trim();
            });
    });

    // If we do not have an xsrf token, we cannot refresh the session cookies aka. bad cookies
    if (!xsrf) throw new Error(ERROR_CODES.UNAUTHORIZED);

    // Make request to refresh the endpoint
    const response = await api_request('v1.private', '/utilities/timeUntilBbSessionInactive', {
        method: 'GET',
        redirect: 'error', // Don't follow redirects
        headers: {
            cookie: cookies,
            'X-Blackboard-XSRF': xsrf,
        },
    });

    // Ensure the response also delivers empty JSON as expected
    let body;
    try {
        body = (await response.json()) as { [key: string]: number };
    } catch (error) {
        throw new Error(ERROR_CODES.SERVER_ERROR);
    }

    // Parse the incoming set-cookie header
    const incoming = response.headers.get('set-cookie');
    if (incoming) {
        // Break the cookies string into a store
        incoming.split(', ').forEach((header) => {
            const [cookie] = header.split('; ');
            const [key, value] = cookie.split('=');
            store.set(key.trim(), value);
        });

        // Return the session cookies in header format
        return {
            store,
            expires_at: body.timeBeforeTimeout,
        };
    }
}

/**
 * Returns lifetime details about the provided session cookies.
 *
 * @param cookies The store of cookies
 * @returns Cookie lifetime details in milliseconds.
 */
export function get_cookies_life_details(cookies: Map<string, string>) {
    // Find the BbRouter cookie from the refreshed cookies
    let bb_router;
    for (const name of cookies.keys()) {
        if (name.toLowerCase() === 'bbrouter') {
            bb_router = cookies.get(name);
            break;
        }
    }

    if (bb_router) {
        // Retrieve the properties of the bb router cookie
        const properties = {} as { [key: string]: string };
        bb_router.split(',').forEach((property) => {
            const [key, value] = property.trim().split(':');
            properties[key] = value;
        });

        // Destructure relevant properties to determine expiry and age
        const { expires, timeout } = properties;
        if (expires && timeout) {
            // Convert the second based values to milliseconds
            const age = +timeout * 1000;
            const expires_at = +expires * 1000;

            // Send the token to the client
            return { age, expires_at };
        }
    }
}
