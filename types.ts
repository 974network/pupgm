
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
}

export type PropertyType = 'apartment' | 'villa' | 'commercial' | 'land';

export interface Property {
  id: string;
  userId: string;
  name: string;
  type: PropertyType;
  address: string;
  purchasePrice: number;
  currentValue: number;
  image?: string;
}

export interface Transaction {
  id: string;
  propertyId: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface AppState {
  currentUser: User | null;
  properties: Property[];
  transactions: Transaction[];
}
