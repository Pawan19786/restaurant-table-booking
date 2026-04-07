import { createContext, useContext, useState, useEffect, } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  offer: number;
  image: string;
  isVeg: boolean;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  clearAndAdd: (item: Omit<CartItem, "quantity">) => void;  // clear cart then add
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem("tt_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    sessionStorage.setItem("tt_cart", JSON.stringify(items));
  }, [items]);

  const restaurantId   = items[0]?.restaurantId   || null;
  const restaurantName = items[0]?.restaurantName || null;

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      // Different restaurant — just stack on top (conflict handled in UI layer)
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Clear entire cart and start fresh with this item (for multi-restaurant conflict)
  const clearAndAdd = (item: Omit<CartItem, "quantity">) => {
    setItems([{ ...item, quantity: 1 }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i._id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems  = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => {
    const discounted = i.offer > 0 ? i.price * (1 - i.offer / 100) : i.price;
    return s + discounted * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      items, restaurantId, restaurantName,
      addItem, clearAndAdd, removeItem, updateQty, clearCart,
      totalItems, totalAmount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};