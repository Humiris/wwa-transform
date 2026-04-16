import { create } from "zustand";

export interface Address {
  id: string;
  label: string; // "Home", "Work", "Other"
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  income: string;
  avatar: string;
  addresses: Address[];
}

interface UserStore {
  isSignedIn: boolean;
  profile: UserProfile;
  signIn: (profile: Partial<UserProfile>) => void;
  signOut: () => void;
  updateProfile: (fields: Partial<UserProfile>) => void;
  addAddress: (addr: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => Address | undefined;
}

const EMPTY_PROFILE: UserProfile = {
  firstName: "", lastName: "", email: "", phone: "",
  income: "", avatar: "", addresses: [],
};

// Always start empty — hydrate from localStorage on client mount
function loadProfile(): { isSignedIn: boolean; profile: UserProfile } {
  return { isSignedIn: false, profile: EMPTY_PROFILE };
}

const save = (profile: UserProfile) => {
  if (typeof window !== "undefined") localStorage.setItem("visa-user", JSON.stringify(profile));
};

export const useUserStore = create<UserStore>((set, get) => ({
  ...loadProfile(),

  signIn: (profile) => {
    const full = { ...EMPTY_PROFILE, ...profile, addresses: profile.addresses || [] };
    set({ isSignedIn: true, profile: full });
    save(full);
  },

  signOut: () => {
    set({ isSignedIn: false, profile: EMPTY_PROFILE });
    if (typeof window !== "undefined") localStorage.removeItem("visa-user");
  },

  updateProfile: (fields) => {
    const updated = { ...get().profile, ...fields };
    set({ profile: updated });
    if (get().isSignedIn) save(updated);
  },

  addAddress: (addr) => {
    const current = get().profile;
    const id = Date.now().toString(36);
    const isFirst = current.addresses.length === 0;
    const newAddr: Address = { ...addr, id, isDefault: isFirst || addr.isDefault };
    if (newAddr.isDefault) {
      current.addresses.forEach(a => a.isDefault = false);
    }
    const updated = { ...current, addresses: [...current.addresses, newAddr] };
    set({ profile: updated });
    if (get().isSignedIn) save(updated);
  },

  removeAddress: (id) => {
    const current = get().profile;
    const updated = { ...current, addresses: current.addresses.filter(a => a.id !== id) };
    if (updated.addresses.length > 0 && !updated.addresses.some(a => a.isDefault)) {
      updated.addresses[0].isDefault = true;
    }
    set({ profile: updated });
    if (get().isSignedIn) save(updated);
  },

  setDefaultAddress: (id) => {
    const current = get().profile;
    const addresses = current.addresses.map(a => ({ ...a, isDefault: a.id === id }));
    const updated = { ...current, addresses };
    set({ profile: updated });
    if (get().isSignedIn) save(updated);
  },

  getDefaultAddress: () => {
    return get().profile.addresses.find(a => a.isDefault) || get().profile.addresses[0];
  },
}));

// Hydrate from localStorage on client mount
export function hydrateUserStore() {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem("visa-user");
    if (saved) {
      const parsed = JSON.parse(saved);
      useUserStore.setState({ isSignedIn: true, profile: { ...EMPTY_PROFILE, ...parsed } });
    }
  } catch {}
}

// Fake Google Sign-In — generates a demo profile
export function fakeGoogleSignIn(): Promise<Partial<UserProfile>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        firstName: "Joel",
        lastName: "User",
        email: "joel@example.com",
        phone: "(555) 987-6543",
        income: "300,000",
        avatar: "https://ui-avatars.com/api/?name=Joel+User&background=1A1F71&color=fff&size=128",
        addresses: [
          { id: "addr1", label: "Home", street: "123 Main Street", city: "San Francisco", state: "CA", zip: "94102", country: "US", isDefault: true },
        ],
      });
    }, 800);
  });
}
