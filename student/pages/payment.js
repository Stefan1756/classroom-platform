import { db } from "../../core/firebase.js";

import { getUser, getUserData } from "../../core/auth.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { navigate } from "../../core/router.js";

export function loadPaymentPage() {
    const container = document.getElementById("contentArea");

    const planId = localStorage.getItem("selectedPlan");

    const planDetails = {
        "plan_2weeks": {
            name: "2 Weeks Plan",
            price: "TSH 5000",
            duration: "14 Days"
        },
        "plan_1month": {
            name: "1 Month Plan",
            price: "TSH 10,000",
            duration: "30 Days"
        }
    };

    const plan = planDetails[planId];

    container.innerHTML = `
        <div class="payment-page">
             
            <div class="payment-card">
            
                <h2>${plan?.name || "Subscription"}</h2>
                <p class="price">${plan?.price}</p>
                <small>Access for ${plan?.duration}</small>
                
                <div class="divider"></div>
                
                <h4>Payment Instructions</h4>
                
                <div class="instructions">
                    <p>1. Send payment to:</p>
                    <strong>+255 757584984</strong>
                    
                    <p>2. Receiver's Account: Stephen Anthony</p>
                
                    <p>3. Sender's Account name i.e John Doe, in the box below.</p>

                    <p>4. After payment, click I Have Paid below</p>
                </div>
                
                <input type="text" id="paymentCode" placeholder="John Doe" />

                <button id="verifyPaymentBtn" class="btn primaryy">
                    I Have Paid
                </button>
            
            </div>
        
        </div>
    `;

    initPaymentActions(planId);
}

function initPaymentActions(planId) {
    document.getElementById("verifyPaymentBtn").onclick = async () => {
        const user = getUser();
        const code = document.getElementById("paymentCode").value.trim();

        if (!code) return alert("Enter code");

        const planMap = {
            "plan_2weeks": { name: "2 Weeks", days: 14 },
            "plan_1month": { name: "1 Month", days: 30 },
        };

        const plan = planMap[planId];

        await addDoc(collection(db, "subscriptions"), {
            userId: user.uid,
            planId,
            planName: plan.name,
            duration: plan.days,
            paymentCode: code,
            status: "pending",
            createdAt: new Date(),
            startDate: null,
            endDate: null
        });

        alert("Payment submitted. Awaiting verification.");

        document.getElementById("paymentCode").value = "";

        navigate("dashboard");
    };
}