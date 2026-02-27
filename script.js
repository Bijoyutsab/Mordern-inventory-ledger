// --- Data ---
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let totalProfit = parseFloat(localStorage.getItem('profit')) || 0;
let wallet = parseFloat(localStorage.getItem('wallet')) || 0;
let bills = JSON.parse(localStorage.getItem('bills')) || [];
let history = JSON.parse(localStorage.getItem('history')) || [];

// --- Save & History ---
function saveData() {
  localStorage.setItem('inventory', JSON.stringify(inventory));
  localStorage.setItem('profit', totalProfit);
  localStorage.setItem('wallet', wallet);
  localStorage.setItem('bills', JSON.stringify(bills));
  localStorage.setItem('history', JSON.stringify(history));
}

function logHistory(action) {
  const timestamp = new Date().toLocaleString();
  history.unshift(`${timestamp} — ${action}`);
  if (history.length > 50) history.pop();
  renderHistory();
  saveData();
}

// --- Rendering ---
function render(filtered = null) {
  const list = document.getElementById('inv-list');
  list.innerHTML = '';
  const itemsToRender = filtered || inventory;

  itemsToRender.forEach(item => {
    const li = document.createElement('li');
    if (item.qty <= 5) li.classList.add('low');
    const profitPerUnit = item.sell - item.buy;
    const profitClass = profitPerUnit >= 0 ? 'profit' : 'loss';

    li.innerHTML = `
      <strong>${item.name}</strong> — Qty: ${item.qty}, 
      Buy: $${item.buy}, Sell: $${item.sell}
      ${item.qty <= 5 ? '<br><span class="loss">Needs Restocking!</span>' : ''}
      <br><span class="${profitClass}">Per unit: ${profitPerUnit >= 0 ? '+' : ''}$${profitPerUnit}</span>
      <br>
      <button class="sell" onclick="sellItem('${item.name}')">Sell One</button>
      <button class="sell" onclick="sellBargain('${item.name}')">Sell Bargain</button>
      <button class="update" onclick="updatePrices('${item.name}')">Update Price</button>
      <button class="update" onclick="restockItem('${item.name}')">Restock</button>
      <button class="remove" onclick="removeItem('${item.name}')">Remove</button>
    `;
    list.appendChild(li);
  });

  document.getElementById('profit-summary').textContent =
    `Total profit/loss: $${totalProfit.toFixed(2)}`;
  document.getElementById('wallet-summary').textContent =
    `Wallet balance: $${wallet.toFixed(2)}`;

  renderBills();
  renderHistory();
  saveData();
}

function renderBills() {
  const billList = document.getElementById('bill-list');
  billList.innerHTML = '';
  bills.forEach((b, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${b.name}: $${b.cost} 
      <button class="pay" onclick="payBill(${index})">Pay</button>`;
    billList.appendChild(li);
  });
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  history.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    list.appendChild(li);
  });
}

// --- Inventory Functions ---
function addItem(name, qty, buy, sell) {
  const existing = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.qty += qty;
    existing.buy = buy;
    existing.sell = sell;
  } else {
    inventory.push({ name, qty, buy, sell });
  }
  logHistory(`Added item: ${name}, Qty: ${qty}, Buy: $${buy}, Sell: $${sell}`);
  render();
}

function sellItem(name) {
  const item = inventory.find(i => i.name === name);
  if (!item || item.qty <= 0) return;
  item.qty -= 1;
  const profit = item.sell - item.buy;
  totalProfit += profit;
  wallet += item.sell;
  logHistory(`Sold 1 ${item.name} for $${item.sell} (Profit: $${profit})`);
  render();
}

function sellBargain(name) {
  const item = inventory.find(i => i.name === name);
  if (!item || item.qty <= 0) return;
  const discount = parseFloat(prompt("Enter discount amount (e.g., 5, 10, 20):"));
  if (!discount || discount <= 0) return;
  item.qty -= 1;
  const finalSell = item.sell - discount;
  const profit = finalSell - item.buy;
  totalProfit += profit;
  wallet += finalSell;
  logHistory(`Sold 1 ${item.name} at bargain ($${finalSell}, discount $${discount})`);
  render();
}

function restockItem(name) {
  const item = inventory.find(i => i.name === name);
  if (!item) return;
  const qtyToAdd = parseInt(prompt(`How many units to restock for ${item.name}?`), 10);
  if (!qtyToAdd || qtyToAdd <= 0) return;
  const cost = qtyToAdd * item.buy;
  if (wallet >= cost) {
    wallet -= cost;
    item.qty += qtyToAdd;
    logHistory(`Restocked ${qtyToAdd} ${item.name}(s) for $${cost}`);
    render();
  } else {
    alert("Not enough money in wallet to restock!");
  }
}

function removeItem(name) {
  const idx = inventory.findIndex(i => i.name === name);
  if (idx !== -1) {
    logHistory(`Removed item: ${inventory[idx].name}`);
    inventory.splice(idx, 1);
  }
  render();
}

function updatePrices(name) {
  const item = inventory.find(i => i.name === name);
  if (!item) return;
  const newSell = prompt(`New sell price for ${item.name}`, item.sell);
  if (newSell !== null && newSell !== '') {
    item.sell = parseFloat(newSell);
    logHistory(`Updated sell price for ${item.name} to $${item.sell}`);
  }
  render();
}

// --- Bills ---
function addBill(name, cost) {
  bills.push({ name, cost });
  logHistory(`Added bill: ${name} ($${cost})`);
  render();
}

function payBill(index) {
  const bill = bills[index];
  if (!bill) return;
  if (wallet >= bill.cost) {
    wallet -= bill.cost;
    logHistory(`Paid bill: ${bill.name} ($${bill.cost})`);
    bills.splice(index, 1);
    render();
  } else {
    alert("Not enough money in wallet to pay this bill!");
  }
}

// --- Event Listeners ---
document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const qty = parseInt(form.qty.value, 10);
  const buy = parseFloat(form.buy.value);
  const sell = parseFloat(form.sell.value);
  addItem(name, qty, buy, sell);
  form.reset();
});

document.getElementById('bill-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = e.target['bill-name'].value.trim();
  const cost = parseFloat(e.target['bill-cost'].value);
  addBill(name, cost);
  e.target.reset();
});

document.getElementById('search-form').addEventListener('submit', e => {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  if (query === '') {
    render();
    return;
  }
  const filtered = inventory.filter(i => i.name.toLowerCase().includes(query));
  render(filtered);
});

document.getElementById('toggle-dark').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

document.getElementById('reset-profit').addEventListener('click', () => {
  totalProfit = 0;
  logHistory("Reset total profit/loss");
  saveData();
  render();
});

document.getElementById('wallet-add').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('wallet-amount').value);
  if (!amount || amount <= 0) return;
  wallet += amount;
  logHistory(`Deposited $${amount} into wallet`);
  document.getElementById('wallet-amount').value = '';
  render();
});

document.getElementById('wallet-remove').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('wallet-amount').value);
  if (!amount || amount <= 0) return;
  if (wallet >= amount) {
    wallet -= amount;
    logHistory(`Withdrew $${amount} from wallet`);
  } else {
    alert("Not enough money in wallet!");
  }
  document.getElementById('wallet-amount').value = '';
  render();
});

function clearHistory() {
  history = []; // wipe the history array
  renderHistory(); // refresh the UI
  saveData(); // update localStorage
}

document.getElementById('clear-history-form').addEventListener('submit', e => {
  e.preventDefault();
  if (confirm("Are you sure you want to clear all history?")) {
    clearHistory();
  }
});

let shopInfo = JSON.parse(localStorage.getItem('shopInfo')) || {
  name: "BU Gift Shop",
  postal: "1345",
  phone: "01937194449",
  products: ["Sunglasses", "Watches", "Jars"]
};

