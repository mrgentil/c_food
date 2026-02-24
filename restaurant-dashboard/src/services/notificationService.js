/**
 * Service pour envoyer des notifications Push via Expo
 */

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
    if (!expoPushToken) {
        console.log('Aucun token de notification trouvé pour cet utilisateur');
        return;
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        console.log('Résultat de l\'envoi de la notification :', result);
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification Push :', error);
    }
};
