"use client";
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

// ⚠️ Yahan apni asli Firebase Config keys zaroor daalna (Firebase Console -> Project Settings se copy karke)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "br-esports-arena.firebaseapp.com",
  projectId: "br-esports-arena",
  storageBucket: "br-esports-arena.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tournaments");
  
  // Free Fire Profile Form
  const [ffUid, setFfUid] = useState("");
  const [ffName, setFfName] = useState("");
  
  // Admin Form State
  const [matchTitle, setMatchTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [tournaments, setTournaments] = useState([]);

  // Check Login Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          const initialData = {
            name: currentUser.displayName,
            email: currentUser.email,
            wallet: 50,
            freeFireUid: "",
            freeFireName: "",
            createdAt: new Date()
          };
          await setDoc(userRef, initialData);
          setUserData(initialData);
        }
        fetchTournaments();
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Matches
  const fetchTournaments = async () => {
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTournaments(list);
  };

  // Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  // Logout
  const handleLogout = () => signOut(auth);

  // Save Free Fire UID
  const saveFreeFireDetails = async (e) => {
    e.preventDefault();
    if (!ffUid || !ffName) return alert("Dono details bharo bhai!");
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { freeFireUid: ffUid, freeFireName: ffName }, { merge: true });
    setUserData({ ...userData, freeFireUid: ffUid, freeFireName: ffName });
  };

  // Create Match
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "tournaments"), {
      title: matchTitle,
      entryFee: Number(entryFee),
      prizePool: prizePool,
      status: "Active",
      createdAt: new Date()
    });
    alert("Match Live Ho Gaya!");
    setMatchTitle("");
    setEntryFee("");
    setPrizePool("");
    fetchTournaments();
    setActiveTab("tournaments");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-yellow-400 font-bold text-lg animate-pulse">Loading BR Esports Arena...</p>
      </div>
    );
  }

  // 🔒 STEP 1: AGAR USER LOGIN NAHI HAI TOH SIRF LOGIN SCREEN DIKHAO
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-2xl">
          <span className="text-5xl block mb-4">🎮</span>
          <h1 className="text-3xl font-extrabold text-yellow-400 mb-2">BR Esports Arena</h1>
          <p className="text-slate-400 text-sm mb-6">Free Fire Solo Custom Room Tournaments. Jeeto Real Cash!</p>
          
          <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-lg mb-6 text-xs text-amber-200 text-left">
            🔥 <b>Match Rules:</b><br/>
            • Free Giveaway Booyah = ₹30<br/>
            • Paid Match Booyah = ₹300 (Min 3 Kills zaroori!) + ₹3/kill
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15.7C3.5 19.5 7.4 23 12 23z"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-slate-500 mt-4">Sign up karte hi ₹50 Bonus Wallet mein milega!</p>
        </div>
      </main>
    );
  }

  // 🎯 STEP 2: LOGIN HO GAYA PAR FREE FIRE UID LINK NAHI HAI TOH YEH DIKHAO
  if (userData && !userData.freeFireUid) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-yellow-400 mb-1">Welcome, {user.displayName}!</h2>
          <p className="text-sm text-slate-400 mb-5">Andar jaane se pehle apni Free Fire ID link karo:</p>
          <form onSubmit={saveFreeFireDetails} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Free Fire UID (Numbers)</label>
              <input 
                type="number" 
                placeholder="e.g. 2458963145" 
                value={ffUid} 
                onChange={(e) => setFfUid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">In-Game Name (IGN)</label>
              <input 
                type="text" 
                placeholder="e.g. JBR_Max" 
                value={ffName} 
                onChange={(e) => setFfName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
                required
              />
            </div>
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-3 rounded-lg">
              Save & Enter Arena 🚀
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 🏆 STEP 3: AB PLAYER ANDAR AA GAYA (MAIN DASHBOARD)
  return (
    <main className="min-h-screen bg-slate-950 text-white p-4">
      <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-4 mb-6 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <div>
            <h1 className="text-xl font-bold text-yellow-400">BR Esports Arena</h1>
            <p className="text-xs text-slate-400">ID: {userData?.freeFireName} ({userData?.freeFireUid})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-slate-400">Wallet:</span>
            <span className="font-bold text-green-400">₹{userData?.wallet ?? 0}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="bg-amber-950/40 border border-amber-600/50 p-3 rounded-lg mb-6 text-sm text-amber-200">
        🔥 <b>Rules:</b> Free Giveaway mein Booyah = ₹30. Paid Matches mein Booyah = ₹300 (Minimum 3 Kills zaroori!) + ₹3 per kill extra. No camping, full rush!
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3">
        <button 
          onClick={() => setActiveTab("tournaments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "tournaments" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
        >
          🏆 Tournaments
        </button>
        <button 
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "wallet" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
        >
          💳 My Wallet
        </button>
        <button 
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "admin" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
        >
          🔒 Admin Panel
        </button>
      </div>

      {activeTab === "tournaments" && (
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-4xl mb-2 block">🎮</span>
              <p className="text-slate-400">Filhal koi match active nahi hai.</p>
              <p className="text-sm text-slate-500 mt-1">Admin panel se naya match create karein!</p>
            </div>
          ) : (
            tournaments.map((match) => (
              <div key={match.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">Solo • Bermuda</span>
                  <h3 className="text-lg font-bold mt-1">{match.title}</h3>
                  <p className="text-sm text-yellow-400 mt-1">Prize: {match.prizePool}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Entry Fee</p>
                  <p className="text-lg font-bold text-white mb-2">{match.entryFee === 0 ? "FREE" : `₹${match.entryFee}`}</p>
                  <button onClick={() => alert("Match Joined! Room ID & Password match se 10 min pehle dikhega.")} className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-sm">
                    Join Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl text-center">
          <h2 className="text-lg font-bold mb-2">Add Money via PhonePe / GPay</h2>
          <p className="text-sm text-slate-400 mb-4">Pay to UPI: <span className="text-yellow-400 font-mono">jbr@upi</span></p>
          <p className="text-xs text-slate-500">Payment karne ke baad UTR / Screenshot Admin ko bhejein.</p>
        </div>
      )}

      {activeTab === "admin" && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold mb-4 text-yellow-400">Create New Tournament</h2>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <input 
              type="text" 
              placeholder="Match Title (e.g. Free Giveaway Solo)" 
              value={matchTitle} 
              onChange={(e) => setMatchTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
              required 
            />
            <input 
              type="number" 
              placeholder="Entry Fee (0 for Free)" 
              value={entryFee} 
              onChange={(e) => setEntryFee(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
              required 
            />
            <input 
              type="text" 
              placeholder="Prize (e.g. Booyah ₹30)" 
              value={prizePool} 
              onChange={(e) => setPrizePool(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
              required 
            />
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2.5 rounded">
              Publish Match
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
