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
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  onSnapshot, 
  addDoc,
  query,
  where,
  arrayUnion,
  increment,
  runTransaction
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
const UID_LOCK_BONUS = 50;
const REFERRAL_SPLIT_BONUS = 50;

const generateReferralCode = (uid = "") => {
  const prefix = String(uid || "USER").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "BR";
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BR${prefix}${randomPart}`;
};

const normalizeMatchStatus = (status) => {
  const clean = String(status || "").trim().toLowerCase();
  if (clean === "live") return "Live";
  if (clean === "completed" || clean === "finished" || clean === "ended") return "Completed";
  return "Upcoming";
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [allUsersMap, setAllUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tournaments");
  const [adminSection, setAdminSection] = useState("matches");
  const [walletHistoryTab, setWalletHistoryTab] = useState("transactions");
  const [showQuickGuide, setShowQuickGuide] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 🔍 Match Filters & Search States
  const [feeFilter, setFeeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE_ALL");
  const [matchSearch, setMatchSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // Onboarding Disclaimer, How-To-Play & Optional UID Modal States
  const [hasAcceptedFairPlayNotice, setHasAcceptedFairPlayNotice] = useState(false);
  const [fairPlayChecked, setFairPlayChecked] = useState(false);
  const [hasPassedIntroGuide, setHasPassedIntroGuide] = useState(false);
  const [showUidModal, setShowUidModal] = useState(false);

  // Legal Modals: "terms" | "privacy" | null
  const [legalModal, setLegalModal] = useState(null);
  
  const [ffUid, setFfUid] = useState("");
  const [ffName, setFfName] = useState("");

  // 🎁 Referral States
  const [referralInput, setReferralInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [showRefQr, setShowRefQr] = useState(false);
  
  // Admin Match Form
  const [matchTitle, setMatchTitle] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("48");
  const [newMatchStatus, setNewMatchStatus] = useState("Upcoming");
  const [tournaments, setTournaments] = useState([]);
  const [winnersBoard, setWinnersBoard] = useState([]);
  const [walletRequests, setWalletRequests] = useState([]);
  const [approvedDeposits, setApprovedDeposits] = useState([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [processingReqId, setProcessingReqId] = useState(null);

  // Admin Room ID & Cancel States
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomPassInput, setRoomPassInput] = useState("");
  const [cancelMatchId, setCancelMatchId] = useState("");

  // Admin Prize / Winnings States (Per-Kill + Optional Extra Bonus)
  const [prizeMatchId, setPrizeMatchId] = useState("");
  const [prizeWinnerUid, setPrizeWinnerUid] = useState("");
  const [booyahAmount, setBooyahAmount] = useState("0");
  const [killsCount, setKillsCount] = useState("0");
  const [perKillRate, setPerKillRate] = useState("5");
  const [sendingPrize, setSendingPrize] = useState(false);

  // Wallet States
  const [walletMode, setWalletMode] = useState("add");
  const [addAmount, setAddAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // 🔥 Asli UPI ID
  const MERCHANT_UPI_ID = "Q894151488@ybl";

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 🎨 Theme Classes (Dark & Light)
  const pageBg = isDarkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900";
  const cardBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const subCardBg = isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200";
  const inputBg = isDarkMode
    ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400";
  const mutedText = isDarkMode ? "text-slate-400" : "text-slate-600";
  const subtleText = isDarkMode ? "text-slate-500" : "text-slate-500";
  const headingText = isDarkMode ? "text-yellow-400" : "text-amber-600";
  const titleText = isDarkMode ? "text-white" : "text-slate-900";
  const tabInactive = isDarkMode
    ? "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-200";
  const borderDivider = isDarkMode ? "border-slate-800" : "border-slate-300";

  const handleCopyCredential = async (value, keyId, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedKey(keyId);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === keyId ? "" : prev));
      }, 2000);
    } catch {
      alert(`📋 ${label}: ${value}`);
    }
  };

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("br_esports_theme");
      if (savedTheme === "light") {
        setIsDarkMode(false);
      } else if (savedTheme === "dark") {
        setIsDarkMode(true);
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const refFromUrl = params.get("ref");
        if (refFromUrl) {
          const cleanCode = refFromUrl.trim().toUpperCase();
          localStorage.setItem("br_pending_ref_code", cleanCode);
          setReferralInput(cleanCode);
        } else {
          const savedPending = localStorage.getItem("br_pending_ref_code");
          if (savedPending) {
            setReferralInput(savedPending);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("br_esports_theme", next ? "dark" : "light");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const markFairPlayAccepted = async () => {
    setHasAcceptedFairPlayNotice(true);
    setUserData((prev) => (prev ? { ...prev, fairPlayAccepted: true } : prev));
    if (user?.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { fairPlayAccepted: true, acceptedTermsAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to save fairPlayAccepted:", err);
      }
    }
  };

  const markIntroGuideCompleted = async () => {
    setHasPassedIntroGuide(true);
    setUserData((prev) => (prev ? { ...prev, introGuideCompleted: true } : prev));
    if (user?.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { introGuideCompleted: true },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to save introGuideCompleted:", err);
      }
    }
  };

  const parsedBooyah = Math.max(0, Number(booyahAmount) || 0);
  const parsedKills = Math.max(0, Number(killsCount) || 0);
  const parsedPerKill = Math.max(0, Number(perKillRate) || 0);
  const killsTotal = parsedKills * parsedPerKill;
  const calculatedTotalPrize = parsedBooyah + killsTotal;

  const isPlayerKickedFromMatch = (match, currentAuthUid, currentFfUid) => {
    const kickedList = match?.kickedPlayers || [];
    const cleanFfUid = String(currentFfUid || "").trim();
    return kickedList.some((k) => {
      const sameAuth = currentAuthUid && k.uid && k.uid === currentAuthUid;
      const sameFf = cleanFfUid && k.ffUid && String(k.ffUid).trim() === cleanFfUid;
      return Boolean(sameAuth || sameFf);
    });
  };

  const formatDateTime = (input) => {
    if (!input) return "";
    let dateObj;
    if (input.seconds) {
      dateObj = new Date(input.seconds * 1000);
    } else {
      dateObj = new Date(input);
    }
    if (isNaN(dateObj.getTime())) {
      return input; 
    }
    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getCreatedAtTime = (createdAt) => {
    if (!createdAt) return 0;
    if (typeof createdAt === "object" && typeof createdAt.seconds === "number") {
      return createdAt.seconds * 1000 + (createdAt.nanoseconds || 0) / 1e6;
    }
    if (typeof createdAt === "object" && typeof createdAt.toMillis === "function") {
      return createdAt.toMillis();
    }
    const parsed = new Date(createdAt).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortedTournaments = [...(tournaments || [])].sort(
    (a, b) => getCreatedAtTime(a.createdAt) - getCreatedAtTime(b.createdAt)
  );

  const filteredTournaments = sortedTournaments.filter((match) => {
    const currentStatus = normalizeMatchStatus(match.status);
    const fee = Number(match.entryFee) || 0;

    if (statusFilter === "ACTIVE_ALL" && currentStatus === "Completed") {
      return false;
    }
    if (statusFilter !== "ACTIVE_ALL" && currentStatus !== statusFilter) {
      return false;
    }

    if (feeFilter === "FREE" && fee > 0) return false;
    if (feeFilter === "PAID" && fee <= 0) return false;

    const qText = matchSearch.trim().toLowerCase();
    if (qText) {
      const hay = `${match.title || ""} ${match.timing || ""} ${match.prizePool || ""} ${fee === 0 ? "free" : `₹${fee}`}`.toLowerCase();
      if (!hay.includes(qText)) return false;
    }

    return true;
  });

  const sortedWinnersBoard = [...(winnersBoard || [])].sort(
    (a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt)
  );

  const totalApprovedDepositsAmt = approvedDeposits.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );
  const totalApprovedWithdrawalsAmt = approvedWithdrawals.reduce(
    (sum, w) => sum + (Number(w.amount) || 0),
    0
  );
  const totalPrizesSentAmt = sortedWinnersBoard.reduce(
    (sum, item) => sum + (Number(item.totalPrize) || 0),
    0
  );
  const netAdminBalance =
    totalApprovedDepositsAmt - totalApprovedWithdrawalsAmt - totalPrizesSentAmt;

  const getPlayerSummary = (playerUid) => {
    const profile = allUsersMap[playerUid] || (playerUid === user?.uid ? userData : null);
    const mainBal = Number(profile?.wallet) || 0;
    const bonusBal = Number(profile?.bonusWallet) || 0;

    const approvedDepositSum = approvedDeposits
      .filter((d) => d.userId === playerUid)
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const joinedMatchesCount = sortedTournaments.filter((m) =>
      (m.players || []).some((p) => p.uid === playerUid)
    ).length;

    return {
      mainBal,
      bonusBal,
      approvedDepositSum,
      joinedMatchesCount,
    };
  };

  const handleDeleteScoreboardEntry = async (entryId) => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!entryId) return;
    try {
      await deleteDoc(doc(db, "winners_board", entryId));
    } catch (error) {
      alert("Entry delete karne mein error aaya: " + error.message);
    }
  };

  const handleClearScoreboard = async () => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!winnersBoard || winnersBoard.length === 0) return;
    const confirmClear = window.confirm("Kya aap scoreboard ki saari entries clear karna chahte hain?");
    if (!confirmClear) return;
    try {
      await Promise.all(
        winnersBoard.map((item) => deleteDoc(doc(db, "winners_board", item.id)))
      );
      alert("✅ Scoreboard clear ho gaya!");
    } catch (error) {
      alert("Scoreboard clear karne mein error aaya: " + error.message);
    }
  };

  const sortRequestsList = (list) => {
    return list.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (b.status === "Pending" && a.status !== "Pending") return 1;

      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeAllUsers = () => {};
    let unsubscribeTournaments = () => {};
    let unsubscribeWinners = () => {};
    let unsubscribeRequests = () => {};
    let unsubscribeMyRequests = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFairPlayChecked(false);
        const userRef = doc(db, "users", currentUser.uid);
        
        unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (typeof data.wallet !== 'number' || isNaN(data.wallet)) {
              data.wallet = 0;
            }
            if (typeof data.bonusWallet !== 'number' || isNaN(data.bonusWallet)) {
              data.bonusWallet = 0;
            }

            const patchUpdates = {};
            if (!data.refCode) {
              const newCode = generateReferralCode(currentUser.uid);
              patchUpdates.refCode = newCode;
              data.refCode = newCode;
            }

            if (data.freeFireUid && !data.uidLockBonusGiven) {
              patchUpdates.bonusWallet = increment(UID_LOCK_BONUS);
              patchUpdates.uidLockBonusGiven = true;
              patchUpdates.transactions = arrayUnion({
                text: `Player Bonus (UID Verified) — Match Entry Only`,
                amount: `+₹${UID_LOCK_BONUS} Bonus`,
                date: formatDateTime(new Date())
              });
              data.bonusWallet = Number(data.bonusWallet || 0) + UID_LOCK_BONUS;
              data.uidLockBonusGiven = true;
            }

            if (Object.keys(patchUpdates).length > 0) {
              try {
                await setDoc(userRef, patchUpdates, { merge: true });
              } catch (err) {
                console.error("Failed to apply user updates:", err);
              }
            }

            setUserData(data);

            const fairPlayDone = Boolean(data.fairPlayAccepted || data.freeFireUid);
            const guideDone = Boolean(data.introGuideCompleted || data.freeFireUid);
            setHasAcceptedFairPlayNotice(fairPlayDone);
            setHasPassedIntroGuide(guideDone);

            if (data.freeFireUid) {
              setFfUid(data.freeFireUid);
              setFfName(data.freeFireName || "");
              setShowUidModal(false);
            }
          } else {
            const initialData = {
              name: currentUser.displayName,
              email: currentUser.email,
              wallet: 0,
              bonusWallet: 0,
              uidLockBonusGiven: false,
              refCode: generateReferralCode(currentUser.uid),
              referredBy: null,
              referralClaimed: false,
              freeFireUid: "",
              freeFireName: "",
              fairPlayAccepted: false,
              introGuideCompleted: false,
              transactions: [],
              createdAt: new Date()
            };
            setHasAcceptedFairPlayNotice(false);
            setHasPassedIntroGuide(false);
            setDoc(userRef, initialData);
            setUserData(initialData);
          }
        });

        if (currentUser.email === ADMIN_EMAIL) {
          unsubscribeAllUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const map = {};
            snapshot.docs.forEach((d) => {
              map[d.id] = d.data();
            });
            setAllUsersMap(map);
          });

          unsubscribeRequests = onSnapshot(collection(db, "wallet_requests"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const pendingList = list.filter(r => r.status === "Pending");
            const approvedAddList = list.filter(r => r.type === "ADD" && r.status === "Approved");
            const approvedWithdrawList = list.filter(r => r.type === "WITHDRAW" && r.status === "Approved");
            setWalletRequests(sortRequestsList(pendingList));
            setApprovedDeposits(sortRequestsList(approvedAddList));
            setApprovedWithdrawals(sortRequestsList(approvedWithdrawList));
          });
        } else {
          setAllUsersMap({});
          setWalletRequests([]);
          setApprovedDeposits([]);
          setApprovedWithdrawals([]);
        }

        const q = query(collection(db, "wallet_requests"), where("userId", "==", currentUser.uid));
        unsubscribeMyRequests = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyRequests(sortRequestsList(list));
        });

      } else {
        setUser(null);
        setUserData(null);
        setAllUsersMap({});
        setHasAcceptedFairPlayNotice(false);
        setFairPlayChecked(false);
        setHasPassedIntroGuide(false);
        setShowUidModal(false);
        setWalletRequests([]);
        setApprovedDeposits([]);
        setApprovedWithdrawals([]);
        setMyRequests([]);
      }
      setLoading(false);
    });

    unsubscribeTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTournaments(list);
    });

    unsubscribeWinners = onSnapshot(collection(db, "winners_board"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWinnersBoard(list);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      if (unsubscribeAllUsers) unsubscribeAllUsers();
      unsubscribeTournaments();
      unsubscribeWinners();
      unsubscribeRequests();
      if (unsubscribeMyRequests) unsubscribeMyRequests();
    };
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const claimReferralBonus = async (codeToApply, verifiedFfUid, verifiedFfName = "") => {
    const cleanCode = String(codeToApply || "").trim().toUpperCase();
    if (!cleanCode || !user || !userData) return false;

    if (userData.referralClaimed || userData.referredBy) {
      alert("⚠️ Aap pehle hi referral bonus claim kar chuke hain!");
      return false;
    }

    if (cleanCode === userData.refCode) {
      alert("⚠️ Aap apna khud ka referral code use nahi kar sakte!");
      return false;
    }

    try {
      if (localStorage.getItem("br_ref_claimed_device") === "true") {
        alert("⚠️ Is device par referral bonus pehle hi claim ho chuka hai.");
        return false;
      }
    } catch {
      // ignore storage errors
    }

    const cleanUid = String(verifiedFfUid || userData.freeFireUid || "").trim();
    if (!/^\d{8,12}$/.test(cleanUid)) {
      alert("⚠️ Referral bonus ke liye valid 8–12 digit Free Fire UID zaroori hai.");
      return false;
    }

    const uidQuery = query(collection(db, "users"), where("freeFireUid", "==", cleanUid));
    const uidSnap = await getDocs(uidQuery);
    const usedByAnotherAccount = uidSnap.docs.some((d) => d.id !== user.uid);
    if (usedByAnotherAccount) {
      alert("⚠️ Yeh Free Fire UID pehle kisi aur account se judi hui hai. Referral bonus valid nahi hai.");
      return false;
    }

    const refQuery = query(collection(db, "users"), where("refCode", "==", cleanCode));
    const refSnap = await getDocs(refQuery);
    if (refSnap.empty) {
      alert("❌ Invalid referral code!");
      return false;
    }

    const referrerDoc = refSnap.docs[0];
    const referrerUid = referrerDoc.id;
    if (referrerUid === user.uid) {
      alert("⚠️ Apna khud ka referral code apply nahi kar sakte!");
      return false;
    }

    await runTransaction(db, async (transaction) => {
      const currentUserRef = doc(db, "users", user.uid);
      const referrerUserRef = doc(db, "users", referrerUid);

      const currentSnap = await transaction.get(currentUserRef);
      const referrerSnap = await transaction.get(referrerUserRef);

      if (!currentSnap.exists() || !referrerSnap.exists()) {
        throw new Error("Account record nahi mila.");
      }

      const freshCurrent = currentSnap.data();
      if (freshCurrent.referralClaimed || freshCurrent.referredBy) {
        throw new Error("Referral bonus pehle hi claim ho chuka hai.");
      }

      const nowStr = formatDateTime(new Date());
      const referredName = verifiedFfName || freshCurrent.freeFireName || freshCurrent.name || "Friend";

      transaction.update(referrerUserRef, {
        bonusWallet: increment(REFERRAL_SPLIT_BONUS),
        transactions: arrayUnion({
          text: `Referral Bonus (${referredName}) — Match Entry Only`,
          amount: `+₹${REFERRAL_SPLIT_BONUS} Bonus`,
          date: nowStr,
        }),
      });

      transaction.update(currentUserRef, {
        bonusWallet: increment(REFERRAL_SPLIT_BONUS),
        referredBy: referrerUid,
        referralClaimed: true,
        transactions: arrayUnion({
          text: `Referral Bonus (${cleanCode}) — Match Entry Only`,
          amount: `+₹${REFERRAL_SPLIT_BONUS} Bonus`,
          date: nowStr,
        }),
      });
    });

    try {
      localStorage.setItem("br_ref_claimed_device", "true");
      localStorage.removeItem("br_pending_ref_code");
    } catch {
      // ignore storage errors
    }

    setReferralInput("");
    return true;
  };

  const handleManualReferralSubmit = async (e) => {
    e.preventDefault();
    if (applyingReferral) return;

    if (!userData?.freeFireUid) {
      alert("⚠️ Referral bonus lene ke liye pehle apni asli Free Fire UID save & lock karein!");
      setShowUidModal(true);
      return;
    }

    setApplyingReferral(true);
    try {
      const ok = await claimReferralBonus(referralInput, userData.freeFireUid, userData.freeFireName);
      if (ok) {
        alert("🎉 Badhai ho! Aapko aur aapke dost dono ko ₹50-₹50 Bonus Wallet (Match Entry Only) mein mil gaye!");
      }
    } catch (err) {
      alert("⚠️ " + (err.message || "Referral bonus apply nahi ho paya."));
    } finally {
      setApplyingReferral(false);
    }
  };

  const saveFreeFireDetails = async (e) => {
    e.preventDefault();

    if (userData?.freeFireUid) {
      alert("⚠️ Free Fire UID ek baar save hone ke baad change nahi ki ja sakti. Badvane ke liye Live Support par message karein.");
      return;
    }

    const cleanUid = ffUid.trim();
    const cleanName = ffName.trim();

    const uidRegex = /^\d{8,12}$/;
    if (!uidRegex.test(cleanUid)) {
      alert("⚠️ Error: Free Fire UID hamesha 8 se 12 digits ka valid number honi chahiye!");
      return;
    }

    if (cleanName.length < 3) {
      alert("⚠️ Error: In-Game Name (IGN) kam se kam 3 akshar ka hona chahiye.");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const shouldGiveUidBonus = !userData?.uidLockBonusGiven;
    const nowStr = formatDateTime(new Date());

    const payload = {
      freeFireUid: cleanUid,
      freeFireName: cleanName,
      fairPlayAccepted: true,
      introGuideCompleted: true
    };

    if (shouldGiveUidBonus) {
      payload.bonusWallet = increment(UID_LOCK_BONUS);
      payload.uidLockBonusGiven = true;
      payload.transactions = arrayUnion({
        text: `UID Lock Welcome Bonus — Match Entry Only`,
        amount: `+₹${UID_LOCK_BONUS} Bonus`,
        date: nowStr
      });
    }

    await setDoc(userRef, payload, { merge: true });

    const updatedLocal = {
      ...userData,
      freeFireUid: cleanUid,
      freeFireName: cleanName,
      fairPlayAccepted: true,
      introGuideCompleted: true,
      uidLockBonusGiven: true,
      bonusWallet: (Number(userData?.bonusWallet) || 0) + (shouldGiveUidBonus ? UID_LOCK_BONUS : 0)
    };
    setUserData(updatedLocal);
    setShowUidModal(false);
    setHasAcceptedFairPlayNotice(true);
    setHasPassedIntroGuide(true);

    const pendingCode = referralInput.trim();
    if (pendingCode && !updatedLocal.referralClaimed) {
      try {
        const claimed = await claimReferralBonus(pendingCode, cleanUid, cleanName);
        if (claimed) {
          alert("✅ UID Locked (+₹50 Bonus) aur Referral Code apply (+₹50 Bonus)! Total ₹100 Bonus Wallet mein add ho gaya.");
          return;
        }
      } catch (err) {
        console.error("Auto referral claim error:", err);
      }
    }

    if (shouldGiveUidBonus) {
      alert(`✅ Free Fire ID Locked & 🎉 ₹${UID_LOCK_BONUS} Bonus Wallet (Match Entry Only) mein add ho gaya!`);
    } else {
      alert("✅ Free Fire ID Successfully Locked & Saved!");
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized!");
    const parsedMaxPlayers = Math.max(2, Number(maxPlayers) || 48);
    const initialStatus = normalizeMatchStatus(newMatchStatus);
    await addDoc(collection(db, "tournaments"), {
      title: matchTitle,
      timing: matchTime,
      entryFee: Number(entryFee),
      prizePool: prizePool,
      maxPlayers: parsedMaxPlayers,
      roomId: "Pending",
      roomPass: "Pending",
      players: [],
      kickedPlayers: [],
      status: initialStatus,
      createdAt: new Date()
    });
    alert("Match Live Ho Gaya!");
    setMatchTitle("");
    setMatchTime("");
    setEntryFee("");
    setPrizePool("");
    setMaxPlayers("48");
    setNewMatchStatus("Upcoming");
    setActiveTab("tournaments");
  };

  const handleChangeMatchStatus = async (matchId, nextStatus) => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!matchId) return;
    const cleanStatus = normalizeMatchStatus(nextStatus);
    try {
      await updateDoc(doc(db, "tournaments", matchId), {
        status: cleanStatus
      });
    } catch (error) {
      alert("Status update karne mein error aaya: " + error.message);
    }
  };

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
  };

  const handleRemovePlayerFromMatch = async (matchId, playerToRemove) => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!matchId || !playerToRemove) return;

    const matchObj = tournaments.find((m) => m.id === matchId);
    if (!matchObj) return;

    const updatedPlayers = (matchObj.players || []).filter(
      (p) => !(p.uid === playerToRemove.uid && p.ffUid === playerToRemove.ffUid)
    );

    const existingKicked = matchObj.kickedPlayers || [];
    const alreadyKicked = existingKicked.some(
      (k) =>
        (k.uid && playerToRemove.uid && k.uid === playerToRemove.uid) ||
        (k.ffUid && playerToRemove.ffUid && String(k.ffUid).trim() === String(playerToRemove.ffUid).trim())
    );
    const kickedEntry = {
      uid: playerToRemove.uid || "",
      ffUid: String(playerToRemove.ffUid || "").trim(),
      ffName: playerToRemove.ffName || "Player",
    };

    const entryFeeAmount = Number(matchObj.entryFee) || 0;

    try {
      await updateDoc(doc(db, "tournaments", matchId), {
        players: updatedPlayers,
        ...(alreadyKicked ? {} : { kickedPlayers: arrayUnion(kickedEntry) }),
      });

      if (playerToRemove.uid && entryFeeAmount > 0) {
        const playerRef = doc(db, "users", playerToRemove.uid);
        const refundTx = {
          text: `Removed from Match & Refunded: ${matchObj.title}`,
          amount: `+₹${entryFeeAmount}`,
          date: formatDateTime(new Date()),
        };
        await updateDoc(playerRef, {
          wallet: increment(entryFeeAmount),
          transactions: arrayUnion(refundTx),
        });
      }

      alert(
        entryFeeAmount > 0
          ? `✅ ${playerToRemove.ffName} ko match se nikal diya gaya, dobara join block kar diya gaya, aur ₹${entryFeeAmount} wallet mein refund kar diya gaya!`
          : `✅ ${playerToRemove.ffName} ko match se nikal diya gaya aur dobara join block kar diya gaya!`
      );
    } catch (error) {
      alert("Player hatane mein error aaya: " + error.message);
    }
  };

  const handleAllowBackPlayer = async (matchId, kickedPlayer) => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!matchId || !kickedPlayer) return;

    const matchObj = tournaments.find((m) => m.id === matchId);
    if (!matchObj) return;

    const updatedKicked = (matchObj.kickedPlayers || []).filter((k) => {
      const sameAuth = kickedPlayer.uid && k.uid && k.uid === kickedPlayer.uid;
      const sameFf = kickedPlayer.ffUid && k.ffUid && String(k.ffUid).trim() === String(kickedPlayer.ffUid).trim();
      return !(sameAuth || sameFf);
    });

    try {
      await updateDoc(doc(db, "tournaments", matchId), {
        kickedPlayers: updatedKicked,
      });
      alert(`✅ ${kickedPlayer.ffName} ko dobara is match mein join karne ki permission (Allow Back) de di gayi hai!`);
    } catch (error) {
      alert("Allow back karne mein error aaya: " + error.message);
    }
  };

  const handleCancelAndRefundMatch = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized!");
    if (!cancelMatchId) return alert("Please select a match to cancel!");

    const matchToCancel = tournaments.find(m => m.id === cancelMatchId);
    if (!matchToCancel) return alert("Match not found!");

    const entryFeeAmount = Number(matchToCancel.entryFee) || 0;
    const playersList = matchToCancel.players || [];

    for (const player of playersList) {
      if (player.uid && entryFeeAmount > 0) {
        const playerRef = doc(db, "users", player.uid);
        const refundTx = {
          text: `Refund for Cancelled Match: ${matchToCancel.title}`,
          amount: `+₹${entryFeeAmount}`,
          date: formatDateTime(new Date())
        };
        await updateDoc(playerRef, {
          wallet: increment(entryFeeAmount),
          transactions: arrayUnion(refundTx)
        });
      }
    }

    await deleteDoc(doc(db, "tournaments", cancelMatchId));
    alert(`Match cancelled successfully! Refunded ₹${entryFeeAmount} to ${playersList.length} players.`);
    setCancelMatchId("");
  };

  const handleSendPrize = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized!");
    if (sendingPrize) return;

    if (!prizeMatchId) return alert("Pehle match select karein!");
    if (!prizeWinnerUid) return alert("Winner player select karein!");
    if (calculatedTotalPrize <= 0) return alert("Total prize amount ₹0 se zyada hona chahiye!");

    const selectedMatch = tournaments.find(m => m.id === prizeMatchId);
    const winnerPlayer = selectedMatch?.players?.find(p => p.uid === prizeWinnerUid);

    setSendingPrize(true);
    try {
      const winnerRef = doc(db, "users", prizeWinnerUid);
      const matchLabel = selectedMatch?.title ? ` (${selectedMatch.title})` : "";

      const parts = [];
      if (parsedKills > 0) {
        parts.push(
          parsedPerKill > 0
            ? `${parsedKills} Kills (@₹${parsedPerKill}/kill = ₹${killsTotal})`
            : `${parsedKills} Kills`
        );
      }
      if (parsedBooyah > 0) parts.push(`Bonus ₹${parsedBooyah}`);
      const breakdownText = parts.length > 0 ? parts.join(" + ") : "Per-Kill Prize";

      const winTx = {
        text: `${breakdownText}${matchLabel}`,
        amount: `+₹${calculatedTotalPrize}`,
        date: formatDateTime(new Date())
      };

      await updateDoc(winnerRef, {
        wallet: increment(calculatedTotalPrize),
        transactions: arrayUnion(winTx)
      });

      await addDoc(collection(db, "winners_board"), {
        playerUid: prizeWinnerUid,
        ffName: winnerPlayer?.ffName || "Player",
        ffUid: winnerPlayer?.ffUid || "",
        matchTitle: selectedMatch?.title || "Tournament Match",
        booyahAmount: parsedBooyah,
        kills: parsedKills,
        perKillRate: parsedPerKill,
        killsPrize: killsTotal,
        totalPrize: calculatedTotalPrize,
        createdAt: new Date()
      });

      alert(
        `✅ ₹${calculatedTotalPrize} (${breakdownText}) winner${winnerPlayer?.ffName ? ` (${winnerPlayer.ffName})` : ""} ke wallet mein add ho gaya aur Scoreboard par update ho gaya!`
      );
      setKillsCount("0");
      setPrizeWinnerUid("");
    } catch (error) {
      alert("Prize bhejne mein error aaya: " + error.message);
    } finally {
      setSendingPrize(false);
    }
  };

  // 🔒 Double-click & double-refund se bachne ke liye Firestore Transaction
  const handleProcessRequest = async (req, action) => {
    if (!isAdmin || !req?.id) return;
    if (processingReqId === req.id) return;

    setProcessingReqId(req.id);
    const reqRef = doc(db, "wallet_requests", req.id);
    const userRef = doc(db, "users", req.userId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const reqSnap = await transaction.get(reqRef);
        if (!reqSnap.exists()) {
          return { ok: false, message: "Request nahi mili." };
        }

        const freshReq = reqSnap.data();
        if (freshReq.status !== "Pending") {
          return {
            ok: false,
            message: `Yeh request pehle hi "${freshReq.status}" ho chuki hai.`,
          };
        }

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          return { ok: false, message: "User account nahi mila." };
        }

        const amt = Number(freshReq.amount) || 0;
        const nowStr = formatDateTime(new Date());

        if (action === "APPROVE") {
          if (freshReq.type === "ADD") {
            transaction.update(userRef, {
              wallet: increment(amt),
              transactions: arrayUnion({
                text: `Added Money via UTR: ${freshReq.utr}`,
                amount: `+₹${amt}`,
                date: nowStr,
              }),
            });
          } else if (freshReq.type === "WITHDRAW") {
            transaction.update(userRef, {
              transactions: arrayUnion({
                text: `Withdrawal Paid to UPI: ${freshReq.upiId}`,
                amount: `-₹${amt}`,
                date: nowStr,
              }),
            });
          }
          transaction.update(reqRef, {
            status: "Approved",
            processedAt: nowStr,
          });
          return { ok: true, message: "Request Approved Successfully!" };
        } else {
          if (freshReq.type === "WITHDRAW") {
            transaction.update(userRef, {
              wallet: increment(amt),
              transactions: arrayUnion({
                text: `Withdrawal Rejected & Refunded`,
                amount: `+₹${amt}`,
                date: nowStr,
              }),
            });
          }
          transaction.update(reqRef, {
            status: "Rejected",
            processedAt: nowStr,
          });
          return { ok: true, message: "Request Rejected." };
        }
      });

      if (result.ok) {
        alert(result.message);
      } else {
        alert("⚠️ " + result.message);
      }
    } catch (error) {
      alert("Error processing request: " + error.message);
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleJoinMatch = async (match) => {
    if (!userData?.freeFireUid || !userData?.freeFireName) {
      alert("Match join karne ke liye pehle apni asli Free Fire UID aur IGN save karein!");
      setShowUidModal(true);
      return;
    }

    const matchRef = doc(db, "tournaments", match.id);
    const freshSnap = await getDoc(matchRef);
    const freshMatch = freshSnap.exists() ? freshSnap.data() : match;

    if (normalizeMatchStatus(freshMatch.status) === "Completed") {
      return alert("Yeh match complete ho chuka hai!");
    }

    if (isPlayerKickedFromMatch(freshMatch, user.uid, userData.freeFireUid)) {
      return alert("⚠️ Aapko is match se remove/block kiya gaya hai. Dobara join karne ke liye Admin se Allow Back karwayein.");
    }

    if (freshMatch.players?.some(p => p.uid === user.uid || (userData.freeFireUid && String(p.ffUid || "").trim() === String(userData.freeFireUid).trim()))) {
      return alert("Aap pehle hi is match mein join ho chuke hain!");
    }

    const slotLimit = Number(freshMatch.maxPlayers) || 48;
    if ((freshMatch.players?.length || 0) >= slotLimit) {
      return alert(`Match Full! Maximum ${slotLimit} players allowed hain.`);
    }

    const feeAmt = Number(freshMatch.entryFee) || 0;
    const currentMainWallet = Number(userData.wallet) || 0;
    const currentBonusWallet = Number(userData.bonusWallet) || 0;
    const totalAvailable = currentMainWallet + currentBonusWallet;

    if (feeAmt > 0 && totalAvailable < feeAmt) {
      alert("Bonus + Main Wallet mein balance kam hai! Pehle Add Money karein.");
      setActiveTab("wallet");
      setWalletMode("add");
      return;
    }

    const deductedFromBonus = feeAmt > 0 ? Math.min(currentBonusWallet, feeAmt) : 0;
    const deductedFromMain = feeAmt > 0 ? feeAmt - deductedFromBonus : 0;

    const newBonusWallet = currentBonusWallet - deductedFromBonus;
    const newMainWallet = currentMainWallet - deductedFromMain;

    const userRef = doc(db, "users", user.uid);
    const parts = [];
    if (deductedFromBonus > 0) parts.push(`₹${deductedFromBonus} Bonus`);
    if (deductedFromMain > 0) parts.push(`₹${deductedFromMain} Wallet`);

    const joinTx = {
      text: `Joined Match: ${freshMatch.title}${parts.length > 0 ? ` (${parts.join(" + ")})` : ""}`,
      amount: feeAmt > 0 ? `-₹${feeAmt}` : `FREE`,
      date: formatDateTime(new Date())
    };

    await updateDoc(userRef, { 
      wallet: newMainWallet,
      bonusWallet: newBonusWallet,
      transactions: arrayUnion(joinTx)
    });
    await updateDoc(matchRef, {
      players: arrayUnion({
        uid: user.uid,
        ffUid: userData.freeFireUid,
        ffName: userData.freeFireName
      })
    });

    alert("Match Joined Successfully!");
  };

  const handleAddMoneyRequest = async (e) => {
    e.preventDefault();
    if (submittingRequest) return;

    const cleanUtr = utrNumber.trim();
    const amt = Number(addAmount);

    if (!amt || amt <= 0) {
      return alert("⚠️ Sahi amount daalein!");
    }

    const utrRegex = /^\d{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      return alert("⚠️ Error: UTR number exact 12 digits ka valid number hona chahiye!");
    }

    setSubmittingRequest(true);
    try {
      const utrQuery = query(
        collection(db, "wallet_requests"), 
        where("utr", "==", cleanUtr)
      );
      const querySnapshot = await getDocs(utrQuery);
      const isDuplicate = querySnapshot.docs.some(doc => doc.data().status !== "Rejected");

      if (isDuplicate) {
        setSubmittingRequest(false);
        return alert("⚠️ Error: Yeh UTR number pehle hi use ho chuka hai! Fake ya duplicate entry allowed nahi hai.");
      }

      await addDoc(collection(db, "wallet_requests"), {
        type: "ADD",
        userId: user.uid,
        userName: userData?.freeFireName || user.displayName || "Player",
        email: user.email,
        amount: amt,
        utr: cleanUtr,
        status: "Pending",
        createdAt: new Date().toISOString()
      });

      alert("✅ Deposit Request bhej di gayi hai! Admin verify karke approve kar dega.");
      setAddAmount("");
      setUtrNumber("");
    } catch (error) {
      alert("Error submitting request: " + error.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    if (submittingRequest) return;

    const amt = Number(withdrawAmount);
    const currentWithdrawableWallet = Number(userData?.wallet) || 0;
    if (amt < 30) return alert("Minimum withdrawal ₹30 hai!");
    if (amt > currentWithdrawableWallet) {
      return alert("⚠️ Aapke Withdrawable Wallet mein itna balance nahi hai! Bonus Wallet sirf match entry ke liye hai.");
    }
    if (!withdrawUpi) return alert("Apna UPI ID daalein!");

    setSubmittingRequest(true);
    try {
      const newBalance = currentWithdrawableWallet - amt;
      await updateDoc(doc(db, "users", user.uid), { wallet: newBalance });
      await addDoc(collection(db, "wallet_requests"), {
        type: "WITHDRAW",
        userId: user.uid,
        userName: userData?.freeFireName || user.displayName || "Player",
        email: user.email,
        amount: amt,
        upiId: withdrawUpi.trim(),
        status: "Pending",
        createdAt: new Date().toISOString()
      });

      alert("✅ Withdrawal Request bhej di gayi hai!");
      setWithdrawAmount("");
      setWithdrawUpi("");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const renderLegalModal = () => {
    if (!legalModal) return null;
    const isTerms = legalModal === "terms";

    return (
      <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
        <div className={`max-w-2xl w-full border ${cardBg} p-6 rounded-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col`}>
          <div className={`flex justify-between items-center border-b ${borderDivider} pb-3`}>
            <h2 className={`text-lg sm:text-xl font-extrabold ${headingText}`}>
              {isTerms ? "📜 Terms & Conditions — BR Esports Arena" : "🔒 Privacy Policy — BR Esports Arena"}
            </h2>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${tabInactive}`}
            >
              ✕
            </button>
          </div>

          <div className={`overflow-y-auto pr-1 space-y-3 text-xs sm:text-sm leading-relaxed ${mutedText}`}>
            {isTerms ? (
              <>
                <p>
                  <strong className={titleText}>1. Skill-Based Platform:</strong> BR Esports Arena ek competitive esports tournament platform hai. Yeh koi gambling, betting, ya lottery platform nahi hai—matches ke results sirf players ki Free Fire gameplay skills par depend karte hain.
                </p>
                <p>
                  <strong className={titleText}>2. Account & Free Fire UID:</strong> Har player ko apni asli Free Fire UID (8–12 digits) aur In-Game Name (IGN) dena zaroori hai. Ek baar lock hone ke baad UID khud se change nahi hogi; galat ya fake UID daalne par account suspend kiya ja sakta hai.
                </p>
                <p>
                  <strong className={titleText}>3. Eligibility (Age & Local Laws):</strong> Paid matches sirf 18+ saal ke users aur unhi states/regions ke liye hain jahan local laws skill-based tournaments ki anumati dete hain.
                </p>
                <p>
                  <strong className={titleText}>4. Fair Play & Anti-Cheat:</strong> Hack, panel, script, unauthorized emulator, ya solo match mein team-up karne par player ko match/platform se ban kiya jayega aur koi prize ya refund nahi diya jayega.
                </p>
                <p>
                  <strong className={titleText}>5. Wallet, Bonus, Deposit & Withdrawal:</strong> Bonus Wallet sirf match entry fee mein deduct hota hai aur withdraw nahi hota. Deposit ke liye valid amount aur exact 12-digit UTR submit karna zaroori hai. Minimum withdrawal ₹30 hai aur sirf Withdrawable Wallet se nikala ja sakta hai.
                </p>
                <p>
                  <strong className={titleText}>6. Match Room & Refunds:</strong> Room ID aur Password match se 10 minutes pehle match card mein update hota hai. Agar match cancel hota hai toh entry fee wallet mein refund kar di jati hai.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong className={titleText}>1. Information We Collect:</strong> Jab aap Google se login karte hain, hum aapka naam, email address, aur account ID lete hain. Tournament khelne ke liye hum aapki Free Fire UID, IGN, deposit ke waqt UTR number, aur withdrawal ke waqt UPI ID store karte hain.
                </p>
                <p>
                  <strong className={titleText}>2. How We Use Your Data:</strong> Aapki information ka use sirf account login, match slots verify karne, Room ID/Password dene, winnings add karne, aur deposit/withdrawal requests process karne ke liye hota hai.
                </p>
                <p>
                  <strong className={titleText}>3. Data Security & Third-Party Services:</strong> Hum aapka personal data kisi third-party ko sell ya rent nahi karte. Platform chalane ke liye hum trusted services jaise Google Firebase (Authentication & Database) aur Tawk.to (Live Support) ka use karte hain.
                </p>
                <p>
                  <strong className={titleText}>4. Support & Data Queries:</strong> Apne account, UID update, ya data se judi kisi bhi madad ke liye aap app mein diye gaye Live Support button ke zariye humse contact kar sakte hain.
                </p>
              </>
            )}
          </div>

          <div className={`pt-3 border-t ${borderDivider} flex justify-between items-center gap-2`}>
            <button
              type="button"
              onClick={() => setLegalModal(isTerms ? "privacy" : "terms")}
              className={`text-xs underline font-semibold cursor-pointer ${headingText}`}
            >
              {isTerms ? "Read Privacy Policy →" : "Read Terms & Conditions →"}
            </button>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center`}>
        <p className={`${headingText} font-bold text-lg animate-pulse`}>Loading BR Esports Arena...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <main className={`min-h-screen ${pageBg} flex flex-col items-center justify-center p-4`}>
        {renderLegalModal()}
        <div className={`max-w-md w-full border ${cardBg} p-8 rounded-2xl text-center shadow-2xl`}>
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${tabInactive}`}
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
          <span className="text-5xl block mb-4">🎮</span>
          <h1 className={`text-3xl font-extrabold ${headingText} mb-2`}>BR Esports Arena</h1>
          <p className={`${mutedText} text-sm mb-6`}>Free Fire Solo Custom Room Tournaments. Jeeto Real Cash!</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg cursor-pointer border border-slate-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.3C.6 9.3 0 11.6 0 14s.6 4.7 1.6 6.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 15.7C3.5 19.5 7.4 23 12 23z"/>
            </svg>
            Continue with Google
          </button>

          <p className={`text-[11px] ${subtleText} mt-4 leading-relaxed`}>
            Continue karke aap hamare{" "}
            <button type="button" onClick={() => setLegalModal("terms")} className={`${headingText} underline font-semibold cursor-pointer`}>
              Terms & Conditions
            </button>{" "}
            aur{" "}
            <button type="button" onClick={() => setLegalModal("privacy")} className={`${headingText} underline font-semibold cursor-pointer`}>
              Privacy Policy
            </button>{" "}
            se sehmat hote hain.
          </p>
        </div>
      </main>
    );
  }

  if (userData && !userData.freeFireUid && !hasAcceptedFairPlayNotice) {
    return (
      <main className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}>
        {renderLegalModal()}
        <div className={`max-w-xl w-full border ${cardBg} p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5`}>
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
              🛡️ Platform Notice
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${tabInactive}`}
              >
                {isDarkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
              <button 
                type="button"
                onClick={handleLogout}
                className="bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          <div>
            <h2 className={`text-xl sm:text-2xl font-extrabold ${headingText}`}>
              Skill-Based Esports Declaration
            </h2>
            <p className={`text-xs ${mutedText} mt-1`}>
              Yeh sirf ek baar ka confirmation hai—OK dabate hi dubara nahi aayega.
            </p>
          </div>

          <div className={`border p-4 rounded-xl space-y-2 text-xs sm:text-sm leading-relaxed ${subCardBg}`}>
            <p className={`${titleText} font-semibold`}>
              BR Esports Arena koi <span className="text-yellow-400 font-bold">gambling</span>,{" "}
              <span className="text-yellow-400 font-bold">betting</span>, ya{" "}
              <span className="text-yellow-400 font-bold">lottery</span> platform nahi hai.
            </p>
            <p className={mutedText}>
              Yeh ek skill-based esports tournament platform hai, jahan match ke results players ki gameplay skill par depend karte hain.
            </p>
          </div>

          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none ${subCardBg}`}>
            <input
              type="checkbox"
              checked={fairPlayChecked}
              onChange={(e) => setFairPlayChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-yellow-500 cursor-pointer shrink-0"
            />
            <span className={`text-xs sm:text-sm ${titleText}`}>
              Main samajhta/samajhti hoon ki yeh skill-based esports platform hai, aur main{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalModal("terms"); }}
                className={`${headingText} underline font-bold cursor-pointer`}
              >
                Terms & Conditions
              </button>{" "}
              aur{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalModal("privacy"); }}
                className={`${headingText} underline font-bold cursor-pointer`}
              >
                Privacy Policy
              </button>{" "}
              se sehmat hoon.
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!fairPlayChecked}
              onClick={markFairPlayAccepted}
              className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-extrabold px-8 py-3 rounded-xl text-sm cursor-pointer transition shadow-md"
            >
              OK →
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (userData && !userData.freeFireUid && !hasPassedIntroGuide) {
    return (
      <main className={`min-h-screen ${pageBg} py-8 px-4`}>
        {renderLegalModal()}
        <div className="max-w-4xl mx-auto">
          <div className={`border ${cardBg} p-5 sm:p-6 rounded-2xl space-y-5 shadow-xl`}>
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h2 className={`text-xl sm:text-2xl font-bold ${headingText}`}>📖 How to Play — Naye Players Ke Liye Complete Guide</h2>
                <p className={`text-xs ${mutedText} mt-1`}>
                  Welcome, <strong className={titleText}>{user.displayName}</strong>! Pehle poora process samjhein—apni Free Fire UID aap baad mein bhi daal sakte hain.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${tabInactive}`}
                >
                  {isDarkMode ? "☀️ Light" : "🌙 Dark"}
                </button>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>1. Asli Free Fire UID Daalein & Lock Karein</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  Apni <strong className={titleText}>asli Free Fire UID</strong> (8–12 digits) aur <strong className={titleText}>In-Game Name (IGN)</strong> daalein. UID lock karte hi <strong className={titleText}>₹50 Bonus Wallet</strong> (match entry ke liye) milta hai.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>2. Bonus Wallet vs Withdrawable Wallet</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  <strong className={titleText}>Bonus Wallet</strong> (₹50 UID + ₹50 Referral = ₹100 tak) sirf <strong className={titleText}>match entry fees</strong> mein deduct hota hai. <strong className={titleText}>Withdrawable Wallet</strong> se aap minimum <strong className={titleText}>₹30</strong> UPI mein nikaal sakte hain.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>3. Match Join & Room ID / Password</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  <strong className={titleText}>🏆 Tournaments</strong> tab mein apna match chunein aur <strong className={titleText}>Join Now</strong> dabayein. Join hoti hi match card ke andar credentials section dikhega aur <strong className={titleText}>match se 10 minutes pehle aapko Room ID and Password milega</strong>.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>4. Per-Kill Winnings, Refund & Withdrawal</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  Sabhi matches per-kill basis par chalenge (rate har match ke hisaab se alag-alag rahega). Kills ka payout aapke Withdrawable Wallet mein add hota hai aur <strong className={titleText}>🏅 Winners & Kills</strong> / <strong className={titleText}>📜 History</strong> mein dikhta hai.
                </p>
              </div>
            </div>

            <div className={`pt-3 border-t ${borderDivider} flex flex-wrap justify-between items-center gap-3`}>
              <button
                type="button"
                onClick={async () => {
                  await markIntroGuideCompleted();
                  setShowUidModal(true);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition ${tabInactive}`}
              >
                🔑 Abhi UID Daalein
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markIntroGuideCompleted}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition ${tabInactive}`}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={markIntroGuideCompleted}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer transition shadow-md"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://br-esports-arena.web.app";
  const myRefCode = userData?.refCode || "";
  const shareLink = `${originUrl}/?ref=${myRefCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareLink)}`;
  const waMessage = `🎮 *BR Esports Arena* par Free Fire Solo Custom Room khelo aur Real Cash jeeto!\n\n🎁 Mere link se join karo, apni FF UID lock karte hi *₹50 Bonus* aur referral par *+₹50 Bonus* (Match Entry ke liye) pao:\n${shareLink}\n\n🔑 Referral Code: *${myRefCode}*`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  return (
    <main className={`min-h-screen ${pageBg} p-4 transition-colors duration-200`}>
      {renderLegalModal()}

      <header className={`flex flex-wrap justify-between items-center border-b ${borderDivider} pb-4 mb-6 gap-3`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <h1 className={`text-xl font-bold ${headingText}`}>BR Esports Arena</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {userData?.freeFireUid ? (
                <p className={`text-xs ${mutedText}`}>ID: {userData?.freeFireName} ({userData?.freeFireUid}) 🔒</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUidModal(true)}
                  className="text-xs bg-yellow-500/20 border border-yellow-500/60 text-yellow-400 hover:bg-yellow-500 hover:text-slate-950 font-bold px-2 py-0.5 rounded cursor-pointer transition"
                >
                  ⚠️ Asli FF UID Daalein (+₹50 Bonus)
                </button>
              )}
              <a 
                href="https://tawk.to/chat/6af97899375b123c45407054/1k7f7u6u3?layout=modern"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[11px] ${headingText} underline font-medium`}
              >
                UID change karwani hai? Support 💬
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={toggleTheme}
            title="Switch Light / Dark Theme"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${tabInactive}`}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button 
            onClick={() => { setActiveTab("wallet"); setWalletMode("add"); }}
            className={`border px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition ${cardBg} hover:border-green-500`}
          >
            <span className={`text-xs ${mutedText}`}>Wallet:</span>
            <span className="font-bold text-green-500">₹{userData?.wallet ?? 0}</span>
            <span className={`text-xs font-bold ${headingText}`}>• Bonus: ₹{userData?.bonusWallet ?? 0}</span>
            <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">+ Add</span>
          </button>

          <button 
            onClick={handleLogout}
            className="bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {showUidModal && userData && !userData.freeFireUid && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full border ${cardBg} p-6 rounded-2xl shadow-2xl space-y-4`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-bold ${headingText}`}>🔑 Asli Free Fire UID Daalein (+₹50 Bonus)</h2>
              <button
                type="button"
                onClick={() => setShowUidModal(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${tabInactive}`}
              >
                ✕
              </button>
            </div>
            <p className={`text-xs ${mutedText}`}>
              Apni asli Free Fire UID daalein (8 se 12 digits) aur In-Game Name (IGN) — UID lock hote hi ₹50 Bonus Wallet (match entry ke liye) milega:
            </p>
            <p className="text-[11px] text-red-500 font-semibold">
              ⚠️ Dhyan rahe: Ek baar UID save hone ke baad aap khud se change nahi kar sakenge!
            </p>
            <form onSubmit={saveFreeFireDetails} className="space-y-3">
              <input 
                type="text" 
                placeholder="Asli Free Fire UID (e.g. 24589631)" 
                value={ffUid} 
                onChange={(e) => setFfUid(e.target.value)}
                className={`w-full border p-3 rounded-lg font-mono text-sm ${inputBg}`}
                required
              />
              <input 
                type="text" 
                placeholder="In-Game Name (IGN)" 
                value={ffName} 
                onChange={(e) => setFfName(e.target.value)}
                className={`w-full border p-3 rounded-lg text-sm ${inputBg}`}
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUidModal(false)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold cursor-pointer ${tabInactive}`}
                >
                  Baad Mein Daalenge
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer transition"
                >
                  Save & Lock UID 🔒
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`${isDarkMode ? "bg-amber-950/40 border-amber-600/50 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-900"} border p-3 rounded-lg mb-6 text-sm`}>
        <span>🔥 <b>Rules:</b> Sabhi matches <b>Per Kill</b> basis par chalenge (rate har match ke hisaab se alag-alag rahega). Bonus Wallet sirf match entry fee ke liye hai.</span>
      </div>

      <div className={`flex gap-2 mb-6 border-b ${borderDivider} pb-3 overflow-x-auto`}>
        <button 
          onClick={() => setActiveTab("tournaments")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "tournaments" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
        >
          🏆 Tournaments
        </button>
        <button 
          onClick={() => setActiveTab("scoreboard")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "scoreboard" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
        >
          🏅 Winners & Kills ({sortedWinnersBoard.length})
        </button>
        <button 
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "wallet" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
        >
          💳 Wallet
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "history" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
        >
          📜 History
        </button>
        <button 
          onClick={() => setActiveTab("guide")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "guide" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
        >
          📖 How to Play
        </button>
        
        {isAdmin && (
          <button 
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${activeTab === "admin" ? "bg-yellow-500 text-slate-950 font-bold" : tabInactive}`}
          >
            🔒 Admin Panel
          </button>
        )}
      </div>

      {activeTab === "tournaments" && (
        <div className="space-y-4">
          {showQuickGuide && (
            <div className={`border p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${cardBg}`}>
              <div className="space-y-1">
                <p className={`font-bold ${headingText}`}>👋 Naye Player hain? Bas 3 steps mein khelein:</p>
                <p className={mutedText}>
                  1. Asli FF UID lock karke <strong className={titleText}>₹50 Bonus</strong> (+₹50 referral) lein • 2. Match <strong className={titleText}>Join Now</strong> karein (Bonus Wallet pehle deduct hoga) aur yahin <strong className={titleText}>Room ID & Pass</strong> lein • 3. Per-kill payout Withdrawable Wallet mein aayega.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("guide")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition"
                >
                  Full Guide
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickGuide(false)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer transition ${tabInactive}`}
                  title="Hide tip"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className={`border p-4 rounded-xl space-y-3 ${cardBg}`}>
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold ${mutedText}`}>Entry:</span>
                {[
                  { id: "ALL", label: "All Matches" },
                  { id: "FREE", label: "🆓 Free" },
                  { id: "PAID", label: "💰 Paid" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeeFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      feeFilter === item.id ? "bg-yellow-500 text-slate-950" : tabInactive
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold ${mutedText}`}>Status:</span>
                {[
                  { id: "ACTIVE_ALL", label: "Active" },
                  { id: "Upcoming", label: "⏳ Upcoming" },
                  { id: "Live", label: "🔴 Live" },
                  { id: "Completed", label: "✅ Completed" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                      statusFilter === st.id ? "bg-yellow-500 text-slate-950" : tabInactive
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="🔍 Match title, timing (e.g. 8:30 PM), ya rate se search karein..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className={`w-full border p-2.5 rounded-lg text-xs sm:text-sm ${inputBg}`}
              />
              {(matchSearch || feeFilter !== "ALL" || statusFilter !== "ACTIVE_ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setMatchSearch("");
                    setFeeFilter("ALL");
                    setStatusFilter("ACTIVE_ALL");
                  }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition ${tabInactive}`}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {filteredTournaments.length === 0 ? (
            <div className={`text-center py-12 border rounded-xl ${cardBg}`}>
              <span className="text-4xl mb-2 block">🎮</span>
              <p className={mutedText}>Is filter ya search ke mutabik koi match nahi mila.</p>
            </div>
          ) : (
            filteredTournaments.map((match) => {
              const isJoined = match.players?.some(
                (p) =>
                  p.uid === user.uid ||
                  (userData?.freeFireUid && String(p.ffUid || "").trim() === String(userData.freeFireUid).trim())
              );
              const isRemoved = isPlayerKickedFromMatch(match, user.uid, userData?.freeFireUid);
              const slotLimit = Number(match.maxPlayers) || 48;
              const joinedCount = match.players?.length || 0;
              const isFull = joinedCount >= slotLimit;
              const matchStatus = normalizeMatchStatus(match.status);
              const isCompleted = matchStatus === "Completed";

              const hasRoomId = match.roomId && match.roomId !== "Pending";
              const hasRoomPass = match.roomPass && match.roomPass !== "Pending";

              const statusBadgeClass =
                matchStatus === "Live"
                  ? "bg-red-500/20 text-red-500 border border-red-500/40"
                  : matchStatus === "Completed"
                  ? "bg-slate-500/20 text-slate-400 border border-slate-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40";

              return (
                <div key={match.id} className={`border p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${cardBg}`}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded font-bold uppercase">Solo • Bermuda</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusBadgeClass}`}>
                        {matchStatus === "Live" ? "🔴 Live" : matchStatus === "Completed" ? "✅ Completed" : "⏳ Upcoming"}
                      </span>
                      {match.timing && (
                        <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded font-semibold">
                          ⏰ {match.timing}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold mt-2 ${titleText}`}>{match.title}</h3>
                    <p className={`text-sm font-semibold ${headingText} mt-1`}>Rate / Prize: {match.prizePool}</p>
                    <p className={`text-xs ${mutedText} mt-1`}>Players Joined: {joinedCount} / {slotLimit}</p>
                    
                    {isJoined ? (
                      <div className={`mt-3 border px-3 py-2.5 rounded-lg text-xs font-mono space-y-1.5 ${subCardBg} border-green-700/50 text-green-500`}>
                        <p className={`font-bold ${headingText}`}>🎯 Your Room Credentials:</p>
                        {hasRoomId && hasRoomPass ? (
                          <>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p>Room ID: <span className={`${titleText} font-bold`}>{match.roomId}</span></p>
                              <button
                                type="button"
                                onClick={() => handleCopyCredential(match.roomId, `${match.id}-id`, "Room ID")}
                                className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-sans font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer transition"
                              >
                                {copiedKey === `${match.id}-id` ? "✅ Copied ID" : "📋 Copy ID"}
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p>Password: <span className={`${titleText} font-bold`}>{match.roomPass}</span></p>
                              <button
                                type="button"
                                onClick={() => handleCopyCredential(match.roomPass, `${match.id}-pass`, "Room Password")}
                                className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-sans font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer transition"
                              >
                                {copiedKey === `${match.id}-pass` ? "✅ Copied Pass" : "📋 Copy Pass"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className={`${titleText} font-sans font-medium`}>
                            Match se 10 minutes pehle aapko Room ID and Password milega
                          </p>
                        )}
                      </div>
                    ) : isRemoved ? (
                      <div className={`mt-3 border px-3 py-1.5 rounded text-xs ${isDarkMode ? "bg-red-950/40 border-red-700/50 text-red-300" : "bg-red-50 border-red-300 text-red-700"}`}>
                        ⚠️ Aapko is match se remove kiya gaya hai. Dobara join karne ke liye Admin se Allow Back karwayein.
                      </div>
                    ) : (
                      <div className={`mt-3 border px-3 py-1.5 rounded text-xs ${subCardBg} ${mutedText}`}>
                        🔒 Join match to unlock Room ID & Password.
                      </div>
                    )}
                  </div>

                  <div className={`sm:text-right flex sm:block justify-between items-center border-t sm:border-t-0 ${borderDivider} pt-3 sm:pt-0`}>
                    <div>
                      <p className={`text-xs ${mutedText}`}>Entry Fee</p>
                      <p className={`text-lg font-bold ${titleText} mb-2`}>{match.entryFee === 0 ? "FREE" : `₹${match.entryFee}`}</p>
                    </div>
                    {isJoined ? (
                      <span className="bg-green-600/20 border border-green-600 text-green-500 font-bold px-4 py-1.5 rounded-lg text-sm">
                        ✅ Joined
                      </span>
                    ) : isCompleted ? (
                      <span className="bg-slate-600/20 border border-slate-500 text-slate-400 font-bold px-4 py-1.5 rounded-lg text-sm">
                        Completed
                      </span>
                    ) : isRemoved ? (
                      <span className="bg-red-600/20 border border-red-600 text-red-500 font-bold px-4 py-1.5 rounded-lg text-sm">
                        Blocked (Admin Allow Needed)
                      </span>
                    ) : isFull ? (
                      <span className="bg-red-600/20 border border-red-600 text-red-500 font-bold px-4 py-1.5 rounded-lg text-sm">
                        Slot Full
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

      {activeTab === "scoreboard" && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className={`border p-5 rounded-xl ${cardBg}`}>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div>
                <h2 className={`text-lg font-bold ${headingText}`}>🏅 Recent Winners & Kills</h2>
                <p className={`text-xs ${mutedText}`}>
                  Recent match players, unke kills, aur unko mili total per-kill prize amount.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && sortedWinnersBoard.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearScoreboard}
                    className="bg-red-600/20 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer transition"
                  >
                    🧹 Clear All
                  </button>
                )}
                <span className="text-xs bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 px-3 py-1 rounded-full font-bold">
                  Verified Payouts
                </span>
              </div>
            </div>

            {sortedWinnersBoard.length === 0 ? (
              <div className={`text-center py-10 border rounded-xl ${subCardBg}`}>
                <span className="text-3xl block mb-2">🏆</span>
                <p className={`text-xs ${subtleText}`}>Abhi scoreboard par koi payout record nahi hai.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedWinnersBoard.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${subCardBg}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${titleText}`}>
                          {item.ffName || "Player"}
                        </span>
                        {item.ffUid && (
                          <span className={`text-[11px] font-mono ${mutedText}`}>
                            (UID: {item.ffUid})
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${mutedText}`}>
                        Match: <strong className={titleText}>{item.matchTitle || "Tournament"}</strong>
                      </p>
                      <div className="flex items-center gap-3 flex-wrap text-[11px]">
                        <span className="text-blue-500 font-semibold">
                          🔫 Kills: {Number(item.kills) || 0}
                        </span>
                        {(Number(item.perKillRate) || 0) > 0 && (
                          <span className={`${headingText} font-semibold`}>
                            ₹{Number(item.perKillRate) || 0}/kill
                          </span>
                        )}
                        {formatDateTime(item.createdAt) && (
                          <span className={subtleText}>{formatDateTime(item.createdAt)}</span>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:items-center gap-3 justify-between">
                      <div>
                        <span className={`text-[11px] block ${mutedText}`}>Prize Won</span>
                        <span className="text-lg font-extrabold text-emerald-500">
                          +₹{Number(item.totalPrize) || 0}
                        </span>
                      </div>
                      {isAdmin && item.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteScoreboardEntry(item.id)}
                          title="Delete entry"
                          className="bg-red-600/20 border border-red-600/60 text-red-500 hover:bg-red-600 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="max-w-4xl mx-auto space-y-5">
          <div className={`border p-5 sm:p-6 rounded-2xl ${cardBg}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border mb-5 ${subCardBg}`}>
              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <span className={`text-xs block ${mutedText}`}>Withdrawable Balance (Main + Winnings)</span>
                <span className="text-2xl font-extrabold text-green-500">₹{userData?.wallet ?? 0}</span>
                <span className={`text-[10px] block mt-0.5 ${subtleText}`}>Min Withdraw: ₹30</span>
              </div>
              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <span className={`text-xs block ${mutedText}`}>Bonus Wallet (Match Entry Only)</span>
                <span className={`text-2xl font-extrabold ${headingText}`}>₹{userData?.bonusWallet ?? 0}</span>
                <span className={`text-[10px] block mt-0.5 ${subtleText}`}>Auto-deducts in match entry • Non-withdrawable</span>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-lg border w-full sm:w-auto ${subCardBg}`}>
                <button 
                  type="button"
                  onClick={() => setWalletMode("add")}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${walletMode === "add" ? "bg-green-600 text-white" : mutedText}`}
                >
                  ➕ Add Money
                </button>
                <button 
                  type="button"
                  onClick={() => setWalletMode("withdraw")}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${walletMode === "withdraw" ? "bg-blue-600 text-white" : mutedText}`}
                >
                  💸 Withdraw
                </button>
              </div>
            </div>

            {walletMode === "add" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className={`border p-4 rounded-xl text-center flex flex-col items-center ${subCardBg}`}>
                  <p className={`text-xs ${mutedText} mb-2 font-semibold`}>Scan & Pay via UPI App:</p>
                  <div className="bg-white p-2.5 rounded-xl border border-yellow-500/50 shadow inline-block">
                    <img 
                      src="/qr-code.png" 
                      alt="BR Esports QR Code" 
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain mx-auto block" 
                    />
                  </div>
                  <div className={`mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-wrap justify-center ${cardBg}`}>
                    <span className={`text-[11px] ${mutedText}`}>UPI:</span>
                    <span className={`text-[11px] ${headingText} font-mono font-bold`}>{MERCHANT_UPI_ID}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(MERCHANT_UPI_ID);
                        alert("📋 UPI ID Copied to Clipboard!");
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddMoneyRequest} className="space-y-3">
                  <p className={`text-xs font-semibold ${mutedText}`}>Pay karne ke baad details bhar kar request bhejein:</p>
                  <input 
                    type="number" 
                    placeholder="Amount Paid (₹)" 
                    value={addAmount} 
                    onChange={(e) => setAddAmount(e.target.value)}
                    className={`w-full border p-2.5 rounded-lg text-sm ${inputBg}`}
                    required
                  />
                  <input 
                    type="text" 
                    maxLength={12}
                    placeholder="Exact 12-Digit UTR Number" 
                    value={utrNumber} 
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    className={`w-full border p-2.5 rounded-lg text-sm font-mono ${inputBg}`}
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={submittingRequest}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2.5 rounded-lg cursor-pointer transition"
                  >
                    {submittingRequest ? "Verifying & Submitting..." : "Submit Deposit Request"}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleWithdrawRequest} className="space-y-3 max-w-xl mx-auto">
                <p className={`text-xs font-semibold ${mutedText}`}>
                  Minimum withdrawal ₹30 hai. Sirf <strong className={titleText}>Withdrawable Balance (₹{userData?.wallet ?? 0})</strong> withdraw hoga:
                </p>
                <input 
                  type="number" 
                  placeholder="Withdraw Amount (Min ₹30)" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className={`w-full border p-2.5 rounded-lg text-sm ${inputBg}`}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Your UPI ID (e.g. name@ybl)" 
                  value={withdrawUpi} 
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  className={`w-full border p-2.5 rounded-lg text-sm ${inputBg}`}
                  required
                />
                <button 
                  type="submit" 
                  disabled={submittingRequest}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2.5 rounded-lg cursor-pointer transition"
                >
                  {submittingRequest ? "Processing..." : "Request Withdrawal"}
                </button>
              </form>
            )}
          </div>

          <div className={`border p-5 sm:p-6 rounded-2xl space-y-4 ${cardBg}`}>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className={`text-lg font-extrabold ${headingText}`}>🎁 Refer & Earn — ₹50 + ₹50 Bonus Wallet!</h3>
                <p className={`text-xs ${mutedText}`}>
                  Asli Free Fire UID lock karne par <strong className={titleText}>₹50 Bonus</strong> aur dost ke referral code par <strong className={titleText}>+₹50 Bonus</strong> (total ₹100 tak) Bonus Wallet mein milta hai—jo <strong className={titleText}>sirf match entry fee</strong> mein deduct hota hai.
                </p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-500 border border-green-500/40 px-3 py-1 rounded-full font-bold">
                ₹50 + ₹50 Entry Bonus
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${subCardBg}`}>
              <div>
                <span className={`text-[11px] block ${mutedText}`}>Aapka Referral Code</span>
                <span className={`text-lg font-mono font-extrabold tracking-wider ${headingText}`}>{myRefCode}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <span>📲</span> WhatsApp Share
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    alert("📋 Referral Link Copy Ho Gaya!");
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition"
                >
                  🔗 Copy Link
                </button>

                <button
                  type="button"
                  onClick={() => setShowRefQr((prev) => !prev)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition ${tabInactive}`}
                >
                  {showRefQr ? "✕ Hide QR" : "📷 QR Code"}
                </button>
              </div>
            </div>

            {showRefQr && (
              <div className={`p-4 rounded-xl border text-center space-y-2.5 ${subCardBg}`}>
                <p className={`text-xs font-semibold ${titleText}`}>
                  Dost ko yeh QR Code scan karwayein ya WhatsApp par bhejein:
                </p>
                <div className="bg-white p-3 rounded-xl inline-block border border-yellow-500/50 shadow">
                  <img
                    src={qrImageUrl}
                    alt="Referral QR Code"
                    className="w-44 h-44 object-contain mx-auto block"
                  />
                </div>
                <p className={`text-[11px] font-mono break-all ${mutedText}`}>{shareLink}</p>
                <div>
                  <a
                    href={qrImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`BR-Referral-${myRefCode}.png`}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    ⬇️ Open / Save QR
                  </a>
                </div>
              </div>
            )}

            {!userData?.referralClaimed ? (
              <form onSubmit={handleManualReferralSubmit} className={`p-3.5 rounded-xl border space-y-2 ${subCardBg}`}>
                <label className={`block text-xs font-bold ${titleText}`}>
                  🎟️ Kisi dost ka Referral Code hai? Daalein aur +₹50 Entry Bonus paayein:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Referral Code (e.g. BR8X4K2)"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                    className={`flex-1 border p-2.5 rounded-lg text-xs font-mono uppercase ${inputBg}`}
                  />
                  <button
                    type="submit"
                    disabled={applyingReferral}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition shrink-0"
                  >
                    {applyingReferral ? "Checking..." : "Claim +₹50"}
                  </button>
                </div>
                {!userData?.freeFireUid && (
                  <p className="text-[11px] text-amber-400">
                    * Bonus unlock karne ke liye pehle apni asli Free Fire UID lock karna zaroori hai.
                  </p>
                )}
              </form>
            ) : (
              <div className="text-xs text-green-500 font-semibold">
                ✅ Aap apna ₹50 Referral Entry Bonus pehle hi claim kar chuke hain!
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="max-w-4xl mx-auto">
          <div className={`border p-5 sm:p-6 rounded-2xl ${cardBg}`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h2 className={`text-lg font-bold ${headingText}`}>📜 Account History</h2>
                <p className={`text-xs ${mutedText}`}>Apni transactions aur deposit/withdrawal requests ka status dekhein.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWalletHistoryTab("transactions")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    walletHistoryTab === "transactions" ? "bg-yellow-500 text-slate-950" : tabInactive
                  }`}
                >
                  📜 Transactions ({userData?.transactions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setWalletHistoryTab("requests")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                    walletHistoryTab === "requests" ? "bg-yellow-500 text-slate-950" : tabInactive
                  }`}
                >
                  📋 My Requests ({myRequests?.length || 0})
                </button>
              </div>
            </div>

            {walletHistoryTab === "transactions" ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(!userData?.transactions || userData.transactions.length === 0) ? (
                  <p className={`text-xs ${subtleText} text-center py-8`}>Koi transaction history nahi hai.</p>
                ) : (
                  [...userData.transactions].reverse().map((tx, idx) => {
                    const txDate = formatDateTime(tx.date);
                    return (
                      <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center gap-2 text-xs ${subCardBg}`}>
                        <div>
                          <p className={`font-semibold ${titleText}`}>{tx.text}</p>
                          <p className={`text-[10px] ${subtleText} mt-0.5`}>{txDate}</p>
                        </div>
                        <span className={`font-bold shrink-0 ${tx.amount.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                          {tx.amount}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(!myRequests || myRequests.length === 0) ? (
                  <p className={`text-xs ${subtleText} text-center py-8`}>Koi request nahi hai.</p>
                ) : (
                  myRequests.map((req, idx) => {
                    const reqDate = formatDateTime(req.createdAt);
                    return (
                      <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center gap-2 text-xs ${subCardBg}`}>
                        <div>
                          <p className={`font-semibold ${titleText}`}>
                            {req.type === 'ADD' ? 'Deposit' : 'Withdraw'}: ₹{req.amount}
                          </p>
                          <p className={`text-[10px] ${subtleText} mt-0.5`}>
                            {req.type === 'ADD' ? `UTR: ${req.utr}` : `UPI: ${req.upiId}`}
                          </p>
                          {reqDate && <p className={`text-[9px] ${subtleText} mt-0.5`}>{reqDate}</p>}
                        </div>
                        <div>
                          {req.status === 'Pending' && (
                            <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-1 rounded font-bold text-[10px] animate-pulse">
                              ⏳ Pending
                            </span>
                          )}
                          {req.status === 'Approved' && (
                            <span className="bg-green-500/20 text-green-500 border border-green-500/50 px-2 py-1 rounded font-bold text-[10px]">
                              ✅ Approved
                            </span>
                          )}
                          {req.status === 'Rejected' && (
                            <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded font-bold text-[10px]">
                              ❌ Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "guide" && (
        <div className="max-w-4xl mx-auto">
          <div className={`border p-5 sm:p-6 rounded-2xl space-y-5 ${cardBg}`}>
            <div>
              <h2 className={`text-xl font-bold ${headingText}`}>📖 Naye Players Ke Liye Complete Guide</h2>
              <p className={`text-xs ${mutedText} mt-1`}>
                BR Esports Arena par match khelne, paisa add/withdraw karne, aur per-kill winnings paane ka poora process neeche diya gaya hai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>1. Asli Free Fire UID Daalein & Lock Karein</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  Apni <strong className={titleText}>asli Free Fire UID</strong> (8–12 digits) aur <strong className={titleText}>In-Game Name (IGN)</strong> daalein. UID lock hote hi <strong className={titleText}>₹50 Bonus Wallet</strong> mein aata hai.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>2. Bonus Wallet vs Withdrawable Wallet</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  <strong className={titleText}>Bonus Wallet</strong> (₹50 UID + ₹50 Referral = ₹100 tak) sirf <strong className={titleText}>match entry fees</strong> mein use hota hai. <strong className={titleText}>Withdrawable Wallet</strong> se aap minimum <strong className={titleText}>₹30</strong> UPI mein nikaal sakte hain.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>3. Match Join & Room ID / Password</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  <strong className={titleText}>🏆 Tournaments</strong> tab mein apna match chunein aur <strong className={titleText}>Join Now</strong> dabayein. Join hoti hi match card ke andar credentials section dikhega aur <strong className={titleText}>match se 10 minutes pehle aapko Room ID and Password milega</strong>.
                </p>
              </div>

              <div className={`border p-4 rounded-xl space-y-1.5 ${subCardBg}`}>
                <p className={`text-sm font-bold ${headingText}`}>4. Per-Kill Payout, Refund & Withdrawal</p>
                <p className={`text-xs ${mutedText} leading-relaxed`}>
                  Sabhi matches per-kill basis par chalenge (rate har match ke hisaab se alag-alag rahega). Kills ka payout aapke Withdrawable Wallet mein add hota hai aur <strong className={titleText}>🏅 Winners & Kills</strong> / <strong className={titleText}>📜 History</strong> mein dikhta hai.
                </p>
              </div>
            </div>

            <div className={`border p-4 rounded-xl text-xs space-y-1 ${subCardBg}`}>
              <p className={`font-bold ${titleText}`}>💡 Zaroori Baatein:</p>
              <p className={mutedText}>• Kisi bhi UTR ya withdrawal request ka status dekhne ke liye <strong className={titleText}>📜 History → My Requests</strong> check karein.</p>
              <p className={mutedText}>• Agar match cancel hota hai ya admin aapko match se remove karta hai, toh entry fee ka refund wallet mein aa jata hai.</p>
              <p className={mutedText}>• Kisi bhi madad ke liye neeche <strong className={titleText}>Live Support</strong> button par click karein.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "admin" && isAdmin && (
        <div className="max-w-6xl mx-auto space-y-5">
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl border ${cardBg}`}>
            <div className={`p-3.5 rounded-xl border ${subCardBg}`}>
              <span className={`text-[11px] block ${mutedText}`}>Aaya Hua Paisa (Approved Deposits)</span>
              <span className="text-xl font-extrabold text-emerald-500">₹{totalApprovedDepositsAmt}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${subCardBg}`}>
              <span className={`text-[11px] block ${mutedText}`}>Nikaala Gaya Paisa (Approved Withdrawals)</span>
              <span className="text-xl font-extrabold text-blue-500">₹{totalApprovedWithdrawalsAmt}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${subCardBg}`}>
              <span className={`text-[11px] block ${mutedText}`}>Banta Hua Prize (Total Prizes Sent)</span>
              <span className={`text-xl font-extrabold ${headingText}`}>₹{totalPrizesSentAmt}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${subCardBg}`}>
              <span className={`text-[11px] block ${mutedText}`}>Net Hisaab (Dep - With - Prize)</span>
              <span className={`text-xl font-extrabold ${netAdminBalance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                ₹{netAdminBalance}
              </span>
            </div>
          </div>

          <div className={`flex flex-wrap gap-2 p-2 rounded-xl border ${subCardBg}`}>
            <button
              type="button"
              onClick={() => setAdminSection("matches")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                adminSection === "matches" ? "bg-yellow-500 text-slate-950" : tabInactive
              }`}
            >
              🎮 Create & Room
            </button>
            <button
              type="button"
              onClick={() => setAdminSection("players")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                adminSection === "players" ? "bg-yellow-500 text-slate-950" : tabInactive
              }`}
            >
              👥 Players ({sortedTournaments.reduce((acc, m) => acc + (m.players?.length || 0), 0)})
            </button>
            <button
              type="button"
              onClick={() => setAdminSection("payouts")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                adminSection === "payouts" ? "bg-yellow-500 text-slate-950" : tabInactive
              }`}
            >
              🏆 Prize & Cancel
            </button>
            <button
              type="button"
              onClick={() => setAdminSection("requests")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                adminSection === "requests" ? "bg-yellow-500 text-slate-950" : tabInactive
              }`}
            >
              🔔 Requests ({walletRequests.length} Pending • {approvedDeposits.length + approvedWithdrawals.length} Approved)
            </button>
          </div>

          {adminSection === "matches" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`border p-6 rounded-xl space-y-5 ${cardBg}`}>
                <div>
                  <h2 className={`text-lg font-bold mb-4 ${headingText}`}>Create New Tournament</h2>
                  <form onSubmit={handleCreateMatch} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Match Title (e.g. Solo Bermuda)" 
                      value={matchTitle} 
                      onChange={(e) => setMatchTitle(e.target.value)}
                      className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      required 
                    />
                    <input 
                      type="text" 
                      placeholder="Match Timing (e.g. Today, 8:30 PM)" 
                      value={matchTime} 
                      onChange={(e) => setMatchTime(e.target.value)}
                      className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      required 
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        placeholder="Entry Fee (0 for Free)" 
                        value={entryFee} 
                        onChange={(e) => setEntryFee(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                        required 
                      />
                      <input 
                        type="number" 
                        min="2"
                        placeholder="Max Players (e.g. 10 or 48)" 
                        value={maxPlayers} 
                        onChange={(e) => setMaxPlayers(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Per Kill Rate (e.g. ₹10 / Kill)" 
                        value={prizePool} 
                        onChange={(e) => setPrizePool(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                        required 
                      />
                      <select
                        value={newMatchStatus}
                        onChange={(e) => setNewMatchStatus(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      >
                        <option value="Upcoming">Status: Upcoming</option>
                        <option value="Live">Status: Live</option>
                        <option value="Completed">Status: Completed</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-2.5 rounded cursor-pointer">
                      Publish Match
                    </button>
                  </form>
                </div>

                <div className={`pt-4 border-t ${borderDivider} space-y-2.5`}>
                  <h3 className={`text-sm font-bold ${headingText}`}>🔄 Match Status Control (Upcoming / Live / Completed)</h3>
                  {sortedTournaments.length === 0 ? (
                    <p className={`text-xs ${subtleText}`}>Koi match nahi hai.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {sortedTournaments.map((m) => (
                        <div key={m.id} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${subCardBg}`}>
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${titleText}`}>{m.title}</p>
                            <p className={`text-[10px] ${mutedText}`}>{m.timing} • {Number(m.entryFee) === 0 ? "FREE" : `₹${m.entryFee}`}</p>
                          </div>
                          <select
                            value={normalizeMatchStatus(m.status)}
                            onChange={(e) => handleChangeMatchStatus(m.id, e.target.value)}
                            className={`border px-2 py-1 rounded text-xs font-bold cursor-pointer shrink-0 ${inputBg}`}
                          >
                            <option value="Upcoming">⏳ Upcoming</option>
                            <option value="Live">🔴 Live</option>
                            <option value="Completed">✅ Completed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`border p-6 rounded-xl h-fit ${cardBg}`}>
                <h2 className={`text-lg font-bold mb-4 ${headingText}`}>Update Room ID & Password</h2>
                <form onSubmit={handleUpdateRoom} className="space-y-3">
                  <select 
                    value={selectedMatchId} 
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required
                  >
                    <option value="">-- Choose Match --</option>
                    {sortedTournaments.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.timing}) - Players: {m.players?.length || 0}/{m.maxPlayers || 48}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Room ID" 
                    value={roomIdInput} 
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="Room Password" 
                    value={roomPassInput} 
                    onChange={(e) => setRoomPassInput(e.target.value)}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required 
                  />
                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded cursor-pointer">
                    Publish Room Credentials
                  </button>
                </form>
              </div>
            </div>
          )}

          {adminSection === "players" && (
            <div className={`border p-6 rounded-xl ${cardBg}`}>
              <h2 className={`text-lg font-bold mb-3 ${headingText}`}>👥 Joined Players & Wallet Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedTournaments.length === 0 ? (
                  <p className={`text-xs ${subtleText}`}>Koi match nahi hai.</p>
                ) : (
                  sortedTournaments.map(m => (
                    <div key={m.id} className={`p-3 rounded-lg border space-y-2 h-fit ${subCardBg}`}>
                      <p className={`text-xs font-bold ${headingText}`}>
                        {m.title} ({m.players?.length || 0} / {m.maxPlayers || 48} Players • Fee: {Number(m.entryFee) > 0 ? `₹${m.entryFee}` : "FREE"})
                      </p>
                      {(!m.players || m.players.length === 0) ? (
                        <p className={`text-[10px] ${subtleText}`}>Abhi koi player join nahi hua.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.players.map((p, i) => {
                            const sum = getPlayerSummary(p.uid);
                            return (
                              <div key={i} className={`p-2 rounded border space-y-1 ${cardBg}`}>
                                <div className="flex justify-between items-center gap-2 text-[11px] font-mono">
                                  <span className={`truncate font-bold ${titleText}`}>{i+1}. {p.ffName}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-green-500">UID: {p.ffUid}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePlayerFromMatch(m.id, p)}
                                      className="bg-red-600/80 hover:bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-sans font-bold cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] ${mutedText}`}>
                                  <span>Deposited: <strong className="text-emerald-500">₹{sum.approvedDepositSum}</strong></span>
                                  <span>Left: <strong className={titleText}>₹{sum.mainBal}</strong> + <strong className={headingText}>₹{sum.bonusBal} Bonus</strong></span>
                                  <span>Matches Joined: <strong className={titleText}>{sum.joinedMatchesCount}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {m.kickedPlayers && m.kickedPlayers.length > 0 && (
                        <div className={`pt-2 border-t ${borderDivider} space-y-1`}>
                          <p className="text-[10px] font-bold text-red-500">🚫 Removed / Blocked From Rejoin:</p>
                          {m.kickedPlayers.map((k, kIdx) => (
                            <div key={kIdx} className={`flex justify-between items-center gap-2 text-[10px] font-mono px-2 py-1 rounded border ${isDarkMode ? "text-slate-400 bg-red-950/20 border-red-900/40" : "text-red-800 bg-red-50 border-red-200"}`}>
                              <span className="truncate">{k.ffName} (UID: {k.ffUid || "N/A"})</span>
                              <button
                                type="button"
                                onClick={() => handleAllowBackPlayer(m.id, k)}
                                className="bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-sans font-bold cursor-pointer shrink-0"
                              >
                                Allow Back
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminSection === "payouts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`border border-emerald-700/50 p-6 rounded-xl ${cardBg}`}>
                <h2 className="text-lg font-bold mb-2 text-emerald-500">🏆 Send Per-Kill Prize (Auto Calculator)</h2>
                <p className={`text-xs ${mutedText} mb-3`}>
                  Match select karein, player chunein, Kills Count aur us match ka Per Kill Rate daalein—total apne aap calculate ho jayega.
                </p>
                <form onSubmit={handleSendPrize} className="space-y-3">
                  <select 
                    value={prizeMatchId} 
                    onChange={(e) => {
                      setPrizeMatchId(e.target.value);
                      setPrizeWinnerUid("");
                    }}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required
                  >
                    <option value="">-- Choose Match --</option>
                    {sortedTournaments.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.timing}) - Players: {m.players?.length || 0}/{m.maxPlayers || 48}</option>
                    ))}
                  </select>

                  <select 
                    value={prizeWinnerUid} 
                    onChange={(e) => setPrizeWinnerUid(e.target.value)}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required
                  >
                    <option value="">-- Choose Player --</option>
                    {(tournaments.find(m => m.id === prizeMatchId)?.players || []).map((p, idx) => (
                      <option key={`${p.uid}-${idx}`} value={p.uid}>
                        {idx + 1}. {p.ffName} (UID: {p.ffUid})
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className={`block text-[11px] ${mutedText} mb-1`}>Kills Count</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="e.g. 5" 
                        value={killsCount} 
                        onChange={(e) => setKillsCount(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] ${mutedText} mb-1`}>Per Kill Rate (₹)</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="e.g. 5 / 10 / 15" 
                        value={perKillRate} 
                        onChange={(e) => setPerKillRate(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] ${mutedText} mb-1`}>Extra Bonus (₹, opt)</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        value={booyahAmount} 
                        onChange={(e) => setBooyahAmount(e.target.value)}
                        className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                      />
                    </div>
                  </div>

                  <div className={`border border-emerald-800/60 rounded-lg p-3 flex justify-between items-center text-xs ${subCardBg}`}>
                    <span className={mutedText}>
                      Kills Payout: <strong className={titleText}>₹{killsTotal}</strong> ({parsedKills} × ₹{parsedPerKill})
                    </span>
                    <span className="text-sm font-extrabold text-emerald-500">
                      Total Payout: ₹{calculatedTotalPrize}
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={sendingPrize || calculatedTotalPrize <= 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-2.5 rounded cursor-pointer"
                  >
                    {sendingPrize ? "Sending Prize..." : `Send ₹${calculatedTotalPrize} to Player Wallet`}
                  </button>
                </form>
              </div>

              <div className={`border border-red-900/50 p-6 rounded-xl h-fit ${cardBg}`}>
                <h2 className="text-lg font-bold mb-2 text-red-500">Cancel Match & Refund</h2>
                <form onSubmit={handleCancelAndRefundMatch} className="space-y-3">
                  <select 
                    value={cancelMatchId} 
                    onChange={(e) => setCancelMatchId(e.target.value)}
                    className={`w-full border p-2.5 rounded text-sm ${inputBg}`}
                    required
                  >
                    <option value="">-- Choose Match to Cancel --</option>
                    {sortedTournaments.map(m => (
                      <option key={m.id} value={m.id}>{m.title} (Players: {m.players?.length || 0}/{m.maxPlayers || 48})</option>
                    ))}
                  </select>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded cursor-pointer">
                    Cancel Match & Refund All
                  </button>
                </form>
              </div>
            </div>
          )}

          {adminSection === "requests" && (
            <div className="space-y-6">
              <div className={`border border-yellow-500/50 p-6 rounded-xl ${cardBg}`}>
                <h2 className={`text-lg font-bold mb-3 ${headingText}`}>🔔 Pending Payment Requests ({walletRequests.length})</h2>
                {walletRequests.length === 0 ? (
                  <p className={`text-xs ${subtleText} py-4`}>Koi pending request nahi hai.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {walletRequests.map(req => {
                      const reqDate = formatDateTime(req.createdAt);
                      const isBusy = processingReqId === req.id;
                      return (
                        <div key={req.id} className={`border p-3 rounded-lg text-xs space-y-2 ${subCardBg}`}>
                          <div className="flex justify-between gap-2">
                            <span className={`font-bold ${headingText} truncate`}>{req.userName} ({req.email})</span>
                            <span className={`font-bold shrink-0 ${req.type === 'ADD' ? 'text-green-500' : 'text-blue-500'}`}>
                              {req.type === 'ADD' ? 'ADD MONEY' : 'WITHDRAW'} : ₹{req.amount}
                            </span>
                          </div>
                          {req.type === 'ADD' ? (
                            <p className={`${mutedText} font-mono`}>UTR: {req.utr}</p>
                          ) : (
                            <p className={`${mutedText} font-mono`}>UPI: {req.upiId}</p>
                          )}
                          {reqDate && <p className={`text-[10px] ${subtleText}`}>{reqDate}</p>}
                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={isBusy}
                              onClick={() => handleProcessRequest(req, "APPROVE")}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-1.5 rounded cursor-pointer"
                            >
                              {isBusy ? "Processing..." : "Approve"}
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleProcessRequest(req, "REJECT")}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-bold py-1.5 rounded cursor-pointer"
                            >
                              {isBusy ? "Processing..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`border border-emerald-500/40 p-6 rounded-xl ${cardBg}`}>
                  <h2 className="text-lg font-bold mb-3 text-emerald-500">✅ Approved Deposits Log ({approvedDeposits.length})</h2>
                  {approvedDeposits.length === 0 ? (
                    <p className={`text-xs ${subtleText} py-4`}>Abhi koi approved deposit nahi hai.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {approvedDeposits.map(dep => {
                        const depDate = formatDateTime(dep.createdAt);
                        return (
                          <div key={dep.id} className={`border p-3 rounded-lg text-xs space-y-1 ${subCardBg}`}>
                            <div className="flex justify-between gap-2">
                              <span className={`font-bold truncate ${titleText}`}>{dep.userName} ({dep.email})</span>
                              <span className="font-extrabold text-emerald-500 shrink-0">+₹{dep.amount}</span>
                            </div>
                            <p className={`${mutedText} font-mono`}>UTR: {dep.utr}</p>
                            {depDate && <p className={`text-[10px] ${subtleText}`}>{depDate}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={`border border-blue-500/40 p-6 rounded-xl ${cardBg}`}>
                  <h2 className="text-lg font-bold mb-3 text-blue-500">💸 Approved Withdrawals Log ({approvedWithdrawals.length})</h2>
                  {approvedWithdrawals.length === 0 ? (
                    <p className={`text-xs ${subtleText} py-4`}>Abhi koi approved withdrawal nahi hai.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {approvedWithdrawals.map(wd => {
                        const wdDate = formatDateTime(wd.createdAt);
                        return (
                          <div key={wd.id} className={`border p-3 rounded-lg text-xs space-y-1 ${subCardBg}`}>
                            <div className="flex justify-between gap-2">
                              <span className={`font-bold truncate ${titleText}`}>{wd.userName} ({wd.email})</span>
                              <span className="font-extrabold text-blue-500 shrink-0">-₹{wd.amount}</span>
                            </div>
                            <p className={`${mutedText} font-mono`}>UPI: {wd.upiId}</p>
                            {wdDate && <p className={`text-[10px] ${subtleText}`}>{wdDate}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <a
        href="https://tawk.to/chat/6af97899375b123c45407054/1k7f7u6u3?layout=modern"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50 transition transform hover:scale-105"
      >
        <span>💬</span>
        <span className="text-sm">Live Support</span>
      </a>

      <footer className={`mt-12 py-6 border-t ${borderDivider} text-center text-xs ${mutedText} px-4 space-y-2`}>
        <div className="flex justify-center items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setLegalModal("terms")}
            className={`${headingText} hover:underline font-semibold cursor-pointer`}
          >
            Terms & Conditions
          </button>
          <span className={subtleText}>•</span>
          <button
            type="button"
            onClick={() => setLegalModal("privacy")}
            className={`${headingText} hover:underline font-semibold cursor-pointer`}
          >
            Privacy Policy
          </button>
        </div>
        <p>© 2026 BR Esports Arena. All rights reserved.</p>
        <p className={`max-w-xl mx-auto ${subtleText} leading-relaxed`}>
          <strong>Disclaimer:</strong> BR Esports Arena is an Esports Skill-Based Tournament Platform. 
          This is not a gambling, betting, or lottery app. All matches are purely based on player skills in Free Fire.
        </p>
      </footer>
    </main>
  );
}
