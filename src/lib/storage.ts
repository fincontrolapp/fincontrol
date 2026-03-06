import { CashFlowEntry, InvoiceEntry, InventoryItem, DailyCashEntry, ClientContact } from "@/types/finance";

const STORAGE_KEYS = {
  cashFlow: "fincontrol_cashflow",
  invoices: "fincontrol_invoices",
  inventory: "fincontrol_inventory",
  dailyCash: "fincontrol_dailycash",
  clients: "fincontrol_clients",
};

function load<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getCashFlow(): CashFlowEntry[] {
  return load<CashFlowEntry>(STORAGE_KEYS.cashFlow);
}
export function saveCashFlow(data: CashFlowEntry[]) {
  save(STORAGE_KEYS.cashFlow, data);
}

export function getInvoices(): InvoiceEntry[] {
  return load<InvoiceEntry>(STORAGE_KEYS.invoices);
}
export function saveInvoices(data: InvoiceEntry[]) {
  save(STORAGE_KEYS.invoices, data);
}

export function getInventory(): InventoryItem[] {
  return load<InventoryItem>(STORAGE_KEYS.inventory);
}
export function saveInventory(data: InventoryItem[]) {
  save(STORAGE_KEYS.inventory, data);
}

export function getDailyCash(): DailyCashEntry[] {
  return load<DailyCashEntry>(STORAGE_KEYS.dailyCash);
}
export function saveDailyCash(data: DailyCashEntry[]) {
  save(STORAGE_KEYS.dailyCash, data);
}

export function getClients(): ClientContact[] {
  return load<ClientContact>(STORAGE_KEYS.clients);
}
export function saveClients(data: ClientContact[]) {
  save(STORAGE_KEYS.clients, data);
}
