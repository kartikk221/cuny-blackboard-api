import fetch from 'cross-fetch';
import makeFetchCookie from 'fetch-cookie';

// Define constants
export const URL_BASE = 'https://bbhosted.cuny.edu';
export const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36';
const IMPORTANT_COOKIES = [
    'JSESSIONID',
    // 'OAMAuthnHintCookie',
    // 'BIGipServerbbhosted_https_pl',
    // 'OAMAuthnCookie_bbhosted',
    // 'web_client_cache_guid',
    'BbRouter',
];

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
 * @returns Resolves a `string` if successful, returns `null` if credentials are invalid.
 */
export async function generate_session_cookies(username: string, password: string): Promise<string | null> {
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

        // Return the session cookies in header format
        return cookies
            .filter((cookie) => IMPORTANT_COOKIES.includes(cookie.key))
            .map((cookie) => `${cookie.key}=${cookie.value}`)
            .join('; ');
    }

    // Otherwise, authentication failed
    return null;
}
