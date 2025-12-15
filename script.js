// script.js (修正後の全文)

// -------------------------------------------------------------
// ▼ Firebase モジュールのインポートと初期化
// -------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { 
    getFirestore, collection, onSnapshot, query, orderBy, 
    addDoc, doc, getDoc, updateDoc, arrayUnion, 
    serverTimestamp // 修正: serverTimestamp を直接インポート
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
      
// あなたのウェブアプリの Firebase 設定
const firebaseConfig = {
    apiKey: "AIzaSyCHDydkHiUYCRm7r27Eyvt5UB8436izWH8",
    authDomain: "teammatchingapp-fdffe.firebaseapp.com",
    projectId: "teammatchingapp-fdffe",
    storageBucket: "teammatchingapp-fdffe.firebasestorage.app",
    messagingSenderId: "977902354996",
    appId: "1:977902354996:web:2d97f0faead5e83399ec061",
    measurementId: "G-1TC0SV3R5Q"
};

// Firebaseを初期化し、サービスインスタンスを定義
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// -------------------------------------------------------------
// ▼ 変数定義とナビゲーション
// -------------------------------------------------------------

// ハンバーガーメニュー
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
hamburgerBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

function hideAllScreens() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('matching-screen').classList.add('hidden');
    document.getElementById('create-project-modal').classList.add('hidden');
}

function showAuthScreen() {
    hideAllScreens();
    document.getElementById('auth-screen').classList.remove('hidden');
}

function showMatchingScreen() {
    hideAllScreens();
    document.getElementById('matching-screen').classList.remove('hidden');
    fetchProjects(); // プロジェクト一覧を読み込み
}

// -------------------------------------------------------------
// ▼ Firebase 認証機能
// -------------------------------------------------------------

// 新規ユーザー登録
function registerUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    // ここで auth が正しく定義されていれば、エラーは解消します
    createUserWithEmailAndPassword(auth, email, password) 
        .then(() => {
            alert("登録が完了しました！");
        })
        .catch((error) => {
            alert("登録エラー: " + error.message);
            console.error(error);
        });
}

// ログイン
function loginUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    signInWithEmailAndPassword(auth, email, password) 
        .then(() => {
            // ログイン成功 
        })
        .catch((error) => {
            alert("ログインエラー: " + error.message);
            console.error(error);
        });
}

// ログアウト
function logoutUser() {
    signOut(auth) 
        .then(() => {
            alert("ログアウトしました");
            showAuthScreen(); 
        })
        .catch((error) => {
            alert("ログアウトエラー: " + error.message);
        });
}

// 認証状態の変更を監視
onAuthStateChanged(auth, (user) => { 
    const authForm = document.getElementById('auth-form');
    const userInfo = document.getElementById('user-info');
    const displayEmail = document.getElementById('display-user-email');
    
    if (user) {
        // ログイン状態
        authForm.classList.add('hidden');
        userInfo.classList.remove('hidden');
        displayEmail.textContent = user.email;
        showAuthScreen();
    } else {
        // ログアウト状態
        authForm.classList.remove('hidden');
        userInfo.classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('matching-screen').classList.add('hidden');
    }
});


// -------------------------------------------------------------
// ▼ プロジェクト機能 (一覧表示、作成、参加) 
// -------------------------------------------------------------

// プロジェクト一覧を取得し、画面に表示する
function fetchProjects() {
    const projectsListElement = document.getElementById('projects-list');
    projectsListElement.innerHTML = '<p>プロジェクトを読み込み中...</p>';
    
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc")); 
    
    // リアルタイムリスナー
    onSnapshot(q, (snapshot) => { 
        projectsListElement.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h2>${project.className} - ${project.projectName}</h2>
                <p><strong>得意なこと:</strong> ${project.requiredSkills ? project.requiredSkills.join(', ') : 'なし'}</p>
                <p><strong>募集人数:</strong> ${project.currentMembers}/${project.capacity}人</p>
                <p><strong>募集者:</strong> ${project.ownerEmail || '不明'}</p>
                <button class="join-btn" onclick="joinProject('${projectId}')" ${project.currentMembers >= project.capacity ? 'disabled' : ''}>
                    ${project.currentMembers >= project.capacity ? '募集終了' : '参加する'}
                </button>
            `;
            projectsListElement.appendChild(card);
        });
        
        if (snapshot.empty) {
            projectsListElement.innerHTML = '<p>現在、募集中のプロジェクトはありません。</p>';
        }
    }, (error) => {
        console.error("Error fetching documents: ", error);
        projectsListElement.innerHTML = '<p style="color:red;">プロジェクトの読み込みに失敗しました。</p>';
    });
}

// プロジェクト作成モーダルの制御
function openCreateProjectModal() {
    if (!auth.currentUser) {
        alert("プロジェクト作成にはログインが必要です。");
        return;
    }
    document.getElementById('create-project-modal').classList.remove('hidden');
}

function closeCreateProjectModal() {
    document.getElementById('create-project-modal').classList.add('hidden');
}

// 新規プロジェクトのFirestoreへの保存
function createNewProject() {
    const user = auth.currentUser;
    if (!user) {
        alert("ログインしていません。");
        return;
    }

    const projectName = document.getElementById('project-name').value;
    const className = document.getElementById('class-name').value;
    const capacity = parseInt(document.getElementById('capacity').value, 10);
    const skillsInput = document.getElementById('required-skills').value;
    const requiredSkills = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (!projectName || !className || !capacity || requiredSkills.length === 0) {
        alert("全ての項目を入力してください。");
        return;
    }

    // Firestoreに新しいドキュメント（プロジェクト）を追加
    addDoc(collection(db, "projects"), { 
        projectName: projectName,
        className: className,
        requiredSkills: requiredSkills,
        capacity: capacity,        
        currentMembers: 1,        
        ownerId: user.uid,         
        ownerEmail: user.email,    
        members: [user.uid],       
        status: 'open',             
        createdAt: serverTimestamp() // 修正: serverTimestamp()を直接呼び出し
    })
    .then(() => {
        alert("プロジェクト「" + projectName + "」の募集を開始しました！");
        closeCreateProjectModal();
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
        alert("プロジェクトの作成に失敗しました: " + error.message);
    });
}


// プロジェクトへの参加処理
async function joinProject(projectId) {
    const user = auth.currentUser;
    if (!user) {
        alert("参加するにはログインが必要です。");
        return;
    }
    
    const projectRef = doc(db, "projects", projectId); 
    
    try {
        const projectSnap = await getDoc(projectRef); 

        if (!projectSnap.exists()) {
            alert("エラー: 該当のプロジェクトが見つかりませんでした。");
            return;
        }

        const projectData = projectSnap.data();
        const currentMembers = projectData.members || [];
        
        // 1. 重複参加のチェック
        if (currentMembers.includes(user.uid)) {
            alert("あなたはすでにこのプロジェクトに参加しています。");
            return;
        }

        // 2. 定員オーバーのチェック
        if (currentMembers.length >= projectData.capacity) {
             alert("このプロジェクトはすでに定員に達しています。");
             return;
        }

        // 3. Firestoreのデータを更新
        await updateDoc(projectRef, { 
            members: arrayUnion(user.uid), 
            currentMembers: currentMembers.length + 1
        });

        alert(`プロジェクト「${projectData.projectName}」に参加しました！`);
        
    } catch (error) {
        console.error("プロジェクト参加処理中にエラーが発生しました: ", error);
        alert("プロジェクト参加中にエラーが発生しました。");
    }
}