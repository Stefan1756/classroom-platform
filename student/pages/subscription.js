import { db } from "../../core/firebase.js";
import { getUser, getUserData } from "../../core/auth.js";
import { getFunctions, httpsCallable} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js"

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
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { navigate } from "../../core/router.js";

export function loadSubscription() {
    const container = document.getElementById("contentArea");

    container.innerHTML = `
        <div class="subscription-page">
        
            <div class="sub-header">
                <h2>Upgrade Your Learning</h2>
                <p>Unlock full access and boost your productivity</p>
            </div>
            
            <div class="plans-grid">
            
                <div class="plan-card free">
                    <h3>Free Trial</h3>
                    <p class="price">0 Tsh</p>
                    <span class="duration">7 days | Free Access</span>
                    
                    <ul>
                        <li>Access limited classes</li>
                        <li>Basic materials</li>
                        <li>Limited tasks</li>
                    </ul>
                    
                </div>
                
                <div class="plan-card popular">
                    <div class="badgey">Popular</div>
                    <h3>2 Weeks</h3>
                    <p class="price">5,000 Tsh</p>
                    <span class="duration">Limited Access</span><br>
                    <span class="duration">More than 500+ students use this plan.</span>
                    
                    <ul>
                        <li>Access up to two classes</li>
                        <li>download five materials per day</li>
                        <li>Assignments & tracking</li>
                    </ul>
                    
                    <button class="plan-btn primary" data-plan="plan_2weeks">
                        Subscribe
                    </button>
                </div>
                
                <div class="plan-card premium">
                    <h3>1 Month</h3>
                    <p class="price">10,000 Tsh</p>
                    <span class="duration">Best Value</span><br>
                    <span class="duration">More than 50+ students upgrade to this plan</span>
                    
                    <ul>
                        <li>Everything unlocked</li>
                        <li>Priority access</li>
                        <li>Future premium features</li>
                    </ul>
                    
                    <button class="plan-btn primary" data-plan="plan_1month">
                        Go Premium
                    </button>
                </div>
                
            </div>
            
            <div class="sub-footer">
                <p>Secure payments powered by M-Pesa Tanzania.</p>
            </div>
        
        </div>
    `;

    initSubscriptionActions();
}

function initSubscriptionActions() {
    document.querySelectorAll(".plan-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const planId = btn.dataset.plan;

            localStorage.setItem("selectedPlan", planId);

            navigate("payment");
        });
    });
}
