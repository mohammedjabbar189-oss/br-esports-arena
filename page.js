"use client";
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, doc, 
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { Trophy, Gamepad2, Wallet, User, Lock, ArrowRight, ShieldAlert, QrCode } from "lucide-react";

// --- FIREBASE CONFIG (Tera asli config yahan set kar diya hai) ---
const firebaseConfig = {
  apiKey: "AIzaSyBFiL3JdeZMdxiMphMnPABY7cY2ccADzRs",
  authDomain: "br-esports-arena.firebaseapp.com",
  projectId: "br-esports-arena",
  storageBucket: "br-esports-arena.firebasestorage.app",
  messagingSenderId: "147249736410",
  appId: "1:147249736410:web:44688104082a4c7fad93e3",
  measurementId: "G-B4KD3XKWE1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function BrEsportsApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [matches, setMatches] = useState([]);
  const [wallet, setWallet] = useState(50);
  const [userIgn, setUserIgn] = useState("BR_Player");
  const [userUid, setUserUid] = useState("12345678");
  
  // Admin States
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [newMatch, setNewMatch] = useState({
    game: "Free Fire MAX",
    title: "🔥 Free Giveaway Solo Match",
    mode: "Solo",
    map: "Bermuda",
    entryFee: 0,
    booyahPrize: 30,
    minKillsForBooyah: 0,
    perKill: 0,
    totalSlots: 48,
    roomId: "Pending",
    roomPass: "Pending",
    isFree: true
  });

  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Auth error:", error));
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));

    const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
    const unsubscribeMatches = onSnapshot(q, (snapshot) => {
      const matchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(matchData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMatches();
    };
  }, []);

  const handleJoinMatch = async (match) => {
    if (!match.isFree && wallet < match.entryFee) {
      alert("❌ Wallet mein balance kam hai! Pehle QR code se scan karke cash add karein.");
      setActiveTab("wallet");
      return;
    }

    if (match.joinedSlots >= match.totalSlots) {
      alert("❌ Match full ho chuka hai!");
      return;
    }

    try {
      if (!match.isFree) {
        setWallet(wallet - match.entryFee);
      }
      const matchRef = doc(db, "matches", match.id);
      await updateDoc(matchRef, {
        joinedSlots: (match.joinedSlots || 0) + 1,
        joinedPlayersList: [...(match.joinedPlayersList || []), { ign: userIgn, uid: userUid }]
      });
      alert(`✅ Successfully joined ${match.title}! Room ID match se 10 minute pehle dikhegi.`);
    } catch (err) {
      console.error("Error joining match:", err);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "matches"), {
        ...newMatch,
        joinedSlots: 0,
        joinedPlayersList: [],
        createdAt: Date.now(),
        isRoomPublished: false
      });
      alert("🚀 Tournament successfully create ho gaya!");
    } catch (err) {
      console.error("Error creating match:", err);
    }
  };

  const handlePublishRoom = async (matchId, roomId, roomPass) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      await updateDoc(matchRef, { roomId, roomPass, isRoomPublished: true });
      alert("🔑 Room ID & Password live ho gaya players ke liye!");
    } catch (err) {
      console.error("Error publishing room:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-8 h-8 text-amber-500 animate-pulse" />
          <div>
            <h1 className="font-black text-lg tracking-wider text-amber-400">BR Esports Arena</h1>
            <p className="text-xs text-slate-400">Free Fire Solo Battleground</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-emerald-400 text-sm">₹{wallet}</span>
          <button 
            onClick={() => setActiveTab("wallet")}
            className="bg-emerald-600 hover:bg-emerald-500 text-xs px-2 py-0.5 rounded font-bold text-white transition"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-800 pb-3 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("tournaments")}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${activeTab === "tournaments" ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tournaments</span>
          </button>
          <button 
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${activeTab === "wallet" ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
          >
            <Wallet className="w-4 h-4" />
            <span>My Wallet</span>
          </button>
          <button 
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 transition ${activeTab === "admin" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
          >
            <Lock className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>
        </div>

        {/* TOURNAMENTS TAB */}
        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300">
              🔥 <strong>Rules:</strong> Free Giveaway mein Booyah = ₹30. Paid Matches mein Booyah = ₹300 (Minimum 3 Kills zaroori!) + ₹3 per kill extra. No camping, full rush!
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">Filhal koi match active nahi hai.</p>
                <p className="text-slate-600 text-xs mt-1">Admin panel se naya match create karein!</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className={`border rounded-2xl p-4 shadow-xl ${match.isFree ? 'bg-gradient-to-r from-slate-900 to-amber-950/30 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${match.isFree ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {match.isFree ? '🎁 FREE GIVEAWAY' : '⚡ PAID BATTLE'} • Solo
                      </span>
                      <h3 className="font-bold text-base text-white mt-1">{match.title}</h3>
                      <p className="text-slate-400 text-xs">Map: {match.map} {match.isFree ? '' : `• Min Kills for Booyah: ${match.minKillsForBooyah}`}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Entry Fee</span>
                      <div className={`font-black text-lg ${match.isFree ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {match.isFree ? 'FREE' : `₹${match.entryFee}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl mb-4 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Booyah Prize</span>
                      <span className="font-bold text-emerald-400 text-sm">₹{match.booyahPrize} {match.isFree ? '(Fixed)' : '+ Kills'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Per Kill Reward</span>
                      <span className="font-bold text-slate-200 text-sm">{match.isFree ? 'No Kill Prize' : `₹${match.perKill} / kill`}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Slots Filled</span>
                      <span className="font-semibold text-slate-200">{match.joinedSlots || 0} / {match.totalSlots}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full rounded-full transition-all ${match.isFree ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, ((match.joinedSlots || 0) / match.totalSlots) * 100)}%` }}></div>
                    </div>
                  </div>

                  {match.isRoomPublished ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Room Credentials Live</span>
                        <span className="font-mono text-xs text-slate-200">ID: <strong className="text-white">{match.roomId}</strong> | Pass: <strong className="text-white">{match.roomPass}</strong></span>
                      </div>
                      <span className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg">Joined</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinMatch(match)}
                      className={`w-full font-black py-2.5 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md ${match.isFree ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'}`}
                    >
                      <span>{match.isFree ? 'Join Free Giveaway Match (₹0)' : `Join Solo Match (₹${match.entryFee})`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* WALLET TAB WITH VERIFIED PHONEPE QR CODE */}
        {activeTab === "wallet" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Player Profile</h2>
                <p className="text-xs text-slate-400">UID: {userUid} • IGN: {userIgn}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-xs block mb-1">Available Wallet Balance</span>
                <div className="text-3xl font-black text-emerald-400">₹{wallet}</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-emerald-400 font-bold block">Status</span>
                <span className="text-xs text-white font-semibold">Active</span>
              </div>
            </div>

            {/* QR CODE SECTION */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-amber-400">
                <QrCode className="w-5 h-5" />
                <h3 className="font-bold text-sm">Scan & Pay via PhonePe / UPI</h3>
              </div>
              <p className="text-xs text-slate-400">
                Wallet mein balance add karne ke liye niche diye gaye QR code ko scan karke payment karein. Scanner par naam <strong>BR Esports Arena</strong> dikhega[cite: 2].
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 rounded p-2 text-slate-900">
                  <span className="text-xs font-bold uppercase text-purple-700">PhonePe Merchant</span>
                  <span className="text-sm font-black my-2">BR Esports Arena</span>
                  <span className="font-mono text-[11px] text-slate-600">UPI: Q894151488@ybl</span>[cite: 2]
                  <span className="text-[9px] text-slate-400 mt-2">Terminal 1-Q894151488</span>[cite: 1, 2]
                </div>
                <div className="text-slate-900 font-bold text-xs mt-2">BR Esports Arena</div>
              </div>

              {/* Quick Testing Simulate Buttons */}
              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-2">Payment hone ke baad balance add karein (Testing Mode):</span>
                <div className="grid grid-cols-3 gap-3">
                  {[20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setWallet(w => w + amt);
                        alert(`✅ ₹${amt} successfully added to your wallet!`);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2.5 rounded-xl font-bold text-emerald-400 text-xs transition"
                    >
                      + ₹{amt} Add
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN PANEL TAB */}
        {activeTab === "admin" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            {!isAdminAuthenticated ? (
              <div className="max-w-xs mx-auto py-8 text-center space-y-4">
                <Lock className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="font-bold text-lg text-white">Organizer Admin Access</h2>
                <input 
                  type="password"
                  placeholder="Password (e.g. jbr123)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
                <button
                  onClick={() => {
                    if (adminPassword === "jbr123") setIsAdminAuthenticated(true);
                    else alert("❌ Galat password! (Try: jbr123)");
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm"
                >
                  Unlock Admin
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="font-bold text-lg text-rose-400 flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Admin Control Console</span>
                  </h2>
                  <button onClick={() => setIsAdminAuthenticated(false)} className="text-xs text-slate-400">Lock</button>
                </div>

                <form onSubmit={handleCreateMatch} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-amber-400">Create Match (Free Giveaway or Paid)</h3>
                  
                  {/* Toggle Free / Paid */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewMatch({
                        ...newMatch,
                        title: "🔥 Free Giveaway Solo Match",
                        entryFee: 0,
                        booyahPrize: 30,
                        minKillsForBooyah: 0,
                        perKill: 0,
                        isFree: true
                      })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${newMatch.isFree ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                    >
                      Free Giveaway (₹30 Booyah)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMatch({
                        ...newMatch,
                        title: "⚡ Bermuda Solo Custom War",
                        entryFee: 20,
                        booyahPrize: 300,
                        minKillsForBooyah: 3,
                        perKill: 3,
                        isFree: false
                      })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${!newMatch.isFree ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
                    >
                      Paid Match (₹20 Entry)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Title</label>
                      <input 
                        type="text" 
                        value={newMatch.title}
                        onChange={(e) => setNewMatch({...newMatch, title: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Entry Fee (₹)</label>
                      <input 
                        type="number" 
                        value={newMatch.entryFee}
                        onChange={(e) => setNewMatch({...newMatch, entryFee: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        disabled={newMatch.isFree}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Booyah Prize (₹)</label>
                      <input 
                        type="number" 
                        value={newMatch.booyahPrize}
                        onChange={(e) => setNewMatch({...newMatch, booyahPrize: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        required
                      />
                    </div>
                    {!newMatch.isFree && (
                      <div>
                        <label className="text-slate-400 block mb-1">Min Kills for Booyah</label>
                        <MainInput 
                          value={newMatch.minKillsForBooyah}
                          onChange={(e) => setNewMatch({...newMatch, minKillsForBooyah: Number(e.target.value)})}
                        />
                      </div>
                    )}
                    {!newMatch.isFree && (
                      <div className="col-span-2">
                        <label className="text-slate-400 block mb-1">Per Kill Reward (₹)</label>
                        <input 
                          type="number" 
                          value={newMatch.perKill}
                          onChange={(e) => setNewMatch({...newMatch, perKill: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                          required
                        />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm">
                    Publish Match Live
                  </button>
                </form>

                <div>
                  <h3 className="font-bold text-sm text-slate-300 mb-3">Room Credentials Push</h3>
                  <div className="space-y-3">
                    {matches.map((m) => (
                      <div key={m.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-white">{m.title}</span>
                          <span className={`text-xs ${m.isFree ? 'text-emerald-400' : 'text-amber-400'}`}>{m.isFree ? 'FREE' : 'PAID'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Room ID" defaultValue={m.roomId} id={`roomId-${m.id}`} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                          <input type="text" placeholder="Password" defaultValue={m.roomPass} id={`roomPass-${m.id}`} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                        </div>
                        <button
                          onClick={() => {
                            const rId = document.getElementById(`roomId-${m.id}`).value;
                            const rPass = document.getElementById(`roomPass-${m.id}`).value;
                            handlePublishRoom(m.id, rId, rPass);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs"
                        >
                          Push Room ID Live
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function MainInput({ value, onChange }) {
  return (
    <input 
      type="number" 
      value={value}
      onChange={onChange}
      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
      required
    />
  );
}
