
const $ = id => document.getElementById(id);
const CATEGORIES = [
    "Food", "Transport", "Shopping", "Bills",
    "Entertainment", "Health", "Education", "Other"
];

const COLORS = [
    "#159b78", "#4682f4", "#f2a541", "#8b6be8",
    "#eb668c", "#30a7bd", "#92a1b5", "#d1a14b"
];

const money = amount => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR"
}).format(amount);

const today = new Date();
const monthString = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const dateString = d =>
    `${monthString(d)}-${String(d.getDate()).padStart(2, "0")}`;

function load(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch {
        return fallback;
    }
}

let transactions = load("expenseflow-transactions", []);
let budgets = load("expenseflow-budgets", {});
let categoryChart = null;
let barChart = null;

$("monthFilter").value = monthString(today);
$("date").value = dateString(today);

function save() {
    localStorage.setItem("expenseflow-transactions", JSON.stringify(transactions));
    localStorage.setItem("expenseflow-budgets", JSON.stringify(budgets));
}

function selectedTransactions() {
    const month = $("monthFilter").value;
    return transactions.filter(t => t.date.startsWith(month));
}

function totalsByCategory(items) {
    const result = {};
    items.forEach(t => {
        result[t.category] = (result[t.category] || 0) + t.amount;
    });
    return result;
}

function spendingTotal(items) {
    return items.reduce((sum, t) => sum + t.amount, 0);
}

function getAlerts(items) {
    const totals = totalsByCategory(items);
    return Object.entries(budgets).filter(
        ([category, limit]) => totals[category] > limit
    );
}

function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2500);
}

function safe(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[ch]);
}

function transactionHTML(t) {
    return `
        <div class="transaction">
            <div class="tx-left">
                <div class="tx-icon">${safe(t.category.slice(0, 1))}</div>
                <div>
                    <div class="tx-description">${safe(t.description)}</div>
                    <div class="tx-meta">${safe(t.category)} · ${safe(t.date)}</div>
                </div>
            </div>
            <div>
                <div class="tx-amount">${money(t.amount)}</div>
                <button class="delete" data-delete="${t.id}">Delete</button>
            </div>
        </div>`;
}

function renderTransactions() {
    const query = $("search").value.trim().toLowerCase();
    const category = $("categoryFilter").value;
    const sort = $("sort").value;

    let items = [...selectedTransactions()].filter(t =>
        (t.description.toLowerCase().includes(query) ||
         t.category.toLowerCase().includes(query)) &&
        (!category || t.category === category)
    );

    if (sort === "newest") items.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    if (sort === "oldest") items.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    if (sort === "high") items.sort((a, b) => b.amount - a.amount);
    if (sort === "low") items.sort((a, b) => a.amount - b.amount);

    $("transactionList").innerHTML = items.length
        ? items.map(transactionHTML).join("")
        : '<p class="empty">No matching expenses found for this month.</p>';
}

function renderBudgets() {
    const items = selectedTransactions();
    const totals = totalsByCategory(items);

    const html = CATEGORIES.filter(c => budgets[c] !== undefined)
        .map(category => {
            const limit = budgets[category];
            const spent = totals[category] || 0;
            const percent = limit > 0 ? spent / limit * 100 : 0;
            const width = Math.min(percent, 100);
            const over = spent > limit;

            return `
                <div class="progress-row">
                    <div class="progress-label">
                        <strong>${safe(category)}</strong>
                        <span>${money(spent)} / ${money(limit)}</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${over ? "over" : ""}"
                             style="width:${width}%"></div>
                    </div>
                    ${over
                        ? `<p class="alert">Budget exceeded by ${money(spent - limit)}</p>`
                        : `<p class="tx-meta">${Math.round(percent)}% used · ${money(limit - spent)} remaining</p>`
                    }
                </div>`;
        }).join("");

    $("budgetOverview").innerHTML = html ||
        '<p class="empty">Set a budget to track your spending.</p>';

    $("allBudgets").innerHTML = html ||
        '<p class="empty">No budgets created yet.</p>';

    $("alertCount").textContent = getAlerts(items).length;
}

function renderCharts(items) {
    const totals = totalsByCategory(items);
    const labels = Object.keys(totals);
    const values = Object.values(totals);
    const colors = labels.map(c => COLORS[CATEGORIES.indexOf(c)] || "#92a1b5");

    if (categoryChart) categoryChart.destroy();
    if (barChart) barChart.destroy();

    categoryChart = new Chart($("categoryChart"), {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } }
        }
    });

    barChart = new Chart($("barChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Expenses (₹)",
                data: values,
                backgroundColor: colors,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderReport(items) {
    const totals = totalsByCategory(items);
    $("reportMonth").textContent = `Report for ${$("monthFilter").value}`;
    $("reportTotal").textContent = money(spendingTotal(items));

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    $("reportCategories").innerHTML = entries.length
        ? entries.map(([category, total], index) => `
            <div class="transaction">
                <div>${index + 1}. ${safe(category)}</div>
                <strong>${money(total)}</strong>
            </div>`).join("")
        : '<p class="empty">No expenses recorded for this month.</p>';
}

function renderDashboard() {
    const items = selectedTransactions();
    const total = spendingTotal(items);
    const totals = totalsByCategory(items);
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];

    $("total").textContent = money(total);
    $("count").textContent = items.length;
    $("topCategory").textContent = top ? top[0] : "—";

    const recent = [...items]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .slice(0, 5);

    $("recentList").innerHTML = recent.length
        ? recent.map(transactionHTML).join("")
        : '<p class="empty">No expenses this month. Add your first expense!</p>';

    renderBudgets();
    renderCharts(items);
    renderTransactions();
    renderReport(items);
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section =>
        section.classList.add("hidden")
    );
    $(`${page}Page`).classList.remove("hidden");

    document.querySelectorAll(".nav").forEach(button =>
        button.classList.toggle("active", button.dataset.page === page)
    );

    const titles = {
        dashboard: "Dashboard",
        transactions: "Transactions",
        budgets: "Budgets",
        reports: "Reports"
    };

    $("pageTitle").textContent = titles[page];
    if (page === "dashboard") renderDashboard();
    if (page === "transactions") renderTransactions();
    if (page === "budgets") renderBudgets();
    if (page === "reports") renderReport(selectedTransactions());
}

function openModal() {
    $("expenseModal").classList.remove("hidden");
    $("date").value = dateString(today);
    $("amount").focus();
}

function closeModal() {
    $("expenseModal").classList.add("hidden");
}

$("addTop").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("expenseModal").addEventListener("click", event => {
    if (event.target === $("expenseModal")) closeModal();
});

$("expenseForm").addEventListener("submit", event => {
    event.preventDefault();

    const amount = Number($("amount").value);
    const date = $("date").value;
    const description = $("description").value.trim();

    if (!Number.isFinite(amount) || amount <= 0 || !date || !description) {
        toast("Please enter valid expense details.");
        return;
    }

    transactions.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        amount,
        date,
        category: $("category").value,
        description
    });

    save();
    $("monthFilter").value = monthString(new Date(`${date}T12:00:00`));
    $("expenseForm").reset();
    $("date").value = dateString(today);
    closeModal();
    renderDashboard();
    toast("Expense added successfully!");
});

$("budgetForm").addEventListener("submit", event => {
    event.preventDefault();

    const category = $("budgetCategory").value;
    const amount = Number($("budgetAmount").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        toast("Enter a valid budget.");
        return;
    }

    budgets[category] = amount;
    save();
    $("budgetAmount").value = "";
    renderDashboard();
    toast("Budget saved successfully!");
});

$("monthFilter").addEventListener("change", renderDashboard);
$("search").addEventListener("input", renderTransactions);
$("categoryFilter").addEventListener("change", renderTransactions);
$("sort").addEventListener("change", renderTransactions);

document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.go));
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;

    const id = Number(button.dataset.delete);
    if (!confirm("Delete this expense?")) return;

    transactions = transactions.filter(t => t.id !== id);
    save();
    renderDashboard();
    toast("Expense deleted.");
});

$("exportCsv").addEventListener("click", () => {
    const items = selectedTransactions();
    const quote = value => `"${String(value).replace(/"/g, '""')}"`;

    const csv = [
        ["Date", "Category", "Description", "Amount"],
        ...items.map(t => [t.date, t.category, t.description, t.amount])
    ].map(row => row.map(quote).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${$("monthFilter").value}.csv`;
    link.click();
    URL.revokeObjectURL(url);
});

renderDashboard();
