// Calculateur de criticité HACCP amélioré V18

function calculer() {
  const freq = Number(document.getElementById("frequence").value);
  const grav = Number(document.getElementById("gravite").value);
  const mait = Number(document.getElementById("maitrise").value);
  
  if (!freq || !grav || !mait) {
    alert("Veuillez sélectionner toutes les valeurs");
    return;
  }

  const score = freq * grav * mait;
  
  // Affichage du score
  document.getElementById("score").textContent = score;
  
  // Classification
  const classif = classification(score);
  const classifElem = document.getElementById("classification");
  classifElem.textContent = classif;
  
  // Couleur selon criticité
  const resultBox = document.querySelector(".result-box");
  if (score >= 15) {
    resultBox.style.background = "linear-gradient(135deg, #dc3545, #c82333)";
  } else if (score >= 8) {
    resultBox.style.background = "linear-gradient(135deg, #ffc107, #e0a800)";
  } else {
    resultBox.style.background = "linear-gradient(135deg, #28a745, #218838)";
  }
  
  // Détails du calcul
  document.getElementById("freqVal").textContent = freq;
  document.getElementById("gravVal").textContent = grav;
  document.getElementById("maitVal").textContent = mait;
  
  // Interprétation
  document.getElementById("interpretation").textContent = interpretation(score);
  
  // Recommandation
  document.getElementById("recommandation").textContent = recommandation(score);
  
  // Justification
  document.getElementById("justification").textContent = justification(score, freq, grav, mait);
  
  // Afficher les résultats
  document.getElementById("resultats").style.display = "block";
  
  // Sauvegarde historique
  sauvegarderHistorique(score, classif);
  
  // Scroll vers résultats
  document.getElementById("resultats").scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function classification(score) {
  if (score >= 15) return "CCP CRITIQUE";
  if (score >= 8) return "POINT SENSIBLE (PRPo)";
  return "DANGER MAÎTRISÉ (PRP)";
}

function interpretation(score) {
  if (score >= 15) {
    return "⚠️ Risque sanitaire ÉLEVÉ nécessitant une action immédiate. Ce point doit être considéré comme un CCP (Critical Control Point) avec surveillance renforcée et limites critiques définies.";
  }
  if (score >= 8) {
    return "⚡ Risque sanitaire MODÉRÉ nécessitant une surveillance renforcée. Ce point sensible (PRPo) requiert des mesures de maîtrise spécifiques et un contrôle régulier.";
  }
  return "✅ Risque sanitaire FAIBLE, actuellement maîtrisé. Les bonnes pratiques d'hygiène (BPH) en place sont suffisantes. Maintenir la surveillance de routine.";
}

function recommandation(score) {
  if (score >= 15) {
    return "Actions requises : Revoir immédiatement le CCP, renforcer les contrôles systématiques, définir des limites critiques précises, former le personnel et documenter toutes les actions correctives. Audit de vérification obligatoire.";
  }
  if (score >= 8) {
    return "Actions recommandées : Améliorer la surveillance, vérifier la conformité terrain, mettre à jour les procédures, sensibiliser le personnel et documenter les écarts. Contrôle renforcé pendant 1 mois.";
  }
  return "Actions à maintenir : Poursuivre les pratiques actuelles, maintenir la surveillance de routine et la traçabilité. Révision annuelle lors de l'audit PMS.";
}

function justification(score, freq, grav, mait) {
  let texte = "Analyse HACCP : ";
  
  if (score >= 15) {
    texte += "Le danger identifié présente une combinaison critique avec ";
    if (freq >= 3) texte += "une fréquence ÉLEVÉE d'occurrence, ";
    if (grav >= 3) texte += "une gravité IMPORTANTE pour la santé des consommateurs, ";
    if (mait >= 3) texte += "et une maîtrise INSUFFISANTE ou inexistante. ";
    texte += "Cette situation expose l'établissement à un risque sanitaire majeur et justifie un classement en CCP.";
  } else if (score >= 8) {
    texte += "Le danger nécessite une attention particulière car ";
    if (freq === 3) texte += "il survient fréquemment, ";
    else if (grav === 3) texte += "ses conséquences peuvent être graves, ";
    else if (mait === 3) texte += "les mesures de maîtrise sont limitées, ";
    texte += "justifiant un suivi renforcé en tant que point sensible (PRPo).";
  } else {
    texte += "Le danger est actuellement bien maîtrisé. ";
    if (freq === 1) texte += "Son occurrence est rare, ";
    if (grav === 1) texte += "ses conséquences sont limitées, ";
    if (mait === 1) texte += "et les mesures préventives sont efficaces. ";
    texte += "Le maintien des bonnes pratiques d'hygiène (BPH) suffit.";
  }
  
  return texte;
}

function sauvegarderHistorique(score, classif) {
  const historique = {
    date: new Date().toLocaleString('fr-FR'),
    score: score,
    classification: classif,
    frequence: document.getElementById("frequence").value,
    gravite: document.getElementById("gravite").value,
    maitrise: document.getElementById("maitrise").value
  };
  
  try {
    let historiques = JSON.parse(localStorage.getItem("historiqueHACCP") || "[]");
    historiques.unshift(historique);
    historiques = historiques.slice(0, 10); // Garder 10 derniers
    localStorage.setItem("historiqueHACCP", JSON.stringify(historiques));
  } catch (e) {
    console.error("Erreur sauvegarde historique:", e);
  }
}

function exporterAnalyse() {
  const score = document.getElementById("score").textContent;
  const classif = document.getElementById("classification").textContent;
  const interp = document.getElementById("interpretation").textContent;
  const reco = document.getElementById("recommandation").textContent;
  const just = document.getElementById("justification").textContent;
  
  const texte = `
═══════════════════════════════════════════════════
  ANALYSE HACCP - ÉVALUATION DE LA CRITICITÉ
═══════════════════════════════════════════════════

Date : ${new Date().toLocaleString('fr-FR')}
Établissement : ___________________________________

RÉSULTATS DU CALCUL
───────────────────
Score de criticité : ${score}
Classification : ${classif}

DÉTAILS DU CALCUL
─────────────────
Fréquence : ${document.getElementById("freqVal").textContent}
Gravité : ${document.getElementById("gravVal").textContent}
Maîtrise : ${document.getElementById("maitVal").textContent}

INTERPRÉTATION
──────────────
${interp}

JUSTIFICATION TECHNIQUE
───────────────────────
${just}

RECOMMANDATIONS
───────────────
${reco}

═══════════════════════════════════════════════════
Document généré par Plateforme PMS
GRETA GIP-FIPAN - Académie de Nice
═══════════════════════════════════════════════════
  `.trim();
  
  // Créer et télécharger le fichier
  const blob = new Blob([texte], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Analyse_HACCP_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function afficherHistorique() {
  try {
    const historiques = JSON.parse(localStorage.getItem("historiqueHACCP") || "[]");
    
    if (historiques.length === 0) {
      alert("Aucun historique d'évaluation disponible.");
      return;
    }
    
    let html = `
      <div style="max-height: 400px; overflow-y: auto; background: white; padding: 1.5rem; border-radius: 12px; border: 2px solid #0055a4;">
        <h3 style="color: #0055a4; margin-bottom: 1rem;">📊 Historique des évaluations</h3>
    `;
    
    historiques.forEach((h, index) => {
      html += `
        <div style="padding: 1rem; margin-bottom: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${h.score >= 15 ? '#dc3545' : h.score >= 8 ? '#ffc107' : '#28a745'};">
          <strong>${h.date}</strong><br>
          Score: ${h.score} - ${h.classification}<br>
          <small>F: ${h.frequence} | G: ${h.gravite} | M: ${h.maitrise}</small>
        </div>
      `;
    });
    
    html += `</div>`;
    
    const modal = document.createElement('div');
    modal.innerHTML = html;
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.zIndex = '10000';
    modal.style.maxWidth = '600px';
    modal.style.width = '90%';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '9999';
    overlay.onclick = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(modal);
    };
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
  } catch (e) {
    console.error("Erreur lecture historique:", e);
    alert("Erreur lors de la lecture de l'historique.");
  }
}

function reinitialiser() {
  document.getElementById("frequence").value = "";
  document.getElementById("gravite").value = "";
  document.getElementById("maitrise").value = "";
  document.getElementById("resultats").style.display = "none";
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Cacher les résultats au départ
  const resultats = document.getElementById("resultats");
  if (resultats) {
    resultats.style.display = "none";
  }
});
