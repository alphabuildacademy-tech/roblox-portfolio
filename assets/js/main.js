function initCursor() {
    if (window.innerWidth <= 800) return;
    const oldDot = document.querySelector('.cursor-dot');
    const oldRing = document.querySelector('.cursor-ring');
    if (oldDot) oldDot.remove();
    if (oldRing) oldRing.remove();
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    dot.style.position = 'fixed';
    dot.style.width = '6px';
    dot.style.height = '6px';
    dot.style.backgroundColor = '#0f0';
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '10000';
    dot.style.left = '0px';
    dot.style.top = '0px';
    dot.style.transition = 'none';
    ring.style.position = 'fixed';
    ring.style.width = '30px';
    ring.style.height = '30px';
    ring.style.border = '1px solid #0f0';
    ring.style.borderRadius = '50%';
    ring.style.pointerEvents = 'none';
    ring.style.zIndex = '9999';
    ring.style.left = '0px';
    ring.style.top = '0px';
    ring.style.transition = 'transform 0.1s ease-out';
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        dot.style.left = (mouseX - 3) + 'px';
        dot.style.top = (mouseY - 3) + 'px';
        ring.style.transform = `translate(${mouseX - 15}px, ${mouseY - 15}px)`;
    });
}

function initMobileMenu() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    if (burger && nav) {
        burger.addEventListener('click', () => nav.classList.toggle('active'));
    }
}

function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    if (!btns.length) return;
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            btns.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

let firebaseApp = null;
let db = null;

async function getFirebase() {
    if (firebaseApp) return { db, likesRef: ref(db, 'likes') };
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getDatabase, ref, get, update, onValue } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");
    const firebaseConfig = {
        apiKey: "AIzaSyDbVO0SGXKhtKQV6uPkLI_S1Nv3ythRf5U",
        authDomain: "roblox-portfolio-feedback.firebaseapp.com",
        databaseURL: "https://roblox-portfolio-feedback-default-rtdb.firebaseio.com",
        projectId: "roblox-portfolio-feedback",
        storageBucket: "roblox-portfolio-feedback.firebasestorage.app",
        messagingSenderId: "669432428989",
        appId: "1:669432428989:web:422f97ba1db06c4ed7bad4"
    };
    firebaseApp = initializeApp(firebaseConfig);
    db = getDatabase(firebaseApp);
    return { db, likesRef: ref(db, 'likes') };
}

async function updateLikeDislike(projectId, type) {
    const { likesRef } = await getFirebase();
    const projectLikesRef = ref(db, `likes/${projectId}`);
    const snapshot = await get(projectLikesRef);
    let data = snapshot.val() || { likes: 0, dislikes: 0 };
    if (type === 'like') {
        data.likes = (data.likes || 0) + 1;
    } else if (type === 'dislike') {
        data.dislikes = (data.dislikes || 0) + 1;
    }
    await update(projectLikesRef, data);
}

function createLikeDislikeElement(projectId, initialLikes, initialDislikes) {
    const container = document.createElement('div');
    container.className = 'like-dislike';
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.innerHTML = '👍 <span class="like-count">' + (initialLikes || 0) + '</span>';
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'dislike-btn';
    dislikeBtn.innerHTML = '👎 <span class="dislike-count">' + (initialDislikes || 0) + '</span>';
    const percentageSpan = document.createElement('span');
    percentageSpan.className = 'percentage';
    const total = (initialLikes || 0) + (initialDislikes || 0);
    const percent = total === 0 ? 0 : Math.round((initialLikes / total) * 100);
    percentageSpan.innerText = `${percent}% liked`;
    container.appendChild(likeBtn);
    container.appendChild(dislikeBtn);
    container.appendChild(percentageSpan);

    const voted = localStorage.getItem(`voted_${projectId}`);
    if (voted) {
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        likeBtn.style.opacity = '0.5';
        dislikeBtn.style.opacity = '0.5';
    }

    (async () => {
        const { likesRef } = await getFirebase();
        const projectLikesRef = ref(db, `likes/${projectId}`);
        onValue(projectLikesRef, (snapshot) => {
            const data = snapshot.val() || { likes: 0, dislikes: 0 };
            const likes = data.likes || 0;
            const dislikes = data.dislikes || 0;
            likeBtn.querySelector('.like-count').innerText = likes;
            dislikeBtn.querySelector('.dislike-count').innerText = dislikes;
            const total = likes + dislikes;
            const percent = total === 0 ? 0 : Math.round((likes / total) * 100);
            percentageSpan.innerText = `${percent}% liked`;
        });
    })();

    likeBtn.onclick = async (e) => {
        e.preventDefault();
        if (localStorage.getItem(`voted_${projectId}`)) return;
        await updateLikeDislike(projectId, 'like');
        localStorage.setItem(`voted_${projectId}`, 'like');
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        likeBtn.style.opacity = '0.5';
        dislikeBtn.style.opacity = '0.5';
    };
    dislikeBtn.onclick = async (e) => {
        e.preventDefault();
        if (localStorage.getItem(`voted_${projectId}`)) return;
        await updateLikeDislike(projectId, 'dislike');
        localStorage.setItem(`voted_${projectId}`, 'dislike');
        likeBtn.disabled = true;
        dislikeBtn.disabled = true;
        likeBtn.style.opacity = '0.5';
        dislikeBtn.style.opacity = '0.5';
    };
    return container;
}

function loadScriptingProjects() {
    const container = document.getElementById('scripting-projects');
    if (!container) return;
    const projects = [
        { title: "🍾 Potion Stock System", description: "Full working Potion Restock System", youtubeId: "Ur5TOVPAKkI", tech: "Luau, RemoteEvents" },
        { title: "🎲 Rolling System, UI Logic, and Backpack System", description: "Full working Rolling System, UI Logic, and Backpack System", youtubeId: "lXMY0QvrGqU", tech: "Luau, RemoteEvents, Packets, Network" },
        { title: "👨‍💻 Starter Screen", description: "Full working Starter Screen with loading progress", youtubeId: "uwa9kNZMPoY", tech: "Luau, RemoteEvents, UI, TweenService" },
        { title: "🏃‍♂️ Parkour System", description: "Full working Parkour System with wall running, sliding, and vaulting", youtubeId: "aPF7mHo-l90", tech: "Luau, RemoteEvents, RayCast, CameraMovement" },
        { title: "🗣️ Dialog System Advanced", description: "Full working Dialog System with branching conversations, NPC Movement, etc.", youtubeId: "fDtabQ5dY94", tech: "Luau, RemoteEvents, Packets, Network, UI" },
        { title: "🤛 Combat Sword System", description: "Full working Combat Sword System with blocking, parrying, and combos", youtubeId: "zfkWgu40vWE", tech: "Luau, RemoteEvents, Packets, Network, Animation" }
    ];
    container.innerHTML = '';
    projects.forEach(p => {
        const projectId = `scripting_${p.title.replace(/[^a-z0-9]/gi, '_')}`;
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="video-wrapper">
                <iframe src="https://www.youtube-nocookie.com/embed/${escapeHtml(p.youtubeId)}?rel=0" allowfullscreen></iframe>
            </div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <small>${escapeHtml(p.tech)}</small>
        `;
        const likeDiv = createLikeDislikeElement(projectId, 0, 0);
        card.appendChild(likeDiv);
        container.appendChild(card);
    });
}

function loadUIProjects() {
    const container = document.getElementById('ui-projects');
    if (!container) return;
    const projects = [
        { title: "👨‍💻 Main Menu Screen Gui", description: "Custom Main Menu Screen with animated buttons and dynamic backgrounds.", imageUrl: "https://cdn.discordapp.com/attachments/1421565483567677441/1480016392538427584/image.png?ex=6a26c56d&is=6a2573ed&hm=ac3b81ede48dc427d309912c2a9a2db8f9b60fd6004f1103c1604d33cef2024c&", tech: "Figma, Luau, TweenService" },
        { title: "📆 Daily Rewards Gui", description: "Interactive Daily Rewards system with streak tracking and animated claim buttons.", imageUrl: "https://cdn.discordapp.com/attachments/1421565483567677441/1460073297789321437/image.png?ex=6a26ba79&is=6a2568f9&hm=0a475ced24ec6f247dfa2d0ad77ad0385aa5aeb0ed58a74d500dfd0d2926695e&", tech: "UIListLayout, UIGridLayout, Figma" },
        { title: "📝 Rules Gui", description: "Clean and organized Rules Gui with sections for different rule categories and a search function.", imageUrl: "https://cdn.discordapp.com/attachments/1421565483567677441/1505606009765498890/image.png?ex=6a26ebdd&is=6a259a5d&hm=0e9500eb794c89cb4f932455723f0d9e48851ca29909d709e7d07190a48a6f5b&", tech: "UIListLayout, UIGridLayout, Figma" },
        { title: "👨‍💻 Loading Gui", description: "Dynamic Loading Screen with progress bar, tips, and animated elements.", imageUrl: "https://cdn.discordapp.com/attachments/1421565483567677441/1483900783090073691/image.png?ex=6a26668c&is=6a25150c&hm=d08cfb066e1c03fb265873753ea5f691086118b4aaeb30718998c17f3559ed08&", tech: "UIListLayout, UIGridLayout, Figma" }
    ];
    container.innerHTML = '';
    projects.forEach(p => {
        const projectId = `ui_${p.title.replace(/[^a-z0-9]/gi, '_')}`;
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="video-wrapper">
                <a href="${escapeHtml(p.imageUrl)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" style="width:100%; height:100%; object-fit:cover;">
                </a>
            </div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <small>${escapeHtml(p.tech)}</small>
        `;
        const likeDiv = createLikeDislikeElement(projectId, 0, 0);
        card.appendChild(likeDiv);
        container.appendChild(card);
    });
}

function loadModelingProjects() {
    const container = document.getElementById('modeling-projects');
    if (!container) return;
    const projects = [
        { title: "⚔️ Orc's BroadSword Heavy Sword Model", description: "High-poly sword model with detailed features", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1467656853440696472/image.png?ex=6a26a1b5&is=6a255035&hm=6e28c41eaa9fc849f30c9590c4a167a460e541b52992654f90e85136d08a859f&", tech: "Blender, MeshPart, Texture Mapping" },
        { title: "🗡️ Yagui Katana ish sword Model", description: "Detailed sword model with PBR materials.", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1511518269843181710/image-34.webp?ex=6a26ad56&is=6a255bd6&hm=232e738cee69825d2d2faf527bc93bd8bb8f0f827d548942d3a9f6e9e73ac40f&", tech: "Blender, Meshpart" },
        { title: "🤺 Simple Stylized Sword", description: "Stylized sword model with clean geometry and vibrant colors.", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1458893567266128156/image.png?ex=6a270d03&is=6a25bb83&hm=cfb97cff03db2b48d3a0734f732948a0adf9bcf5700d2f59eb37a1b0567b606e&", tech: "Blender, Meshpart" },
        { title: "⛏️ Simple Stylized Pickaxe", description: "Stylized pickaxe model with clean geometry and vibrant colors.", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1447344623340224552/image.png?ex=6a269078&is=6a253ef8&hm=555ceccfe18d54c22923f2931120e887fb04ffbc90918c41a50b6c1f27ef80bd&", tech: "Blender, Meshpart" },
        { title: "🧙‍♂️ Cauldron Model", description: "Low Poly Stylized cauldron model", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1429091952812494950/image.png?ex=6a26bd18&is=6a256b98&hm=883a24bc399b15cf4936486213a61957dc9c2296bb353f7888ff7c8b744bccf9&", tech: "Blender, Meshpart" },
        { title: "🎃 Jack-o'-Lantern Model", description: "Low Poly Stylized Jack-o'-Lantern model", imageUrl: "https://cdn.discordapp.com/attachments/1421566082401173565/1426263687337086976/image.png?ex=6a26ff11&is=6a25ad91&hm=0bc84cb545e60b3192812ecd7e2dc19203c66797ace39ffdc2a2f664ee64b844&", tech: "Blender, Meshpart" }
    ];
    container.innerHTML = '';
    projects.forEach(p => {
        const projectId = `modeling_${p.title.replace(/[^a-z0-9]/gi, '_')}`;
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="video-wrapper">
                <a href="${escapeHtml(p.imageUrl)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" style="width:100%; height:100%; object-fit:cover;">
                </a>
            </div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <small>${escapeHtml(p.tech)}</small>
        `;
        const likeDiv = createLikeDislikeElement(projectId, 0, 0);
        card.appendChild(likeDiv);
        container.appendChild(card);
    });
}

let statsInitialized = false;

async function initStats() {
    if (statsInitialized) return;
    statsInitialized = true;
    
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getDatabase, ref, get, update, increment, onValue } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js");
        
        const firebaseConfig = {
            apiKey: "AIzaSyDbVO0SGXKhtKQV6uPkLI_S1Nv3ythRf5U",
            authDomain: "roblox-portfolio-feedback.firebaseapp.com",
            databaseURL: "https://roblox-portfolio-feedback-default-rtdb.firebaseio.com",
            projectId: "roblox-portfolio-feedback",
            storageBucket: "roblox-portfolio-feedback.firebasestorage.app",
            messagingSenderId: "669432428989",
            appId: "1:669432428989:web:422f97ba1db06c4ed7bad4"
        };
        
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const countersRef = ref(db, 'counters');
        
        const snapshot = await get(countersRef);
        if (!snapshot.exists()) {
            try {
                await update(countersRef, { pageViews: 0, feedbackCount: 0, contactCount: 0 });
            } catch (err) {
                console.warn("Could not initialize counters", err);
            }
        }
        
        const hasVisited = sessionStorage.getItem('hasVisited');
        if (!hasVisited) {
            try {
                await update(countersRef, { pageViews: increment(1) });
                sessionStorage.setItem('hasVisited', 'true');
            } catch (err) {
                console.warn("Could not increment page view", err);
            }
        }
        
        if (window.location.pathname.includes('stats.html')) {
            onValue(countersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const pageViewsElem = document.getElementById('pageViews');
                    const feedbackCountElem = document.getElementById('feedbackCount');
                    const contactCountElem = document.getElementById('contactCount');
                    if (pageViewsElem) pageViewsElem.innerText = data.pageViews || 0;
                    if (feedbackCountElem) feedbackCountElem.innerText = data.feedbackCount || 0;
                    if (contactCountElem) contactCountElem.innerText = data.contactCount || 0;
                }
            }, (error) => {
                console.warn("Error listening to counters", error);
            });
        }
    } catch (err) {
        console.error("Stats initialization failed", err);
    }
}

(function initMusicPlayer() {
    const savedMuted = sessionStorage.getItem('musicMuted') === 'true';
    const savedTime = parseFloat(sessionStorage.getItem('musicTime')) || 0;
    const wasPlaying = sessionStorage.getItem('musicPlaying') === 'true';
    const audio = new Audio();
    audio.src = "assets/music/background.mp3";
    audio.loop = true;
    audio.volume = savedMuted ? 0 : 0.5;
    audio.currentTime = savedTime;
    let btn = document.querySelector('.music-player');
    if (!btn) {
        btn = document.createElement('div');
        btn.className = 'music-player';
        document.body.appendChild(btn);
    }
    const updateButton = () => {
        if (savedMuted) {
            btn.innerHTML = '🔇';
            btn.title = 'Unmute music';
        } else {
            btn.innerHTML = '🔊';
            btn.title = 'Mute music';
        }
    };
    updateButton();
    if (wasPlaying) {
        audio.play().catch(e => console.log("Playback error:", e));
    } else {
        setTimeout(() => {
            audio.play().then(() => {
                sessionStorage.setItem('musicPlaying', 'true');
            }).catch(e => console.log("Autoplay blocked:", e));
        }, 500);
    }
    setInterval(() => {
        if (!audio.paused) {
            sessionStorage.setItem('musicTime', audio.currentTime);
            sessionStorage.setItem('musicPlaying', 'true');
        }
    }, 1000);
    window.addEventListener('beforeunload', () => {
        if (!audio.paused) {
            sessionStorage.setItem('musicTime', audio.currentTime);
            sessionStorage.setItem('musicPlaying', 'true');
        }
        sessionStorage.setItem('musicMuted', savedMuted);
    });
    let currentMuted = savedMuted;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentMuted = !currentMuted;
        audio.volume = currentMuted ? 0 : 0.5;
        sessionStorage.setItem('musicMuted', currentMuted);
        if (currentMuted) {
            btn.innerHTML = '🔇';
            btn.title = 'Unmute music';
        } else {
            btn.innerHTML = '🔊';
            btn.title = 'Mute music';
        }
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initMobileMenu();
    initTabs();
    loadScriptingProjects();
    loadUIProjects();
    loadModelingProjects();
    initStats();
});