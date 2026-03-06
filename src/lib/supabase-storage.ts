import { supabase } from "@/integrations/supabase/client";

// Cash Flow
export async function getCashFlowDB() {
  const { data, error } = await supabase.from("cash_flow").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCashFlowDB(entry: {
  date: string; description: string; category: string; type: string; value: number; status: string; account: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase.from("cash_flow").insert({ ...entry, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCashFlowDB(id: string) {
  const { error } = await supabase.from("cash_flow").delete().eq("id", id);
  if (error) throw error;
}

// Invoices
export async function getInvoicesDB() {
  const { data, error } = await supabase.from("invoices").select("*").order("issue_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addInvoiceDB(entry: {
  number: string; issue_date: string; client_supplier: string; cnpj_cpf: string;
  gross_value: number; iss: number; pis: number; cofins: number; net_value: number;
  pdf_link: string; competence: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase.from("invoices").insert({ ...entry, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInvoiceDB(id: string) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
}

// Inventory
export async function getInventoryDB() {
  const { data, error } = await supabase.from("inventory").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addInventoryDB(entry: {
  code: string; name: string; unit: string; min_stock: number;
  entries: number; exits: number; current_balance: number; unit_cost: number; total_value: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase.from("inventory").insert({ ...entry, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryDB(id: string) {
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}

// Daily Cash
export async function getDailyCashDB() {
  const { data, error } = await supabase.from("daily_cash").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addDailyCashDB(entry: {
  date: string; time: string; description: string; opening_value: number;
  cash_in: number; pix_in: number; debit_in: number; credit_in: number;
  cash_out: number; closing_value: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase.from("daily_cash").insert({ ...entry, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDailyCashDB(id: string) {
  const { error } = await supabase.from("daily_cash").delete().eq("id", id);
  if (error) throw error;
}

// Clients
export async function getClientsDB() {
  const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addClientDB(entry: {
  name: string; phone: string; email: string; address: string; birth_date: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase.from("clients").insert({ ...entry, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClientDB(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
