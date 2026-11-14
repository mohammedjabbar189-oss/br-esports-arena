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
  updateDoc,
  collection, 
  getDocs, 
  addDoc,
  arrayUnion 
} from "firebase/firestore";

// 🔥 Teri Asli Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFiL3JdeZMdxiMphMnPABY7cY2ccADzRs",
  authDomain: "br-esports-arena.firebaseapp.com",
  projectId: "br-esports-arena",
  storageBucket: "br-esports-arena.firebasestorage.app",
  messagingSenderId: "147249736410",
  appId: "1:147249736410:web:44688104082a4c7fad93e3",
  measurementId: "G-B4KD3XKWE1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "mohammedjabbar189@gmail.com";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tournaments");
  
  const [ffUid, setFfUid] = useState("");
  const [ffName, setFfName] = useState("");
  
  // Admin Match Form
  const [matchTitle, setMatchTitle] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [tournaments, setTournaments] = useState([]);

  // Admin Room ID Update State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomPassInput, setRoomPassInput] = useState("");

  // Wallet States
  const [walletMode, setWalletMode] = useState("add");
  const [addAmount, setAddAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

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
            wallet: 0, // 👈 Wallet starts at ₹0 now
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

  const fetchTournaments = async () => {
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTournaments(list);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const saveFreeFireDetails = async (e) => {
    e.preventDefault();
    if (!ffUid || !ffName) return alert("Dono details bharo bhai!");
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { freeFireUid: ffUid, freeFireName: ffName }, { merge: true });
    setUserData({ ...userData, freeFireUid: ffUid, freeFireName: ffName });
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized!");
    await addDoc(collection(db, "tournaments"), {
      title: matchTitle,
      timing: matchTime,
      entryFee: Number(entryFee),
      prizePool: prizePool,
      roomId: "Pending",
      roomPass: "Pending",
      players: [],
      status: "Active",
      createdAt: new Date()
    });
    alert("Match Live Ho Gaya!");
    setMatchTitle("");
    setMatchTime("");
    setEntryFee("");
    setPrizePool("");
    fetchTournaments();
    setActiveTab("tournaments");
  };

  // Admin Update Room ID & Password
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized!");
    if (!selectedMatchId || !roomIdInput || !roomPassInput) {
      alert("Saari details bharein!");
      return;
    }
    const matchRef = doc(db, "tournaments", selectedMatchId);
    await updateDoc(matchRef, {
      roomId: roomIdInput,
      roomPass: roomPassInput
    });
    alert("Room ID & Password Updated Successfully!");
    setRoomIdInput("");
    setRoomPassInput("");
    setSelectedMatchId("");
    fetchTournaments();
  };

  const handleJoinMatch = async (match) => {
    if (match.players?.some(p => p.uid === user.uid)) {
      return alert("Aap pehle hi is match mein join ho chuke hain!");
    }
    if (userData.wallet < match.entryFee) {
      alert("Wallet mein balance kam hai! Pehle Add Money karein.");
      setActiveTab("wallet");
      setWalletMode("add");
      return;
    }

    const newBalance = userData.wallet - match.entryFee;
    const userRef = doc(db, "users", user.uid);
    const matchRef = doc(db, "tournaments", match.id);

    await updateDoc(userRef, { wallet: newBalance });
    await updateDoc(matchRef, {
      players: arrayUnion({
        uid: user.uid,
        ffUid: userData.freeFireUid,
        ffName: userData.freeFireName
      })
    });

    setUserData({ ...userData, wallet: newBalance });
    fetchTournaments();
    alert("Match Joined! Room ID & Password match time se 10 min pehle yahan dikhega.");
  };

  const handleAddMoneyRequest = async (e) => {
    e.preventDefault();
    if (!addAmount || !utrNumber) return alert("Amount aur UTR number dono daalein!");
    await addDoc(collection(db, "wallet_requests"), {
      type: "ADD",
      userId: user.uid,
      userName: userData.freeFireName,
      email: user.email,
      amount: Number(addAmount),
      utr: utrNumber,
      status: "Pending",
      createdAt: new Date()
    });
    alert("Deposit Request bhej di gayi hai! Verify hokar wallet mein add ho jayega.");
    setAddAmount("");
    setUtrNumber("");
  };

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (amt < 30) return alert("Minimum withdrawal ₹30 hai!");
    if (amt > userData.wallet) return alert("Aapke wallet mein itna balance nahi hai!");
    if (!withdrawUpi) return alert("Apna UPI ID daalein!");

    const newBalance = userData.wallet - amt;
    await updateDoc(doc(db, "users", user.uid), { wallet: newBalance });
    await addDoc(collection(db, "wallet_requests"), {
      type: "WITHDRAW",
      userId: user.uid,
      userName: userData.freeFireName,
      email: user.email,
      amount: amt,
      upiId: withdrawUpi,
      status: "Pending",
      createdAt: new Date()
    });

    setUserData({ ...userData, wallet: newBalance });
    alert("Withdrawal Request successful!");
    setWithdrawAmount("");
    setWithdrawUpi("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-yellow-400 font-bold text-lg animate-pulse">Loading BR Esports Arena...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-2xl">
          <span className="text-5xl block mb-4">🎮</span>
          <h1 className="text-3xl font-extrabold text-yellow-400 mb-2">BR Esports Arena</h1>
          <p className="text-slate-400 text-sm mb-6">Free Fire Solo Custom Room Tournaments. Jeeto Real Cash!</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15.7C3.5 19.5 7.4 23 12 23z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  if (userData && !userData.freeFireUid) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-yellow-400 mb-1">Welcome, {user.displayName}!</h2>
          <p className="text-sm text-slate-400 mb-5">Apni Free Fire ID link karo:</p>
          <form onSubmit={saveFreeFireDetails} className="space-y-4">
            <input 
              type="number" 
              placeholder="Free Fire UID" 
              value={ffUid} 
              onChange={(e) => setFfUid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
              required
            />
            <input 
              type="text" 
              placeholder="In-Game Name (IGN)" 
              value={ffName} 
              onChange={(e) => setFfName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-white"
              required
            />
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-3 rounded-lg cursor-pointer">
              Save & Enter Arena 🚀
            </button>
          </form>
        </div>
      </main>
    );
  }

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

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setActiveTab("wallet"); setWalletMode("add"); }}
            className="bg-slate-900 border border-slate-700 hover:border-green-500 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition"
          >
            <span className="text-xs text-slate-400">Wallet:</span>
            <span className="font-bold text-green-400">₹{userData?.wallet ?? 0}</span>
            <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">+ Add</span>
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="bg-amber-950/40 border border-amber-600/50 p-3 rounded-lg mb-6 text-sm text-amber-200">
        🔥 <b>Rules:</b> Free Giveaway Booyah = ₹30. Paid Match Booyah = ₹300 (Min 3 Kills) + ₹3/kill. Full rush!
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
        <button 
          onClick={() => setActiveTab("tournaments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "tournaments" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
        >
          🏆 Tournaments
        </button>
        <button 
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "wallet" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
        >
          💳 Wallet (Add / Withdraw)
        </button>
        
        {isAdmin && (
          <button 
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "admin" ? "bg-yellow-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-300"}`}
          >
            🔒 Admin Panel
          </button>
        )}
      </div>

      {activeTab === "tournaments" && (
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="text-4xl mb-2 block">🎮</span>
              <p className="text-slate-400">Filhal koi match active nahi hai.</p>
            </div>
          ) : (
            tournaments.map((match) => {
              const isJoined = match.players?.some(p => p.uid === user.uid);
              return (
                <div key={match.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">Solo • Bermuda</span>
                      {match.timing && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold">
                          ⏰ {match.timing}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mt-2">{match.title}</h3>
                    <p className="text-sm text-yellow-400 mt-1">Prize: {match.prizePool}</p>
                    <p className="text-xs text-slate-400 mt-1">Players Joined: {match.players?.length || 0} / 48</p>
                    
                    {isJoined && (
                      <div className="mt-3 bg-slate-950 border border-green-700/50 px-3 py-1.5 rounded text-xs text-green-400 font-mono">
                        Room ID: {match.roomId || "Pending"} | Pass: {match.roomPass || "Pending"}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right flex sm:block justify-between items-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <div>
                      <p className="text-xs text-slate-400">Entry Fee</p>
                      <p className="text-lg font-bold text-white mb-2">{match.entryFee === 0 ? "FREE" : `₹${match.entryFee}`}</p>
                    </div>
                    {isJoined ? (
                      <span className="bg-green-600/20 border border-green-600 text-green-400 font-bold px-4 py-1.5 rounded-lg text-sm">
                        ✅ Joined
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleJoinMatch(match)} 
                        className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm cursor-pointer"
                      >
                        Join Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
            <span className="text-sm text-slate-400">Available Balance</span>
            <span className="text-2xl font-extrabold text-green-400">₹{userData?.wallet ?? 0}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-950 p-1 rounded-lg">
            <button 
              onClick={() => setWalletMode("add")}
              className={`py-2 rounded-md text-sm font-bold transition cursor-pointer ${walletMode === "add" ? "bg-green-600 text-white" : "text-slate-400"}`}
            >
              ➕ Add Money
            </button>
            <button 
              onClick={() => setWalletMode("withdraw")}
              className={`py-2 rounded-md text-sm font-bold transition cursor-pointer ${walletMode === "withdraw" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              💸 Withdraw
            </button>
          </div>

          {walletMode === "add" ? (
            <div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-center mb-4">
                <p className="text-xs text-slate-400 mb-1">UPI ID:</p>
                <p className="text-base font-mono font-bold text-yellow-400 select-all">jbr@upi</p>
              </div>
              <form onSubmit={handleAddMoneyRequest} className="space-y-3">
                <input 
                  type="number" 
                  placeholder="Amount Paid (₹)" 
                  value={addAmount} 
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                  required
                />
                <input 
                  type="text" 
                  placeholder="12-Digit UTR Number" 
                  value={utrNumber} 
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                  required
                />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded cursor-pointer">
                  Submit Deposit Request
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleWithdrawRequest} className="space-y-3">
              <input 
                type="number" 
                placeholder="Withdraw Amount (Min ₹30)" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required
              />
              <input 
                type="text" 
                placeholder="Your UPI ID" 
                value={withdrawUpi} 
                onChange={(e) => setWithdrawUpi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required
              />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded cursor-pointer">
                Request Withdrawal
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN PANEL */}
      {activeTab === "admin" && isAdmin && (
        <div className="max-w-md mx-auto space-y-6">
          {/* 1. Create Match */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">Create New Tournament</h2>
            <form onSubmit={handleCreateMatch} className="space-y-3">
              <input 
                type="text" 
                placeholder="Match Title (e.g. Solo Bermuda)" 
                value={matchTitle} 
                onChange={(e) => setMatchTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
              <input 
                type="text" 
                placeholder="Match Timing (e.g. Today, 8:30 PM)" 
                value={matchTime} 
                onChange={(e) => setMatchTime(e.target.value)}
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
                placeholder="Prize Pool (e.g. ₹300)" 
                value={prizePool} 
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2.5 rounded cursor-pointer">
                Publish Match
              </button>
            </form>
          </div>

          {/* 2. Update Room ID & Password */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">Update Room ID & Password</h2>
            <form onSubmit={handleUpdateRoom} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Match</label>
                <select 
                  value={selectedMatchId} 
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                  required
                >
                  <option value="">-- Choose Match --</option>
                  {tournaments.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.timing})</option>
                  ))}
                </select>
              </div>
              <input 
                type="text" 
                placeholder="Room ID" 
                value={roomIdInput} 
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
              <input 
                type="text" 
                placeholder="Room Password" 
                value={roomPassInput} 
                onChange={(e) => setRoomPassInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-white text-sm"
                required 
              />
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded cursor-pointer">
                Publish Room Credentials
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
