const API_BASE_URL = "https://smartspend-production-c854.up.railway.app/api";

export const apiRequest = async (
    endpoint,
    options = {}
) => {

    // Check remembered login first,
    // then check current-session login.
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (!response.ok) {

        let message = "Something went wrong";

        try {

            const errorData =
                await response.json();

            message =
                errorData.message ||
                errorData.error ||
                message;

        } catch {
            // Ignore non-JSON errors
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};


// AUTH

export const signup = (data) =>
    apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data)
    });


export const login = (data) =>
    apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(data)
    });


// USER

export const getCurrentUser = () =>
    apiRequest("/users/me");


// CATEGORIES

export const getCategories = () =>
    apiRequest("/categories");


// EXPENSES

export const getExpenses = () =>
    apiRequest("/expenses");


export const getExpense = (id) =>
    apiRequest(`/expenses/${id}`);


export const addExpense = (data) =>
    apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify(data)
    });


export const updateExpense = (id, data) =>
    apiRequest(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });


export const deleteExpense = (id) =>
    apiRequest(`/expenses/${id}`, {
        method: "DELETE"
    });


export const getDashboardSummary = () =>
    apiRequest("/expenses/summary");


export const getMonthlyExpenses = () =>
    apiRequest("/expenses/monthly");


// BUDGETS

export const getBudgets = () =>
    apiRequest("/budgets");


export const getBudgetOverview = () =>
    apiRequest("/budgets/overview");


export const addBudget = (data) =>
    apiRequest("/budgets", {
        method: "POST",
        body: JSON.stringify(data)
    });


export const updateBudget = (id, data) =>
    apiRequest(`/budgets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });


export const deleteBudget = (id) =>
    apiRequest(`/budgets/${id}`, {
        method: "DELETE"
    });


// BADGES

export const getBadges = () =>
    apiRequest("/badges");


export const addBadge = (data) =>
    apiRequest("/badges", {
        method: "POST",
        body: JSON.stringify(data)
    });