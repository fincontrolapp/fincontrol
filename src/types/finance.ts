export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "entrada" | "saida";
  value: number;
  status: "pago" | "pendente";
  account: string;
}

export interface InvoiceEntry {
  id: string;
  number: string;
  issueDate: string;
  clientSupplier: string;
  cnpjCpf: string;
  grossValue: number;
  iss: number;
  pis: number;
  cofins: number;
  netValue: number;
  pdfLink: string;
  competence: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  minStock: number;
  entries: number;
  exits: number;
  currentBalance: number;
  unitCost: number;
  totalValue: number;
}

export interface DailyCashEntry {
  id: string;
  date: string;
  time: string;
  description: string;
  openingValue: number;
  cashIn: number;
  pixIn: number;
  debitIn: number;
  creditIn: number;
  cashOut: number;
  closingValue: number;
}

export interface ClientContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
}
