// =========================================================
// Conexão com o Firebase (login + banco de dados)
// Estes dados não são senha: a proteção está nas regras do
// Firestore, que só entregam cada ferramenta a quem tem acesso.
// =========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, deleteField, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { injetarIcones } from "./icones.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpUCiVtsKaofH21UoUWkfwRmAzgdYkO90",
  authDomain: "econtabil-ia.firebaseapp.com",
  projectId: "econtabil-ia",
  storageBucket: "econtabil-ia.firebasestorage.app",
  messagingSenderId: "648890476139",
  appId: "1:648890476139:web:976e32a021df3893d5732e"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "pt-BR";
export const db   = getFirestore(app);

export {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, deleteField,
  serverTimestamp, writeBatch, injetarIcones
};

// ---------- utilidades de tela ----------
export const $   = id => document.getElementById(id);
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const icone = n => `<svg aria-hidden="true"><use href="#i-${esc(n || "receipt")}"/></svg>`;

// ---------- sessão ----------
// Espera o Firebase dizer se há alguém logado (resolve uma vez só).
export function usuarioAtual(){
  return new Promise(res => { const off = onAuthStateChanged(auth, u => { off(); res(u); }); });
}

export async function carregarPerfil(uid){
  const s = await getDoc(doc(db, "usuarios", uid));
  return s.exists() ? s.data() : null;
}

// Usada nas páginas restritas: sem login volta para a tela de entrada.
export async function exigirLogin({ admin = false } = {}){
  const u = await usuarioAtual();
  if (!u){
    const volta = location.pathname.split("/").pop() + location.search;
    location.replace("index.html?volta=" + encodeURIComponent(volta));
    return new Promise(() => {});
  }
  let p = null;
  try { p = await carregarPerfil(u.uid); } catch(e){ p = null; }
  if (!p) throw new Error("sem-perfil");
  if (admin && p.admin !== true) throw new Error("sem-admin");
  return { u, p: { grupos: [], ...p } };
}

export async function sair(){
  try { await signOut(auth); } catch(e){}
  location.replace("index.html");
}

// Mensagens de erro em português
export function msgErro(e){
  const c = (e && (e.code || e.message)) || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "E-mail ou senha incorretos.";
  if (/invalid-email/.test(c))          return "Esse e-mail não parece válido.";
  if (/too-many-requests/.test(c))      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
  if (/network-request-failed|unavailable/.test(c)) return "Sem conexão com o servidor. Verifique a internet.";
  if (/user-disabled/.test(c))          return "Este acesso foi desativado.";
  if (/permission-denied/.test(c))      return "Você não tem permissão para isso.";
  if (/sem-perfil/.test(c))             return "Este login ainda não foi liberado. Fale com o escritório.";
  if (/sem-admin/.test(c))              return "Esta área é só para o administrador.";
  return "Algo deu errado (" + c + ").";
}

// ---------- tema claro/escuro (mesma chave do site) ----------
const KEY = "econtabil-tema";
export function iniciarTema(botao){
  try { const t = localStorage.getItem(KEY); if (t) document.documentElement.dataset.theme = t; } catch(e){}
  if (!botao) return;
  botao.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const novo = dark ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try { localStorage.setItem(KEY, novo); } catch(e){}
  });
}
