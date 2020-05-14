let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config");

const configureClient = async() => {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        audience: config.audience,
        scope: 'profile email write:messages read:messages'
    });
};

window.onload = async() => {
    await configureClient();

    updateUI();

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {

        // Process the login state
        await auth0.handleRedirectCallback();

        updateUI();

        // Use replaceState to redirect the user away and remove the querystring parameters
        window.history.replaceState({}, document.title, "/");
    }
}

const updateUI = async() => {
    const isAuthenticated = await auth0.isAuthenticated();

    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;
    document.getElementById("btn-call-api").disabled = !isAuthenticated;
    document.getElementById("btn-call-scoped-api").disabled = !isAuthenticated;

    if (isAuthenticated) {
        document.getElementById("gated-content").classList.remove("hidden");

        document.getElementById("ipt-access-token").innerHTML = await auth0.getTokenSilently();

        document.getElementById("ipt-user-profile").textContent = JSON.stringify(await auth0.getUser(), {}, 2);

    } else {
        document.getElementById("gated-content").classList.add("hidden");
    }
};

const login = async() => {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.origin
    });
};

const logout = () => {
    auth0.logout({
        returnTo: window.location.origin
    });
};

const callApi = async() => {
    try {
        // Get the access token from the Auth0 client
        const token = await auth0.getTokenSilently();

        // Make the call to the API, setting the token
        // in the Authorization header
        const response = await fetch("/api/private", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // Fetch the JSON result
        const responseData = await response.json();

        // Display the result in the output element
        const responseElement = document.getElementById("api-call-result");

        responseElement.innerText = JSON.stringify(responseData, {}, 2);
    } catch (e) {
        // Display errors in the console
        console.error(e);
    }
};

const callScopedApi = async() => {
    try {
        // Get the access token from the Auth0 client
        const token = await auth0.getTokenSilently();

        // Make the call to the API, setting the token
        // in the Authorization header
        const response = await fetch("/api/private-scoped", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // Fetch the JSON result
        const responseData = await response.json();

        // Display the result in the output element
        const responseElement = document.getElementById("scoped-api-call-result");

        responseElement.innerText = JSON.stringify(responseData, {}, 2);
    } catch (e) {
        // Display errors in the console
        console.error(e);
    }
};