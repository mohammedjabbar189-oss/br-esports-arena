"import client";
import React, { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc 
} from "firebase/firestore";

// Firebase Configuration (Apne credentials yahan daal lena agar alag hain)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "br-esports-arena.firebaseapp.com",
  projectId: "br-esports-arena",
  storageBucket: "br-esports-arena.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [ffUid, setFfUid] = useState("");
  const [ffName, setFfName] = useState("");
  const [tournaments, setTournaments] = useState([]);
  
  // Admin form state
  const [matchTitle, setMatchTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // Create initial profile
          const initialData = {
            name: currentUser.displayName,
            email: currentUser.email,
            wallet: 50, // Bonus ₹50
            freeFireUid: "",
            freeFireName: "",
            createdAt: new Date()
          };
          await setDoc(userRef, initialData);
          setUserData(initialData);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error.message);
      alert("Login Failed: " + error.message);
    }
  };

  // Logout Handler
  const handleLogout = () => signOut(auth);

  // Save Free Fire Details
  const saveFreeFireDetails = async (e) => {
    e.preventDefault();
    if (!ffUid || !ffName) {
      alert("Please enter both Free Fire UID and Name!");
      return;
    }
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { freeFireUid: ffUid, freeFireName: ffName }, { merge: true });
    setUserData({ ...userData, freeFireUid: ffUid, freeFireName: ffName });
    alert("Free Fire ID Linked Successfully!");
  };

  // Create Tournament (Admin)
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tournaments"), {
        title: matchTitle,
        entryFee: Number(entryFee),
        prizePool: prizePool,
        status: "Active",
        createdAt: new Date()
      });
      alert("Match Created Successfully!");
      setMatchTitle("");
      setEntryFee("");
      setPrizePool("");
    } catch (err) {
      console.error("Error creating match:", err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h1 className="text-xl font-bold text-yellow-400">BR Esports Arena</h1>
        </div>

        <div className="flex items-center gap-4">
          {user && userData && (
            <div className="bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg flex items-center gap-2">
              <span className="text-sm text-slate-300">Wallet:</span>
              <span className="font-bold text-green-400">₹{userData.wallet}</span>
            </div>
          )}

          {user ? (
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              Logout
            </button>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
            >
              Login with Google
            </button>
          )}
        </div>
      </header>

      {/* Rules Banner */}
      <div className="bg-amber-950/40 border border-amber-600/50 p-3 rounded-lg mb-6 text-sm text-amber-200">
        🔥 <b>Rules:</b> Free Giveaway mein Booyah = ₹30. Paid Matches mein Booyah = ₹300 (Minimum 3 Kills zaroori!) + ₹3 per kill extra. No camping, full rush!
      </div>

      {/* Profile / UID Setup Prompt if logged in but UID missing */}
      {user && userData && !userData.freeFireUid && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl mb-6 max-w-md mx-auto">
          <h3 className="font-bold text-yellow-400 mb-2">Link Your Free Fire Account</h3>
          <form onSubmit={saveFreeFireDetails} className="space-y-3">
            <input 
              type="text" 
              placeholder="Enter Free Fire UID (e.g. 123456789)" 
              value={ffUid} 
              onChange={(e) => setFfUid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
            />
            <input 
              type="text" 
              placeholder="Enter In-Game Name" 
              value={ffName} 
              onChange={(e) => setFfName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white"
            />
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2 rounded">
              Save & Continue
            </button>
          </form>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3">
        <button 
          onClick={() => setActiveTab("tournaments")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "tournaments" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
        >
          🏆 Tournaments
        </button>
        <button 
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "wallet" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
        >
          💳 My Wallet
        </button>
        <button 
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "admin" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
        >
          🔒 Admin Panel
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "tournaments" && (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-4xl mb-2 block">🎮</span>
          <p className="text-slate-400">Filhal koi match active nahi hai.</p>
          <p className="text-sm text-slate-500 mt-1">Admin panel se naya match create karein!</p>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
          <h2 className="text-lg font-bold mb-2">Add Money via PhonePe / GPay</h2>
          <p className="text-sm text-slate-400 mb-4">Scan QR or Pay to UPI: <span className="text-yellow-400">jbr@upi</span></p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4 inline-block">
            <div className="w-40 h-40 bg-white mx-auto flex items-center justify-center text-slate-950 font-bold text-xs">
              [ PhonePe QR Placeholder ]
            </div>
          </div>
          <p className="text-xs text-slate-500">Payment karne ke baad UTR / Screenshot Admin ko WhatsApp par bhejein.</p>
        </div>
      )}

      {activeTab === "admin" && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4 text-yellow-400">Create New Tournament</h2>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Match Title / Mode</label>
              <input 
                type="text" 
                placeholder="e.g. Free Fire Solo Custom Room" 
                value={matchTitle} 
                onChange={(e) => setMatchTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Entry Fee (₹)</label>
              <input 
                type="number" 
                placeholder="0 for Giveaway" 
                value={entryFee} 
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prize Pool Details</label>
              <input 
                type="text" 
                placeholder="e.g. Booyah = ₹300" 
                value={prizePool} 
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
            </div>
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2.5 rounded transition">
              Publish Match
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
