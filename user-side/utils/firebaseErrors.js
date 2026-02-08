export const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
        case "auth/invalid-email":
            return "L'adresse email semble invalide. Vérifiez qu'il n'y a pas de fautes. 📧";
        case "auth/user-disabled":
            return "Ce compte a été désactivé. Veuillez contacter le support. 🚫";
        case "auth/user-not-found":
            return "Aucun compte trouvé avec cet email. Voulez-vous en créer un ? 🤷‍♂️";
        case "auth/wrong-password":
            return "Mot de passe incorrect. Réessayez ! 🔐";
        case "auth/email-already-in-use":
            return "Cet email est déjà utilisé. Essayez de vous connecter. 📩";
        case "auth/weak-password":
            return "Le mot de passe est trop faible. Ajoutez des caractères ! 💪";
        case "auth/operation-not-allowed":
            return "La connexion n'est pas activée. Contactez l'admin. 🛠️";
        case "auth/network-request-failed":
            return "Problème de connexion internet. Vérifiez votre réseau. 📡";
        case "auth/too-many-requests":
            return "Trop de tentatives ! Réessayez plus tard. ⏳";
        case "auth/credential-already-in-use":
            return "Ces identifiants sont déjà liés à un autre compte. 🔗";
        default:
            return "Une erreur inattendue est survenue. Réessayez. 😵 (" + errorCode + ")";
    }
};
