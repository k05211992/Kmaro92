"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from "react";
import type {
  QuoteItem,
  Plant,
  PriceType,
  DeliveryType,
  QuoteClientInfo,
  QuoteTotals,
} from "@/types";

// ---- Helper ----
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function generateQuoteNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `КП-${y}${m}${d}-${rand}`;
}

// ---- State ----
interface QuoteState {
  items: QuoteItem[];
  client_info: QuoteClientInfo;
  delivery_type: DeliveryType;
  delivery_cost: number;
  quote_number: string;
  created_at: Date;
}

// ---- Actions ----
type QuoteAction =
  | {
      type: "ADD_ITEM";
      plant: Plant;
      price_type: PriceType;
    }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "UPDATE_DISCOUNT"; id: string; discount: number }
  | { type: "UPDATE_PRICE_TYPE"; id: string; price_type: PriceType }
  | { type: "UPDATE_CLIENT_INFO"; client_info: QuoteClientInfo }
  | { type: "UPDATE_DELIVERY_TYPE"; delivery_type: DeliveryType }
  | { type: "UPDATE_DELIVERY_COST"; cost: number }
  | { type: "CLEAR_QUOTE" };

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case "ADD_ITEM": {
      // If plant already in quote — just increment quantity
      const existing = state.items.find(
        (it) => it.plant.id === action.plant.id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((it) =>
            it.plant.id === action.plant.id
              ? { ...it, quantity: it.quantity + 1 }
              : it
          ),
        };
      }
      const newItem: QuoteItem = {
        id: uid(),
        plant: action.plant,
        quantity: 1,
        price_type: action.price_type,
        discount: action.plant.discount_default,
      };
      return { ...state, items: [...state.items, newItem] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((it) => it.id !== action.id),
      };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id
            ? { ...it, quantity: Math.max(1, action.quantity) }
            : it
        ),
      };
    case "UPDATE_DISCOUNT":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id
            ? {
                ...it,
                discount: Math.min(100, Math.max(0, action.discount)),
              }
            : it
        ),
      };
    case "UPDATE_PRICE_TYPE":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, price_type: action.price_type } : it
        ),
      };
    case "UPDATE_CLIENT_INFO":
      return { ...state, client_info: action.client_info };
    case "UPDATE_DELIVERY_TYPE":
      return {
        ...state,
        delivery_type: action.delivery_type,
        delivery_cost: action.delivery_type === "none" ? 0 : state.delivery_cost,
      };
    case "UPDATE_DELIVERY_COST":
      return { ...state, delivery_cost: Math.max(0, action.cost) };
    case "CLEAR_QUOTE":
      return {
        ...initialState,
        quote_number: generateQuoteNumber(),
        created_at: new Date(),
      };
    default:
      return state;
  }
}

// ---- Context value type ----
interface QuoteContextValue {
  items: QuoteItem[];
  client_info: QuoteClientInfo;
  delivery_type: DeliveryType;
  delivery_cost: number;
  quote_number: string;
  created_at: Date;
  totals: QuoteTotals;
  addItem: (plant: Plant, price_type: PriceType) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateDiscount: (id: string, discount: number) => void;
  updatePriceType: (id: string, price_type: PriceType) => void;
  updateClientInfo: (info: QuoteClientInfo) => void;
  updateDeliveryType: (type: DeliveryType) => void;
  updateDeliveryCost: (cost: number) => void;
  clearQuote: () => void;
  isInQuote: (plantId: string) => boolean;
  getItemCount: () => number;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

const initialState: QuoteState = {
  items: [],
  client_info: { name: "", phone: "", comment: "" },
  delivery_type: "none",
  delivery_cost: 0,
  quote_number: generateQuoteNumber(),
  created_at: new Date(),
};

// ---- Compute effective price for an item ----
export function getEffectivePrice(item: QuoteItem): number {
  if (item.price_type === "wholesale" && item.plant.price_wholesale) {
    return item.plant.price_wholesale;
  }
  return item.plant.price_retail;
}

// ---- Compute line total ----
export function getLineTotal(item: QuoteItem): number {
  const price = getEffectivePrice(item);
  return price * item.quantity * (1 - item.discount / 100);
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  // Memoized totals
  const totals = useMemo<QuoteTotals>(() => {
    const subtotal = state.items.reduce((acc, item) => {
      return acc + getEffectivePrice(item) * item.quantity;
    }, 0);

    const subtotal_after_discount = state.items.reduce((acc, item) => {
      return acc + getLineTotal(item);
    }, 0);

    const discount_amount = subtotal - subtotal_after_discount;
    const delivery =
      state.delivery_type === "none" ? 0 : state.delivery_cost;
    const total = subtotal_after_discount + delivery;

    return { subtotal, discount_amount, subtotal_after_discount, delivery, total };
  }, [state.items, state.delivery_type, state.delivery_cost]);

  const addItem = useCallback(
    (plant: Plant, price_type: PriceType) =>
      dispatch({ type: "ADD_ITEM", plant, price_type }),
    []
  );
  const removeItem = useCallback(
    (id: string) => dispatch({ type: "REMOVE_ITEM", id }),
    []
  );
  const updateQuantity = useCallback(
    (id: string, quantity: number) =>
      dispatch({ type: "UPDATE_QUANTITY", id, quantity }),
    []
  );
  const updateDiscount = useCallback(
    (id: string, discount: number) =>
      dispatch({ type: "UPDATE_DISCOUNT", id, discount }),
    []
  );
  const updatePriceType = useCallback(
    (id: string, price_type: PriceType) =>
      dispatch({ type: "UPDATE_PRICE_TYPE", id, price_type }),
    []
  );
  const updateClientInfo = useCallback(
    (client_info: QuoteClientInfo) =>
      dispatch({ type: "UPDATE_CLIENT_INFO", client_info }),
    []
  );
  const updateDeliveryType = useCallback(
    (delivery_type: DeliveryType) =>
      dispatch({ type: "UPDATE_DELIVERY_TYPE", delivery_type }),
    []
  );
  const updateDeliveryCost = useCallback(
    (cost: number) => dispatch({ type: "UPDATE_DELIVERY_COST", cost }),
    []
  );
  const clearQuote = useCallback(() => dispatch({ type: "CLEAR_QUOTE" }), []);

  const isInQuote = useCallback(
    (plantId: string) => state.items.some((it) => it.plant.id === plantId),
    [state.items]
  );

  const getItemCount = useCallback(
    () => state.items.reduce((acc, it) => acc + it.quantity, 0),
    [state.items]
  );

  return (
    <QuoteContext.Provider
      value={{
        items: state.items,
        client_info: state.client_info,
        delivery_type: state.delivery_type,
        delivery_cost: state.delivery_cost,
        quote_number: state.quote_number,
        created_at: state.created_at,
        totals,
        addItem,
        removeItem,
        updateQuantity,
        updateDiscount,
        updatePriceType,
        updateClientInfo,
        updateDeliveryType,
        updateDeliveryCost,
        clearQuote,
        isInQuote,
        getItemCount,
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
